/* ============================================================
   Daily Scoreboard — push reminder worker (Cloudflare Workers)

   The PWA posts its live totals here; a cron job evaluates the
   reminder rules and sends Web Push messages (bare pushes — the
   service worker fetches /notification for the content, which
   avoids payload encryption entirely).

   KV layout:
     vapid        -> { publicRaw, publicJwk, privateJwk }
     user:<id>    -> { subscription, tz, state, flags, pending }
   ============================================================ */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (path === "/vapid-public-key" && request.method === "GET") {
        const vapid = await ensureVapid(env);
        return json({ key: vapid.publicRaw });
      }

      if (path === "/subscribe" && request.method === "POST") {
        const body = await request.json();
        if (!body.id || !body.subscription || !body.subscription.endpoint) {
          return json({ error: "id and subscription required" }, 400);
        }
        const user = (await getUser(env, body.id)) || {};
        user.subscription = body.subscription;
        user.tz = body.tz || user.tz || "Europe/London";
        user.pending = user.pending || [];
        user.flags = user.flags || {};
        await putUser(env, body.id, user);
        return json({ ok: true });
      }

      if (path === "/unsubscribe" && request.method === "POST") {
        const body = await request.json();
        if (body.id) await env.DATA.delete("user:" + body.id);
        return json({ ok: true });
      }

      if (path === "/state" && request.method === "POST") {
        const body = await request.json();
        if (!body.id) return json({ error: "id required" }, 400);
        const user = (await getUser(env, body.id)) || { pending: [], flags: {} };
        user.tz = body.tz || user.tz || "Europe/London";
        user.state = {
          date: body.date,
          cal: num(body.cal),
          calTarget: num(body.calTarget, 1900),
          protein: num(body.protein),
          proteinTarget: num(body.proteinTarget, 150),
          water: num(body.water),
          waterTarget: num(body.waterTarget, 3000),
          lastWaterAt: num(body.lastWaterAt),
          lastEntryAt: num(body.lastEntryAt),
          updatedAt: Date.now(),
        };
        // new day -> reset one-shot flags
        if (user.flags && user.flags.date !== body.date) {
          user.flags = { date: body.date };
        }
        await putUser(env, body.id, user);
        return json({ ok: true });
      }

      if (path === "/notification" && request.method === "GET") {
        const id = url.searchParams.get("id");
        if (!id) return json({ error: "id required" }, 400);
        const user = await getUser(env, id);
        let note = { title: "Daily Scoreboard", body: "Check today's progress.", tag: "ds-general" };
        if (user && user.pending && user.pending.length) {
          note = user.pending.shift();
          await putUser(env, id, user);
        }
        return json(note);
      }

      if (path === "/test" && request.method === "POST") {
        const body = await request.json();
        const user = await getUser(env, body.id);
        if (!user || !user.subscription) return json({ error: "not subscribed" }, 404);
        await queueAndPush(env, body.id, user, {
          title: "Scoreboard is live 🏟️",
          body: "Test notification — reminders are working.",
          tag: "ds-test",
        });
        return json({ ok: true });
      }

      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminderSweep(env));
  },
};

/* ---------- storage helpers ---------- */

const num = (v, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);

async function getUser(env, id) {
  return env.DATA.get("user:" + id, "json");
}

async function putUser(env, id, user) {
  await env.DATA.put("user:" + id, JSON.stringify(user));
}

/* ---------- reminder rules ---------- */

async function runReminderSweep(env) {
  let cursor;
  do {
    const page = await env.DATA.list({ prefix: "user:", cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const key of page.keys) {
      const id = key.name.slice(5);
      const user = await env.DATA.get(key.name, "json");
      if (!user || !user.subscription) continue;
      try {
        await evaluateUser(env, id, user);
      } catch (err) {
        console.log("evaluate failed for", id, err);
      }
    }
  } while (cursor);
}

function localNow(tz) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10) % 24,
    minute: parseInt(get("minute"), 10),
    epoch: now.getTime(),
  };
}

async function evaluateUser(env, id, user) {
  const tz = user.tz || "Europe/London";
  const { date, hour, epoch } = localNow(tz);
  const s = user.state;

  // Only nudge for days the user has actually opened the app on.
  if (!s || s.date !== date) return;

  let flags = user.flags || {};
  if (flags.date !== date) flags = { date };

  const notes = [];
  const HOUR = 3600 * 1000;

  // 1) No water logged in 2+ hours (08:00–22:00, target not yet hit)
  if (hour >= 8 && hour < 22 && s.water < s.waterTarget) {
    const lastWater = s.lastWaterAt || 0;
    const lastNudge = flags.hydrationAt || 0;
    const sinceWater = epoch - lastWater;
    const sinceNudge = epoch - lastNudge;
    if (sinceWater >= 2 * HOUR && sinceNudge >= 2 * HOUR) {
      notes.push({
        title: "💧 Hydration check",
        body: `No water logged in 2+ hours. You're at ${s.water}ml of ${s.waterTarget}ml — a glass gets the board moving.`,
        tag: "ds-water",
      });
      flags.hydrationAt = epoch;
    }
  }

  // 2) Protein behind pace by mid-afternoon (<40% of target at 3pm)
  if (hour >= 15 && hour < 21 && !flags.proteinSent && s.protein < 0.4 * s.proteinTarget) {
    notes.push({
      title: "🥩 Protein behind pace",
      body: `${s.protein}g of ${s.proteinTarget}g by mid-afternoon. Time for a high-protein hit.`,
      tag: "ds-protein",
    });
    flags.proteinSent = true;
  }

  // 3) Calorie target hit early in the day
  if (hour < 18 && !flags.calEarlySent && s.cal >= s.calTarget) {
    notes.push({
      title: "🎯 Calorie target hit early",
      body: `${s.cal} kcal of ${s.calTarget} already on the board. Anything more puts you over.`,
      tag: "ds-cal-early",
    });
    flags.calEarlySent = true;
  }

  // 4) Significantly under target late in the day (<60% at 8pm)
  if (hour >= 20 && hour < 23 && !flags.calLateSent && s.cal < 0.6 * s.calTarget) {
    notes.push({
      title: "🍽️ Well under target",
      body: `Only ${s.cal} kcal of ${s.calTarget} with the day nearly done — get a proper meal in.`,
      tag: "ds-cal-late",
    });
    flags.calLateSent = true;
  }

  if (notes.length === 0) return;

  user.flags = flags;
  user.pending = (user.pending || []).concat(notes).slice(-3);
  await putUser(env, id, user);

  // One bare push wakes the service worker; it fetches /notification for content.
  const status = await sendPush(env, user.subscription);
  if (status === 404 || status === 410) {
    await env.DATA.delete("user:" + id);
  }
}

async function queueAndPush(env, id, user, note) {
  user.pending = (user.pending || []).concat([note]).slice(-3);
  await putUser(env, id, user);
  const status = await sendPush(env, user.subscription);
  if (status >= 400) throw new Error("push rejected: " + status);
}

/* ---------- Web Push (VAPID, bare push — no payload) ---------- */

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const b64urlFromString = (str) => b64url(new TextEncoder().encode(str));

async function ensureVapid(env) {
  let vapid = await env.DATA.get("vapid", "json");
  if (vapid) return vapid;
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
  );
  const publicRawBuf = await crypto.subtle.exportKey("raw", pair.publicKey);
  vapid = {
    publicRaw: b64url(publicRawBuf),
    publicJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
    privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
  };
  await env.DATA.put("vapid", JSON.stringify(vapid));
  return vapid;
}

async function vapidAuthHeader(env, endpoint) {
  const vapid = await ensureVapid(env);
  const key = await crypto.subtle.importKey(
    "jwk", vapid.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const aud = new URL(endpoint).origin;
  const header = b64urlFromString(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = b64urlFromString(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:push@daily-scoreboard.invalid",
  }));
  const signingInput = header + "." + payload;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );
  return `vapid t=${signingInput}.${b64url(sig)}, k=${vapid.publicRaw}`;
}

async function sendPush(env, subscription) {
  try {
    const auth = await vapidAuthHeader(env, subscription.endpoint);
    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: auth,
        TTL: "3600",
        Urgency: "normal",
        "Content-Length": "0",
      },
    });
    return res.status;
  } catch (err) {
    console.log("push send failed:", err);
    return 0;
  }
}
