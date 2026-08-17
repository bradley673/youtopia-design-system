import raw from "../data/practice-data.json";

export type Contact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  primary: boolean;
  jobTitle: string;
  aml: string;
  amlDate: string;
  onboarding: string;
}

export type Client = {
  id: string;
  name: string;
  type: string;
  manager: string;
  partner: string;
  email: string;
  coRegNo: string;
  vatNo: string;
  yearEnd: string; // MM-DD
  confStmtDue: string; // ISO date
  incomeSources: string;
  risk: string;
  contacts: Contact[];
}

export type AccountsJob = {
  client: string;
  clientId: string | null;
  yearEnd: string | null;
  deadline: string | null;
  sentToPreparer: string | null;
  inDraft: string | null;
  stage: string;
  manager: string;
  partner: string;
  notes: string;
  filedDate: string | null;
}

export type PersonalTaxJob = {
  client: string;
  clientId: string | null;
  company: string;
  owner: string;
  p11d: string;
  status: string;
  invoice: boolean;
  notes: string;
  filedDate: string | null;
}

export type P11dRow = {
  person: string;
  company: string;
  manager: string;
  taxYear: string;
  benefit: string;
  value: number | null;
  class1aNI: number | null;
  notes: string;
  dateFiled: string | null;
  status: string;
}

export type PracticeData = {
  generatedAt: string;
  scheduleYear: number;
  taxYear: string;
  clients: Client[];
  accountsJobs: AccountsJob[];
  personalTaxJobs: PersonalTaxJob[];
  p11dRows: P11dRow[];
}

export const data = raw as unknown as PracticeData;

export const clientById = new Map(data.clients.map((c) => [c.id, c]));

// ---------- Dates ----------
const DAY = 86_400_000;

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / DAY);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

/** "31 Mar" from an MM-DD year-end. */
export function fmtYearEnd(mmdd: string): string {
  if (!/^\d{2}-\d{2}$/.test(mmdd)) return mmdd || "—";
  const [mm, dd] = mmdd.split("-").map(Number);
  return new Date(2000, mm - 1, dd).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ---------- Status vocabulary ----------
export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const STAGE_TONES: Record<string, Tone> = {
  "Filed": "success",
  "Waiting for Signature": "warning",
  "Queries": "warning",
  "Manager Review": "info",
  "Partner Review": "info",
  "In Progress": "info",
  "Not Started": "neutral",
};

export function stageTone(stage: string): Tone {
  return STAGE_TONES[stage] ?? "neutral";
}

/** Open = anything not filed and not explicitly dropped. */
export function isOpenStage(stage: string): boolean {
  return stage !== "Filed" && stage !== "Not Doing";
}

const PT_TONES: Record<string, Tone> = {
  "Filed": "success",
  "Waiting for signature": "warning",
  "Ready to be sent to client": "info",
  "Ready for review": "info",
  "All info received": "info",
  "Partial info received": "warning",
  "No info yet": "neutral",
  "Not Doing": "neutral",
};

export function ptTone(status: string): Tone {
  return PT_TONES[status] ?? "neutral";
}

export function isOpenPt(status: string): boolean {
  return status !== "Filed" && status !== "Not Doing";
}

export function deadlineTone(days: number | null): Tone {
  if (days === null) return "neutral";
  if (days < 0) return "danger";
  if (days <= 31) return "danger";
  if (days <= 62) return "warning";
  return "neutral";
}

export function deadlineLabel(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return "due today";
  return `${days}d left`;
}

export function uniqueSorted(values: (string | undefined | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))].sort();
}
