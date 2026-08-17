// Data-quality checks over the schedule + Pixie dataset. Everything here is
// computed at runtime so the panel always reflects whatever data is loaded.
import { data, daysUntil, type AccountsJob, type Client, type Contact } from "./data";

export type DeadlineIssue = {
  job: AccountsJob;
  expected: string; // ISO
  offDays: number;
};

export type FiledNoDateIssue = {
  kind: "Accounts" | "Personal tax" | "P11D";
  who: string;
  detail: string;
};

export type UnmatchedIssue = {
  kind: "Accounts" | "Personal tax";
  name: string;
  detail: string;
};

export type StaleConfStmt = {
  client: Client;
  daysPast: number;
};

export type AmlChase = {
  contact: Contact;
  client: Client;
  reason: "Refer" | "Request sent" | "No AML on record";
};

function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  // Corresponding-date rule: same day N months on, clamped to month end.
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  return `${target.getFullYear()}-${mm}-${dd}`;
}

const DAY = 86_400_000;
const diffDays = (a: string, b: string) =>
  Math.round((new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / DAY);

/** Statutory deadline far from year end + 9 months — almost always a typo in the sheet. */
export function deadlineIssues(): DeadlineIssue[] {
  const TOLERANCE = 7; // days — absorbs corresponding-date quirks, catches wrong-year typos
  return data.accountsJobs
    .filter((j) => j.yearEnd && j.deadline)
    .map((j) => {
      const expected = addMonthsIso(j.yearEnd!, 9);
      return { job: j, expected, offDays: diffDays(j.deadline!, expected) };
    })
    .filter((x) => Math.abs(x.offDays) > TOLERANCE)
    .sort((a, b) => Math.abs(b.offDays) - Math.abs(a.offDays));
}

/** Marked Filed but no filing date recorded. */
export function filedNoDateIssues(): FiledNoDateIssue[] {
  const out: FiledNoDateIssue[] = [];
  for (const j of data.accountsJobs) {
    if (j.stage === "Filed" && !j.filedDate) {
      out.push({ kind: "Accounts", who: j.client, detail: `Year end ${j.yearEnd ?? "—"} · manager ${j.manager || "—"}` });
    }
  }
  for (const j of data.personalTaxJobs) {
    if (j.status === "Filed" && !j.filedDate) {
      out.push({ kind: "Personal tax", who: j.client, detail: `Owner ${j.owner || "—"}` });
    }
  }
  for (const r of data.p11dRows) {
    if (r.status === "Filed" && !r.dateFiled) {
      out.push({ kind: "P11D", who: r.person || r.company, detail: `${r.company} · ${r.benefit || "benefit"}` });
    }
  }
  return out;
}

/** Schedule rows with no matching Pixie client record. */
export function unmatchedIssues(): UnmatchedIssue[] {
  const out: UnmatchedIssue[] = [];
  const seen = new Set<string>();
  for (const j of data.accountsJobs) {
    if (!j.clientId && !seen.has("a:" + j.client)) {
      seen.add("a:" + j.client);
      out.push({ kind: "Accounts", name: j.client, detail: `Manager ${j.manager || "—"} · year end ${j.yearEnd ?? "—"}` });
    }
  }
  for (const j of data.personalTaxJobs) {
    if (!j.clientId && !seen.has("p:" + j.client)) {
      seen.add("p:" + j.client);
      out.push({ kind: "Personal tax", name: j.client, detail: j.company ? `Company ${j.company}` : `Owner ${j.owner || "—"}` });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Confirmation statement date already in the past — the Pixie record is stale (or the filing is late). */
export function staleConfStmts(): StaleConfStmt[] {
  return data.clients
    .filter((c) => c.confStmtDue)
    .map((c) => ({ client: c, daysPast: -(daysUntil(c.confStmtDue) ?? 0) }))
    .filter((x) => x.daysPast > 0)
    .sort((a, b) => b.daysPast - a.daysPast);
}

/** Contacts whose AML/onboarding needs chasing. */
export function amlChases(): AmlChase[] {
  const out: AmlChase[] = [];
  for (const client of data.clients) {
    for (const contact of client.contacts) {
      if (contact.aml === "Refer") out.push({ contact, client, reason: "Refer" });
      else if (!contact.aml && contact.onboarding === "Request Sent") out.push({ contact, client, reason: "Request sent" });
      else if (!contact.aml) out.push({ contact, client, reason: "No AML on record" });
    }
  }
  const rank = { "Refer": 0, "Request sent": 1, "No AML on record": 2 } as const;
  return out.sort((a, b) => rank[a.reason] - rank[b.reason] || a.client.name.localeCompare(b.client.name));
}

/** Upcoming confirmation statements, soonest first. */
export function upcomingConfStmts(withinDays: number) {
  return data.clients
    .filter((c) => c.confStmtDue)
    .map((c) => ({ client: c, days: daysUntil(c.confStmtDue)! }))
    .filter((x) => x.days >= 0 && x.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

export function issueCount(): number {
  return deadlineIssues().length + filedNoDateIssues().length + unmatchedIssues().length + staleConfStmts().length;
}
