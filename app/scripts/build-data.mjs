// Build practice-data.json from Pixie exports + the client work schedule export.
// Usage: node build-data.mjs <pixie-clients.csv> <pixie-contacts.csv> <schedule.txt> <out.json> [aliases.json]
import fs from "node:fs";

const [, , clientsCsv, contactsCsv, scheduleTxt, outPath, aliasPath] = process.argv;

// ---------- CSV parsing ----------
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length > 1 && r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const MANAGER_BY_EMAIL = {
  "bradley@youtopia.co.uk": "Bradley", "katherine@youtopia.co.uk": "Katherine",
  "david@youtopia.co.uk": "David", "mac@youtopia.co.uk": "Mac",
  "phoebe@youtopia.co.uk": "Phoebe", "krunal@youtopia.co.uk": "Krunal",
};
const managerName = (e) => MANAGER_BY_EMAIL[(e || "").toLowerCase()] || (e ? e.split("@")[0].replace(/^./, (c) => c.toUpperCase()) : "");

// ---------- Dates ----------
function ddmmyyToIso(s) {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  y = y.length === 2 ? "20" + y : y;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// ---------- Name normalisation / matching ----------
function norm(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\\&/g, "&")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(ltd|limited|llp|cic|c i c|uk|the|company|co|group|plc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Pixie clients ----------
const rawClients = parseCsv(fs.readFileSync(clientsCsv, "utf8"));
const clients = rawClients.map((r, i) => ({
  id: r.PixieID || String(i + 1),
  name: r.Name.replace(/\\&/g, "&"),
  type: r.Type,
  manager: managerName(r.Manager),
  partner: r.Partner || "",
  email: r.Email || "",
  coRegNo: r.CoRegNo || "",
  vatNo: r.VATNo || "",
  yearEnd: r.YearEnd_MMDD || "",
  confStmtDue: r.ConfStmtDate || "",
  incomeSources: r.PersonalTaxIncomeSources || "",
  risk: r.RiskAssessment || "",
  contacts: [],
}));

// ---------- Pixie contacts ----------
const rawContacts = parseCsv(fs.readFileSync(contactsCsv, "utf8"));
const byNorm = new Map(clients.map((c) => [norm(c.name), c]));
let unmatchedContacts = [];
for (const r of rawContacts) {
  const key = norm(r.Client);
  const client = byNorm.get(key) || clients.find((c) => norm(c.name) === key || norm(c.name).includes(key) || key.includes(norm(c.name)));
  const contact = {
    firstName: r.FirstName, lastName: r.LastName,
    email: r.Email || "", phone: (r.Phone || "").replace(/^tel:|^'/g, ""),
    primary: r.Primary === "true", jobTitle: r.JobTitle && r.JobTitle !== "None" ? r.JobTitle : "",
    aml: r.AMLResult || "", amlDate: r.AMLDate || "", onboarding: r.OnboardingStatus || "",
  };
  if (client) client.contacts.push(contact);
  else unmatchedContacts.push(r.Client);
}

// ---------- Schedule parsing ----------
const lines = fs.readFileSync(scheduleTxt, "utf8").split("\n");
const cellsOf = (line) => line.split("|").slice(1, -1).map((c) => c.replace(/\\([&#!])/g, "$1").trim());

let accountsJobs = [], personalTaxJobs = [], p11dRows = [];
let section = null;
for (const line of lines) {
  if (!line.startsWith("|")) { continue; }
  const cells = cellsOf(line);
  const joined = cells.join("|");
  if (joined.includes("Year-End Date") && joined.includes("Statutory deadline")) { section = "accounts"; continue; }
  if (joined.includes("Client name") && joined.includes("Who responsible?")) { section = "ptax"; continue; }
  if (joined.includes("Client Name") && joined.includes("Benefit Type")) { section = "p11d"; continue; }
  if (joined.includes("P11D Benefits Tracker")) { section = null; continue; }
  if (joined.includes("Due by date") || joined.includes("Total transactions") || joined.includes("Mini budget")) { section = "done"; continue; }
  if (section === "done" || !section) continue;
  if (cells.every((c) => !c) || cells[0].startsWith(":-:") || cells[0].startsWith("[merged]")) continue;

  if (section === "accounts") {
    const [client, yearEnd, deadline, sentToPreparer, inDraft, stage, manager, partner, notes, filed] = cells;
    if (!client || !ddmmyyToIso(yearEnd)) continue;
    accountsJobs.push({
      client, yearEnd: ddmmyyToIso(yearEnd), deadline: ddmmyyToIso(deadline),
      sentToPreparer: ddmmyyToIso(sentToPreparer), inDraft: ddmmyyToIso(inDraft),
      stage: stage || "Not Started", manager: manager || "", partner: partner || "",
      notes: notes || "", filedDate: ddmmyyToIso(filed),
    });
  } else if (section === "ptax") {
    const client = cells[0];
    if (!client || client === "TOTALS") continue;
    // cols: 0 name, 1 company, 2 who, 3 p11d, 4 status, 5 invoice, 6-8 flags, 9-10 notes, 11 date filed
    const notes = [cells[9], cells[10]].filter(Boolean).join(" · ");
    const status = cells[4] || "";
    if (!status && !cells[1] && !cells[2]) continue;
    personalTaxJobs.push({
      client, company: cells[1] || "", owner: cells[2] || "", p11d: cells[3] || "",
      status: status || "No info yet", invoice: (cells[5] || "").toUpperCase().startsWith("Y"),
      notes, filedDate: ddmmyyToIso(cells[11]),
    });
  } else if (section === "p11d") {
    const [person, company, manager, taxYear, benefit, value, ni, notes, dateFiled, status] = cells;
    if (person === "TOTALS") { section = null; continue; }
    if (!person && !company) continue;
    const num = (s) => { const n = parseFloat((s || "").replace(/,/g, "")); return isNaN(n) ? null : n; };
    p11dRows.push({
      person: person || "", company: company || "", manager: manager || "", taxYear: taxYear || "",
      benefit: benefit || "", value: num(value), class1aNI: num(ni), notes: notes || "",
      dateFiled: ddmmyyToIso(dateFiled), status: status || "",
    });
  }
}

// ---------- Match schedule names to Pixie clients ----------
const aliases = aliasPath && fs.existsSync(aliasPath) ? JSON.parse(fs.readFileSync(aliasPath, "utf8")) : {};
const normedClients = clients.map((c) => ({ c, n: norm(c.name) }));
function matchClient(schedName) {
  if (aliases[schedName]) {
    const target = clients.find((c) => c.name === aliases[schedName]);
    return target ? target.id : null;
  }
  const n = norm(schedName);
  if (!n) return null;
  let hit = normedClients.find((x) => x.n === n);
  if (!hit) {
    const cands = normedClients.filter((x) => x.n.startsWith(n + " ") || x.n === n || (n.length > 5 && x.n.includes(n)));
    if (cands.length === 1) hit = cands[0];
  }
  if (!hit) {
    const cands = normedClients.filter((x) => n.startsWith(x.n + " ") && x.n.length > 4);
    if (cands.length === 1) hit = cands[0];
  }
  return hit ? hit.c.id : null;
}
const unmatchedJobs = new Set();
for (const j of accountsJobs) { j.clientId = matchClient(j.client); if (!j.clientId) unmatchedJobs.add(j.client); }
const unmatchedPt = new Set();
for (const j of personalTaxJobs) { j.clientId = matchClient(j.client); if (!j.clientId) unmatchedPt.add(j.client); }

const data = {
  generatedAt: new Date().toISOString().slice(0, 10),
  scheduleYear: 2026,
  taxYear: "2025/26",
  clients, accountsJobs, personalTaxJobs, p11dRows,
};
fs.writeFileSync(outPath, JSON.stringify(data, null, 1));
console.log(`clients=${clients.length} contacts=${rawContacts.length} accountsJobs=${accountsJobs.length} ptax=${personalTaxJobs.length} p11d=${p11dRows.length}`);
console.log("unmatched contacts:", [...new Set(unmatchedContacts)].join("; ") || "none");
console.log("unmatched accounts jobs:", [...unmatchedJobs].join("; ") || "none");
console.log("unmatched personal tax:", [...unmatchedPt].join("; ") || "none");
