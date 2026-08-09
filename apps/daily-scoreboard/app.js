/* ============================================================
   Daily Scoreboard — app logic
   Vanilla JS, no build step. Data lives in localStorage.
   ============================================================ */
(() => {
  "use strict";

  const STORAGE_KEY = "dailyScoreboard.v1";

  /* ---------- Defaults ---------- */

  // Dairy-free quick-add items: name, kcal, protein (g)
  const DEFAULT_QUICK_ITEMS = [
    { id: "q1", name: "2 Eggs", cal: 156, protein: 13 },
    { id: "q2", name: "Chicken breast (150g)", cal: 248, protein: 46 },
    { id: "q3", name: "Vegan protein shake", cal: 120, protein: 25 },
    { id: "q4", name: "Salmon fillet (130g)", cal: 270, protein: 29 },
    { id: "q5", name: "Tuna (1 can)", cal: 116, protein: 26 },
    { id: "q6", name: "Oats (60g, water)", cal: 230, protein: 8 },
    { id: "q7", name: "Banana", cal: 105, protein: 1 },
    { id: "q8", name: "Rice (200g cooked)", cal: 260, protein: 5 },
    { id: "q9", name: "Peanut butter (2 tbsp)", cal: 190, protein: 8 },
    { id: "q10", name: "Tofu (150g)", cal: 117, protein: 14 },
  ];

  const DEFAULT_SETTINGS = {
    proteinTarget: 150,
    waterTarget: 3000,
    restCal: 1900,
    trainCal: 2300,
    quickItems: DEFAULT_QUICK_ITEMS,
    workerUrl: "",
    pushEnabled: false,
    clientId: null,
  };

  /* ---------- State ---------- */

  let state = load();
  let activeTab = "today";
  let customFormOpen = false;
  let lastAction = null; // { undo: fn, label: string }
  let toastTimer = null;
  let syncTimer = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings);
        s.days = s.days || {};
        return s;
      }
    } catch (e) { /* corrupted -> start fresh */ }
    return { settings: Object.assign({}, DEFAULT_SETTINGS), days: {} };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  if (!state.settings.clientId) {
    state.settings.clientId = uid() + uid();
    save();
  }

  /* ---------- Helpers ---------- */

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function todayKey(d) {
    d = d || new Date();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function getDay(key) {
    key = key || todayKey();
    if (!state.days[key]) {
      state.days[key] = { mode: "rest", entries: [], water: [] };
    }
    return state.days[key];
  }

  function calTargetFor(day) {
    return day.mode === "training" ? state.settings.trainCal : state.settings.restCal;
  }

  function totals(day) {
    let cal = 0, protein = 0, water = 0, lastWaterAt = 0, lastEntryAt = 0;
    for (const e of day.entries) {
      cal += e.cal; protein += e.protein;
      if (e.t > lastEntryAt) lastEntryAt = e.t;
    }
    for (const w of day.water) {
      water += w.ml;
      if (w.t > lastWaterAt) lastWaterAt = w.t;
    }
    return { cal, protein, water, lastWaterAt, lastEntryAt };
  }

  function fmtTime(t) {
    const d = new Date(t);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function fmtInt(n) { return Math.round(n).toLocaleString("en-GB"); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  /* ---------- Toast + undo ---------- */

  const toastEl = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  const toastUndo = document.getElementById("toastUndo");

  function showToast(msg, undoFn) {
    clearTimeout(toastTimer);
    toastMsg.textContent = msg;
    lastAction = undoFn ? { undo: undoFn } : null;
    toastUndo.hidden = !undoFn;
    toastEl.hidden = false;
    toastTimer = setTimeout(() => { toastEl.hidden = true; lastAction = null; }, 4500);
  }

  toastUndo.addEventListener("click", () => {
    if (lastAction) {
      lastAction.undo();
      lastAction = null;
      toastEl.hidden = true;
      save();
      render();
      scheduleSync();
    }
  });

  /* ---------- Actions ---------- */

  function addEntry(name, cal, protein) {
    const day = getDay();
    const entry = { id: uid(), name, cal: Math.round(cal), protein: Math.round(protein), t: Date.now() };
    day.entries.push(entry);
    save(); render(); scheduleSync(); vibrate(10);
    showToast(`Logged ${name} · ${fmtInt(cal)} kcal`, () => {
      const d = getDay();
      d.entries = d.entries.filter((e) => e.id !== entry.id);
    });
  }

  function addWater(ml) {
    const day = getDay();
    const w = { id: uid(), ml, t: Date.now() };
    day.water.push(w);
    save(); render(); scheduleSync(); vibrate(10);
    showToast(`+${ml}ml water`, () => {
      const d = getDay();
      d.water = d.water.filter((x) => x.id !== w.id);
    });
  }

  function deleteEntry(id) {
    const day = getDay();
    const entry = day.entries.find((e) => e.id === id);
    if (!entry) return;
    day.entries = day.entries.filter((e) => e.id !== id);
    save(); render(); scheduleSync();
    showToast(`Removed ${entry.name}`, () => {
      getDay().entries.push(entry);
      getDay().entries.sort((a, b) => a.t - b.t);
    });
  }

  function deleteWater(id) {
    const day = getDay();
    const w = day.water.find((x) => x.id === id);
    if (!w) return;
    day.water = day.water.filter((x) => x.id !== id);
    save(); render(); scheduleSync();
    showToast(`Removed ${w.ml}ml water`, () => {
      getDay().water.push(w);
      getDay().water.sort((a, b) => a.t - b.t);
    });
  }

  function setMode(mode) {
    getDay().mode = mode;
    save(); render(); scheduleSync(); vibrate(10);
  }

  /* ---------- Pace / nudges (mirrors the push worker's rules) ---------- */

  function proteinPaceExpected(now) {
    // Expected fraction of protein target between 08:00 and 21:00
    const h = now.getHours() + now.getMinutes() / 60;
    return Math.max(0, Math.min(1, (h - 8) / 13));
  }

  function currentNudge() {
    const now = new Date();
    const h = now.getHours();
    const day = getDay();
    const t = totals(day);
    const calTarget = calTargetFor(day);
    const s = state.settings;

    if (t.cal >= calTarget && h < 18) {
      return { tone: "good", title: "Target hit early", body: `${fmtInt(t.cal)} kcal of ${fmtInt(calTarget)} already logged — coast from here.` };
    }
    if (h >= 8 && h < 22 && t.water < s.waterTarget) {
      const last = t.lastWaterAt || new Date(now).setHours(8, 0, 0, 0);
      if (now - last >= 2 * 3600 * 1000) {
        return { tone: "info", title: "Hydration check", body: `No water logged in 2+ hours. You're at ${fmtInt(t.water)}ml of ${fmtInt(s.waterTarget)}ml.` };
      }
    }
    if (h >= 15 && t.protein < 0.4 * s.proteinTarget) {
      return { tone: "warn", title: "Protein behind pace", body: `${fmtInt(t.protein)}g of ${fmtInt(s.proteinTarget)}g so far — time for a high-protein meal.` };
    }
    if (h >= 20 && t.cal < 0.6 * calTarget) {
      return { tone: "warn", title: "Well under target", body: `Only ${fmtInt(t.cal)} kcal of ${fmtInt(calTarget)} with the day nearly done.` };
    }
    return null;
  }

  /* ---------- Rendering ---------- */

  const view = document.getElementById("view");

  function render() {
    document.getElementById("topbarDate").textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
    document.querySelectorAll(".tab").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.tab === activeTab));
    });
    if (activeTab === "today") renderToday();
    else if (activeTab === "history") renderHistory();
    else renderSettings();
  }

  function ring(frac, color, big, of, label, sub, over) {
    const C = 2 * Math.PI * 52;
    const f = Math.max(0, Math.min(1, frac));
    const stroke = over ? "var(--danger)" : color;
    return `
      <div class="ring-tile">
        <div class="ring-wrap">
          <svg viewBox="0 0 120 120">
            <circle class="ring-track" cx="60" cy="60" r="52" fill="none" stroke-width="9"></circle>
            <circle class="ring-val" cx="60" cy="60" r="52" fill="none" stroke-width="9"
              stroke="${stroke}" stroke-dasharray="${C.toFixed(1)}"
              stroke-dashoffset="${(C * (1 - f)).toFixed(1)}"></circle>
          </svg>
          <div class="ring-center">
            <div class="big" style="color:${over ? "var(--danger)" : color}">${big}</div>
            <div class="of">${of}</div>
          </div>
        </div>
        <div class="ring-label" style="color:${color}">${label}</div>
        <div class="ring-sub">${sub}</div>
      </div>`;
  }

  function renderToday() {
    const day = getDay();
    const t = totals(day);
    const s = state.settings;
    const calTarget = calTargetFor(day);
    const now = new Date();

    const calRemaining = calTarget - t.cal;
    const proteinRemaining = Math.max(0, s.proteinTarget - t.protein);
    const waterRemaining = Math.max(0, s.waterTarget - t.water);

    const expected = proteinPaceExpected(now) * s.proteinTarget;
    const onPace = t.protein >= expected * 0.9;

    const nudge = currentNudge();

    // combined chronological log
    const log = [
      ...day.entries.map((e) => ({ kind: "food", ...e })),
      ...day.water.map((w) => ({ kind: "water", ...w })),
    ].sort((a, b) => b.t - a.t);

    const showInstallTip = isIOS() && !isStandalone();

    view.innerHTML = `
      ${nudge ? `
        <div class="nudge ${nudge.tone}">
          <div><b>${esc(nudge.title)}</b>${esc(nudge.body)}</div>
        </div>` : ""}

      <div class="mode-toggle" role="group" aria-label="Day mode">
        <button data-mode="rest" aria-pressed="${day.mode === "rest"}">Rest day<span class="kcal">${fmtInt(s.restCal)} kcal</span></button>
        <button data-mode="training" aria-pressed="${day.mode === "training"}">Training day<span class="kcal">${fmtInt(s.trainCal)} kcal</span></button>
      </div>

      <div class="card">
        <div class="rings">
          ${ring(t.cal / calTarget, "var(--clay)", fmtInt(t.cal), `/ ${fmtInt(calTarget)}`, "Calories",
            calRemaining >= 0 ? `${fmtInt(calRemaining)} left` : `${fmtInt(-calRemaining)} over`, t.cal > calTarget)}
          ${ring(t.protein / s.proteinTarget, "var(--chartreuse)", fmtInt(t.protein) + "g", `/ ${fmtInt(s.proteinTarget)}g`, "Protein",
            proteinRemaining > 0 ? `${fmtInt(proteinRemaining)}g left` : "Target hit ✓", false)}
          ${ring(t.water / s.waterTarget, "var(--sky)", fmtInt(t.water), `/ ${fmtInt(s.waterTarget)}ml`, "Water",
            waterRemaining > 0 ? `${fmtInt(waterRemaining)}ml left` : "Target hit ✓", false)}
        </div>
        <div class="statusline">
          <span class="chip ${onPace ? "good" : "warn"}">Protein ${onPace ? "on pace" : "behind pace"}</span>
          <span class="chip ${t.cal > calTarget ? "warn" : "info"}">${day.mode === "training" ? "Training" : "Rest"} · ${fmtInt(calTarget)} kcal</span>
        </div>
      </div>

      <div class="card">
        <h2>Water <span class="h-action">${fmtInt(t.water)} / ${fmtInt(s.waterTarget)}ml</span></h2>
        <div class="water-row">
          <button class="water-btn" data-water="250">+250<small>ml</small></button>
          <button class="water-btn" data-water="500">+500<small>ml</small></button>
          <button class="water-btn" data-water="750">+750<small>ml</small></button>
        </div>
      </div>

      <div class="card">
        <h2>Quick add <button class="h-action" id="toggleCustom">${customFormOpen ? "Close" : "+ Custom"}</button></h2>
        ${customFormOpen ? `
          <form class="entry-form" id="customForm" style="margin-bottom:12px">
            <div class="field"><label for="cfName">Item</label>
              <input id="cfName" placeholder="e.g. Stir-fry" required maxlength="60" /></div>
            <div class="row2">
              <div class="field"><label for="cfCal">Calories</label>
                <input id="cfCal" type="number" inputmode="numeric" min="0" max="5000" placeholder="kcal" required /></div>
              <div class="field"><label for="cfProt">Protein (g)</label>
                <input id="cfProt" type="number" inputmode="numeric" min="0" max="300" placeholder="g" value="0" /></div>
            </div>
            <button class="btn btn-primary" type="submit">Log it</button>
          </form>` : ""}
        <div class="quick-grid">
          ${s.quickItems.map((q) => `
            <button class="quick-btn" data-quick="${q.id}">
              <span class="qn">${esc(q.name)}</span>
              <span class="qm">${fmtInt(q.cal)} kcal · <b>${fmtInt(q.protein)}g</b></span>
            </button>`).join("")}
        </div>
      </div>

      <div class="card">
        <h2>Today's log</h2>
        ${log.length === 0 ? `<div class="empty-note">Nothing logged yet — put some points on the board.</div>` : `
        <ul class="log-list">
          ${log.map((item) => item.kind === "food" ? `
            <li>
              <span class="log-dot" style="background:var(--chartreuse)"></span>
              <div class="log-main">
                <div class="ln">${esc(item.name)}</div>
                <div class="lm">${fmtInt(item.cal)} kcal · ${fmtInt(item.protein)}g protein</div>
              </div>
              <span class="log-time">${fmtTime(item.t)}</span>
              <button class="log-del" data-del-entry="${item.id}" aria-label="Delete ${esc(item.name)}">×</button>
            </li>` : `
            <li>
              <span class="log-dot" style="background:var(--sky)"></span>
              <div class="log-main">
                <div class="ln">Water</div>
                <div class="lm">${fmtInt(item.ml)}ml</div>
              </div>
              <span class="log-time">${fmtTime(item.t)}</span>
              <button class="log-del" data-del-water="${item.id}" aria-label="Delete water">×</button>
            </li>`).join("")}
        </ul>`}
      </div>

      ${showInstallTip ? `
      <div class="card install-tip">
        <h2>Install on your iPhone</h2>
        Tap <svg class="share-ico" viewBox="0 0 24 24"><path d="M12 2l4 4h-3v9h-2V6H8l4-4zM5 10h4v2H7v8h10v-8h-2v-2h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z"/></svg>
        <b>Share</b> in Safari, then <b>Add to Home Screen</b>. Opening it from the Home Screen unlocks push notifications and full-screen mode.
      </div>` : ""}
    `;

    // wire up
    view.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => setMode(b.dataset.mode)));
    view.querySelectorAll("[data-water]").forEach((b) =>
      b.addEventListener("click", () => addWater(parseInt(b.dataset.water, 10))));
    view.querySelectorAll("[data-quick]").forEach((b) =>
      b.addEventListener("click", () => {
        const q = s.quickItems.find((x) => x.id === b.dataset.quick);
        if (q) addEntry(q.name, q.cal, q.protein);
      }));
    view.querySelectorAll("[data-del-entry]").forEach((b) =>
      b.addEventListener("click", () => deleteEntry(b.dataset.delEntry)));
    view.querySelectorAll("[data-del-water]").forEach((b) =>
      b.addEventListener("click", () => deleteWater(b.dataset.delWater)));

    const toggleCustom = document.getElementById("toggleCustom");
    toggleCustom.addEventListener("click", () => {
      customFormOpen = !customFormOpen;
      render();
      if (customFormOpen) document.getElementById("cfName").focus();
    });
    const cf = document.getElementById("customForm");
    if (cf) cf.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cfName").value.trim();
      const cal = parseFloat(document.getElementById("cfCal").value);
      const prot = parseFloat(document.getElementById("cfProt").value) || 0;
      if (!name || !(cal >= 0)) return;
      customFormOpen = false;
      addEntry(name, cal, prot);
    });
  }

  /* ---------- History ---------- */

  function lastNDays(n) {
    const out = [];
    const d = new Date();
    for (let i = 0; i < n; i++) {
      out.unshift(todayKey(d));
      d.setDate(d.getDate() - 1);
    }
    return out;
  }

  function dayHits(key) {
    const day = state.days[key];
    if (!day) return null;
    const t = totals(day);
    const s = state.settings;
    const calTarget = calTargetFor(day);
    return {
      t, calTarget,
      cal: t.cal > 0 && t.cal <= calTarget && t.cal >= 0.5 * calTarget,
      protein: t.protein >= s.proteinTarget,
      water: t.water >= s.waterTarget,
    };
  }

  function streak() {
    // consecutive "perfect" days (all three hit), counting back from today or yesterday
    let n = 0;
    const d = new Date();
    const today = dayHits(todayKey(d));
    const perfect = (h) => h && h.cal && h.protein && h.water;
    if (!perfect(today)) d.setDate(d.getDate() - 1); // today may still be in progress
    for (;;) {
      const h = dayHits(todayKey(d));
      if (!perfect(h)) break;
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function chart(keys, getVal, getTarget, color, unit) {
    const vals = keys.map((k) => {
      const day = state.days[k];
      return day ? getVal(totals(day), day) : 0;
    });
    const targets = keys.map((k) => {
      const day = state.days[k];
      return getTarget(day);
    });
    const max = Math.max(...vals, ...targets, 1) * 1.05;
    const avgTarget = targets.reduce((a, b) => a + b, 0) / targets.length;
    const targetPct = (avgTarget / max) * 100;
    return `
      <div class="chart">
        <div class="chart-target" style="bottom:${targetPct.toFixed(1)}%"></div>
        ${vals.map((v, i) => {
          const hit = v >= targets[i] && v > 0;
          const overCal = unit === "kcal" && v > targets[i];
          const bg = v === 0 ? "var(--line-2)" : overCal ? "var(--danger)" : hit || unit === "kcal" ? color : "color-mix(in srgb, " + color + " 45%, var(--line-2))";
          return `<div class="cbar" style="height:${Math.max(2, (v / max) * 100).toFixed(1)}%;background:${bg}" title="${fmtInt(v)} ${unit}"></div>`;
        }).join("")}
      </div>
      <div class="chart-labels">
        ${keys.map((k, i) => `<span>${i % 2 === (keys.length - 1) % 2 ? parseInt(k.slice(8), 10) : ""}</span>`).join("")}
      </div>`;
  }

  function renderHistory() {
    const s = state.settings;
    const keys14 = lastNDays(14);
    const keys7 = lastNDays(7);

    // 7-day averages over days with data
    let sums = { cal: 0, protein: 0, water: 0 }, count = 0;
    for (const k of keys7) {
      const day = state.days[k];
      if (!day) continue;
      const t = totals(day);
      if (t.cal === 0 && t.water === 0) continue;
      sums.cal += t.cal; sums.protein += t.protein; sums.water += t.water;
      count++;
    }
    const avg = (x) => (count ? fmtInt(x / count) : "—");

    const st = streak();

    // list of logged days, newest first, up to 30
    const loggedKeys = Object.keys(state.days)
      .filter((k) => {
        const t = totals(state.days[k]);
        return t.cal > 0 || t.water > 0 || t.protein > 0;
      })
      .sort()
      .reverse()
      .slice(0, 30);

    view.innerHTML = `
      ${st > 0 ? `<div class="card"><div class="streak-banner">🔥 ${st}-day perfect streak — all three targets hit</div></div>` : ""}

      <div class="card">
        <h2>7-day averages</h2>
        <div class="avg-grid">
          <div class="avg-tile"><div class="av t-clay">${avg(sums.cal)}</div><div class="al">kcal / day</div></div>
          <div class="avg-tile"><div class="av t-chart">${avg(sums.protein)}g</div><div class="al">protein / day</div></div>
          <div class="avg-tile"><div class="av t-sky">${avg(sums.water)}</div><div class="al">ml / day</div></div>
        </div>
      </div>

      <div class="card">
        <h2>Calories · last 14 days</h2>
        ${chart(keys14, (t) => t.cal, (d) => (d ? calTargetFor(d) : (s.restCal + s.trainCal) / 2), "var(--clay)", "kcal")}
      </div>
      <div class="card">
        <h2>Protein · last 14 days</h2>
        ${chart(keys14, (t) => t.protein, () => s.proteinTarget, "var(--chartreuse)", "g")}
      </div>
      <div class="card">
        <h2>Water · last 14 days</h2>
        ${chart(keys14, (t) => t.water, () => s.waterTarget, "var(--sky)", "ml")}
      </div>

      <div class="card">
        <h2>Day by day</h2>
        ${loggedKeys.length === 0 ? `<div class="empty-note">No days logged yet.</div>` : loggedKeys.map((k) => {
          const day = state.days[k];
          const h = dayHits(k);
          const d = new Date(k + "T12:00:00");
          const isToday = k === todayKey();
          return `
            <div class="day-row">
              <div class="day-date">
                <div class="dd">${isToday ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}</div>
                <div class="dm">${d.toLocaleDateString("en-GB", { month: "short" })} · ${day.mode === "training" ? "train" : "rest"}</div>
              </div>
              <div class="day-stats">
                <span><b class="t-clay">${fmtInt(h.t.cal)}</b> kcal</span>
                <span><b class="t-chart">${fmtInt(h.t.protein)}g</b></span>
                <span><b class="t-sky">${fmtInt(h.t.water)}ml</b></span>
              </div>
              <div class="day-badges" aria-label="targets hit">
                <i class="${h.cal ? "on-clay" : ""}"></i>
                <i class="${h.protein ? "on-chart" : ""}"></i>
                <i class="${h.water ? "on-sky" : ""}"></i>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }

  /* ---------- Settings ---------- */

  function renderSettings() {
    const s = state.settings;
    const pushSupported = "serviceWorker" in navigator && "PushManager" in window;
    const needsInstall = isIOS() && !isStandalone();

    view.innerHTML = `
      <div class="card">
        <h2>Daily targets</h2>
        <div class="set-row"><label>Protein target<small>grams per day</small></label>
          <input type="number" inputmode="numeric" min="30" max="400" id="setProtein" value="${s.proteinTarget}" /></div>
        <div class="set-row"><label>Water target<small>ml per day</small></label>
          <input type="number" inputmode="numeric" min="500" max="8000" step="250" id="setWater" value="${s.waterTarget}" /></div>
        <div class="set-row"><label>Rest day calories<small>kcal</small></label>
          <input type="number" inputmode="numeric" min="800" max="6000" step="50" id="setRest" value="${s.restCal}" /></div>
        <div class="set-row"><label>Training day calories<small>kcal</small></label>
          <input type="number" inputmode="numeric" min="800" max="6000" step="50" id="setTrain" value="${s.trainCal}" /></div>
      </div>

      <div class="card">
        <h2>Notifications
          <span class="status-pill ${s.pushEnabled ? "on" : "off"}">${s.pushEnabled ? "ON" : "OFF"}</span>
        </h2>
        ${needsInstall ? `
          <p class="hint">On iPhone, push notifications only work once the app is <b>added to your Home Screen</b> (Safari → Share → Add to Home Screen) and opened from there.</p>` : ""}
        ${!pushSupported && !needsInstall ? `<p class="hint">Push isn't supported in this browser.</p>` : ""}
        <div class="stack" style="margin-top:8px">
          <div class="field"><label for="setWorkerUrl">Reminder server URL</label>
            <input id="setWorkerUrl" type="url" placeholder="https://daily-scoreboard-push.YOU.workers.dev"
              value="${esc(s.workerUrl)}" autocapitalize="off" autocorrect="off" spellcheck="false" /></div>
          ${s.pushEnabled ? `
            <button class="btn btn-sky" id="btnTestPush">Send test notification</button>
            <button class="btn btn-ghost" id="btnDisablePush">Disable notifications</button>
          ` : `
            <button class="btn btn-primary" id="btnEnablePush" ${needsInstall || !pushSupported ? "disabled" : ""}>Enable notifications</button>
          `}
          <p class="hint">Reminders: no water for 2+ hours · protein behind pace by 3pm · calorie target hit early · well under target late in the day. Deploy the free worker in <code>apps/daily-scoreboard/worker</code> and paste its URL above.</p>
        </div>
      </div>

      <div class="card">
        <h2>Quick-add items</h2>
        ${s.quickItems.map((q) => `
          <div class="qi-row">
            <span class="qi-name">${esc(q.name)}</span>
            <span class="qi-macros">${fmtInt(q.cal)} kcal · ${fmtInt(q.protein)}g</span>
            <button class="log-del" data-del-quick="${q.id}" aria-label="Remove ${esc(q.name)}">×</button>
          </div>`).join("")}
        <form id="quickForm" class="entry-form" style="margin-top:12px">
          <div class="field"><label for="qfName">New item</label>
            <input id="qfName" placeholder="Name" required maxlength="60" /></div>
          <div class="row2">
            <div class="field"><label for="qfCal">Calories</label>
              <input id="qfCal" type="number" inputmode="numeric" min="0" max="5000" placeholder="kcal" required /></div>
            <div class="field"><label for="qfProt">Protein (g)</label>
              <input id="qfProt" type="number" inputmode="numeric" min="0" max="300" placeholder="g" value="0" /></div>
          </div>
          <button class="btn btn-ghost" type="submit">Add quick item</button>
        </form>
      </div>

      <div class="card">
        <h2>Data</h2>
        <div class="stack">
          <button class="btn btn-ghost" id="btnExport">Export data (JSON)</button>
          <button class="btn btn-ghost" id="btnImport">Import data</button>
          <input type="file" id="importFile" accept="application/json" hidden />
          <button class="btn btn-danger" id="btnReset">Reset everything</button>
        </div>
      </div>`;

    // targets — save on change
    const bind = (id, key, min, max) => {
      document.getElementById(id).addEventListener("change", (e) => {
        const v = parseInt(e.target.value, 10);
        if (v >= min && v <= max) {
          state.settings[key] = v;
          save(); scheduleSync();
          showToast("Target updated");
        }
        render();
      });
    };
    bind("setProtein", "proteinTarget", 30, 400);
    bind("setWater", "waterTarget", 500, 8000);
    bind("setRest", "restCal", 800, 6000);
    bind("setTrain", "trainCal", 800, 6000);

    document.getElementById("setWorkerUrl").addEventListener("change", (e) => {
      state.settings.workerUrl = e.target.value.trim().replace(/\/+$/, "");
      save();
    });

    const btnEnable = document.getElementById("btnEnablePush");
    if (btnEnable) btnEnable.addEventListener("click", enablePush);
    const btnTest = document.getElementById("btnTestPush");
    if (btnTest) btnTest.addEventListener("click", sendTestPush);
    const btnDisable = document.getElementById("btnDisablePush");
    if (btnDisable) btnDisable.addEventListener("click", disablePush);

    view.querySelectorAll("[data-del-quick]").forEach((b) =>
      b.addEventListener("click", () => {
        state.settings.quickItems = state.settings.quickItems.filter((q) => q.id !== b.dataset.delQuick);
        save(); render();
      }));

    document.getElementById("quickForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("qfName").value.trim();
      const cal = parseInt(document.getElementById("qfCal").value, 10);
      const prot = parseInt(document.getElementById("qfProt").value, 10) || 0;
      if (!name || !(cal >= 0)) return;
      state.settings.quickItems.push({ id: uid(), name, cal, protein: prot });
      save(); render();
      showToast(`Added ${name} to quick-add`);
    });

    document.getElementById("btnExport").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `daily-scoreboard-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    document.getElementById("btnImport").addEventListener("click", () =>
      document.getElementById("importFile").click());
    document.getElementById("importFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || typeof data.days !== "object") throw new Error("bad file");
          const keepId = state.settings.clientId;
          state = data;
          state.settings = Object.assign({}, DEFAULT_SETTINGS, state.settings, { clientId: keepId });
          state.days = state.days || {};
          save(); render(); scheduleSync();
          showToast("Data imported");
        } catch {
          showToast("Couldn't read that file");
        }
      };
      reader.readAsText(file);
    });

    document.getElementById("btnReset").addEventListener("click", () => {
      if (confirm("Delete all logged days and settings? This can't be undone.")) {
        const keepId = state.settings.clientId;
        state = { settings: Object.assign({}, DEFAULT_SETTINGS, { clientId: keepId }), days: {} };
        save(); render();
        showToast("All data reset");
      }
    });
  }

  /* ---------- Push notifications ---------- */

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }

  function workerFetch(path, body) {
    const url = state.settings.workerUrl;
    if (!url) return Promise.reject(new Error("no worker url"));
    return fetch(url + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      keepalive: !!body,
    });
  }

  // Store worker config where the service worker can read it (IndexedDB)
  function writeSwConfig() {
    try {
      const req = indexedDB.open("ds-push", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => {
        const tx = req.result.transaction("kv", "readwrite");
        tx.objectStore("kv").put(
          { workerUrl: state.settings.workerUrl, id: state.settings.clientId },
          "cfg"
        );
      };
    } catch { /* non-fatal */ }
  }

  async function enablePush() {
    const s = state.settings;
    if (!s.workerUrl) {
      showToast("Paste your reminder server URL first");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        showToast("Notification permission was denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const res = await workerFetch("/vapid-public-key");
      if (!res.ok) throw new Error("server " + res.status);
      const { key } = await res.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const ok = await workerFetch("/subscribe", {
        id: s.clientId,
        subscription: sub.toJSON(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (!ok.ok) throw new Error("subscribe failed");
      s.pushEnabled = true;
      save(); writeSwConfig(); syncState(true); render();
      showToast("Notifications enabled 🎉");
    } catch (err) {
      console.error(err);
      showToast("Couldn't enable: " + (err.message || "check the server URL"));
    }
  }

  async function disablePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await workerFetch("/unsubscribe", { id: state.settings.clientId }).catch(() => {});
    } catch { /* ignore */ }
    state.settings.pushEnabled = false;
    save(); render();
    showToast("Notifications disabled");
  }

  async function sendTestPush() {
    try {
      const res = await workerFetch("/test", { id: state.settings.clientId });
      showToast(res.ok ? "Test sent — should arrive in a few seconds" : "Test failed (" + res.status + ")");
    } catch {
      showToast("Couldn't reach the reminder server");
    }
  }

  /* ---------- State sync to worker (for smart reminders) ---------- */

  function scheduleSync() {
    if (!state.settings.pushEnabled || !state.settings.workerUrl) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncState(), 1500);
  }

  function syncState(immediate) {
    const s = state.settings;
    if (!s.pushEnabled || !s.workerUrl) return;
    const day = getDay();
    const t = totals(day);
    const payload = {
      id: s.clientId,
      date: todayKey(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cal: t.cal,
      calTarget: calTargetFor(day),
      protein: t.protein,
      proteinTarget: s.proteinTarget,
      water: t.water,
      waterTarget: s.waterTarget,
      lastWaterAt: t.lastWaterAt,
      lastEntryAt: t.lastEntryAt,
    };
    workerFetch("/state", payload).catch(() => { /* offline is fine */ });
  }

  /* ---------- Tabs, day rollover, boot ---------- */

  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => {
      activeTab = b.dataset.tab;
      customFormOpen = false;
      render();
      window.scrollTo(0, 0);
    }));

  let renderedDay = todayKey();
  function checkRollover() {
    if (todayKey() !== renderedDay) {
      renderedDay = todayKey();
      render();
      scheduleSync();
    }
  }
  setInterval(checkRollover, 30 * 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkRollover();
      render();
    } else {
      // flush pending sync when backgrounding
      clearTimeout(syncTimer);
      syncState(true);
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(() => {
      if (state.settings.pushEnabled) writeSwConfig();
    }).catch(() => { /* still works without */ });
  }

  render();
  if (state.settings.pushEnabled) syncState(true);
})();
