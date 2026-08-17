import React from "react";
import {
  Badge, Card, DataTable, EmptyState, SegmentedControl, StatCard, Tag, type Column,
} from "@youtopia/design-system";
import {
  data, daysUntil, deadlineLabel, deadlineTone, fmtDate, isOpenPt, isOpenStage, ptTone, stageTone,
  uniqueSorted, type AccountsJob, type PersonalTaxJob,
} from "../lib/data";

interface Props {
  openClient: (id: string | null) => void;
}

const STORAGE_KEY = "yt-practice-person";

function initialPerson(people: string[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && people.includes(saved)) return saved;
  } catch { /* storage unavailable — fall through */ }
  return people.includes("Bradley") ? "Bradley" : people[0] ?? "";
}

export function MyWeek({ openClient }: Props) {
  const people = uniqueSorted([
    ...data.accountsJobs.map((j) => j.manager),
    ...data.personalTaxJobs.map((j) => j.owner),
  ]);
  const [person, setPerson] = React.useState(() => initialPerson(people));
  const pick = (p: string) => {
    setPerson(p);
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* fine */ }
  };

  const myJobs = data.accountsJobs
    .filter((j) => j.manager === person && isOpenStage(j.stage))
    .sort((a, b) => ((a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : 1));
  const myPt = data.personalTaxJobs
    .filter((j) => j.owner === person && isOpenPt(j.status))
    .sort((a, b) => a.client.localeCompare(b.client));

  const dueSoon = myJobs.filter((j) => { const d = daysUntil(j.deadline); return d !== null && d <= 62; });
  const chases = myJobs.filter((j) => j.stage === "Waiting for Signature" || j.stage === "Queries");
  const ptWaiting = myPt.filter((j) => j.status === "Waiting for signature" || j.status === "No info yet" || j.status === "Partial info received");

  const jobCols: Column<AccountsJob>[] = [
    {
      key: "client", header: "Client", sortable: true,
      render: (r) => (
        <button type="button" className="link-btn" disabled={!r.clientId} onClick={() => openClient(r.clientId)}>
          {r.client}
        </button>
      ),
    },
    {
      key: "deadline", header: "Deadline", sortable: true,
      render: (r) => fmtDate(r.deadline),
    },
    {
      key: "yearEnd", header: "Time left",
      sortable: true, sortValue: (r) => daysUntil(r.deadline),
      render: (r) => { const d = daysUntil(r.deadline); return <Badge tone={deadlineTone(d)}>{deadlineLabel(d)}</Badge>; },
    },
    { key: "stage", header: "Stage", sortable: true, render: (r) => <Badge tone={stageTone(r.stage)}>{r.stage}</Badge> },
    {
      key: "notes", header: "Latest note",
      render: (r) => r.notes ? <span className="cell-note">{r.notes}</span> : <span style={{ color: "var(--text-subtle)" }}>—</span>,
    },
  ];

  const ptCols: Column<PersonalTaxJob>[] = [
    {
      key: "client", header: "Client", sortable: true,
      render: (r) => (
        <button type="button" className="link-btn" disabled={!r.clientId} onClick={() => openClient(r.clientId)}>
          {r.client}
        </button>
      ),
    },
    { key: "status", header: "Status", sortable: true, render: (r) => <Badge tone={ptTone(r.status)}>{r.status}</Badge> },
    {
      key: "invoice", header: "Invoice",
      render: (r) => (r.invoice ? <Tag>To invoice</Tag> : <span style={{ color: "var(--text-subtle)" }}>—</span>),
    },
    {
      key: "notes", header: "Latest note",
      render: (r) => r.notes ? <span className="cell-note">{r.notes}</span> : <span style={{ color: "var(--text-subtle)" }}>—</span>,
    },
  ];

  return (
    <div>
      <div className="view-head">
        <div>
          <h1 className="view-title">My week</h1>
          <p className="view-sub">Everything open for one person, one screen</p>
        </div>
        <SegmentedControl
          aria-label="Team member"
          value={person}
          onChange={pick}
          segments={people.map((p) => ({ value: p, label: p }))}
        />
      </div>

      <div className="stat-grid">
        <StatCard label="Open accounts jobs" value={`${myJobs.length}`} />
        <StatCard label="Due in next 62 days" value={`${dueSoon.length}`} />
        <StatCard label="Waiting on clients" value={`${chases.length}`} />
        <StatCard label="Open SA returns" value={`${myPt.length}`} />
      </div>

      <div style={{ display: "grid", gap: "var(--sp-4)" }}>
        <Card>
          <h2 className="card-title">Accounts jobs — next deadline first</h2>
          {myJobs.length === 0 ? (
            <EmptyState title="Nothing open" description={`${person} has no open accounts jobs on the schedule.`} />
          ) : (
            <div className="table-scroll">
              <DataTable caption={`Open accounts jobs for ${person}`} columns={jobCols} rows={myJobs} />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="card-title">Personal tax — open returns</h2>
          {myPt.length === 0 ? (
            <EmptyState title="Nothing open" description={`${person} has no open SA returns on the tracker.`} />
          ) : (
            <div className="table-scroll">
              <DataTable caption={`Open personal tax returns for ${person}`} columns={ptCols} rows={myPt} />
            </div>
          )}
        </Card>

        {ptWaiting.length > 0 && (
          <Card>
            <h2 className="card-title">SA chases — info or signature outstanding</h2>
            {ptWaiting.map((j, i) => (
              <div key={i} className="contact-row">
                <div className="contact-meta">
                  <div className="contact-name">{j.client}</div>
                  <div className="contact-sub">{[j.company, j.notes].filter(Boolean).join(" · ") || "No notes"}</div>
                </div>
                <Badge tone={ptTone(j.status)}>{j.status}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
