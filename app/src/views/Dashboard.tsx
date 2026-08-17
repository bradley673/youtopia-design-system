import React from "react";
import { Badge, Banner, Button, Card, DataTable, Progress, StatCard, type Column } from "@youtopia/design-system";
import {
  data, daysUntil, deadlineLabel, deadlineTone, fmtDate, isOpenPt, isOpenStage, stageTone,
  type AccountsJob,
} from "../lib/data";
import { issueCount, upcomingConfStmts } from "../lib/issues";

interface Props {
  openClient: (id: string | null) => void;
  goTo: (view: string) => void;
}

const STAGE_ORDER = [
  "Not Started", "In Progress", "Queries", "Manager Review", "Partner Review", "Waiting for Signature", "Filed",
];

export function Dashboard({ openClient, goTo }: Props) {
  const jobs = data.accountsJobs;
  const open = jobs.filter((j) => isOpenStage(j.stage));
  const filed = jobs.filter((j) => j.stage === "Filed");

  const overdue = open.filter((j) => { const d = daysUntil(j.deadline); return d !== null && d < 0; });
  const dueSoon = open.filter((j) => { const d = daysUntil(j.deadline); return d !== null && d >= 0 && d <= 62; });
  const waitingOnClient = open.filter((j) => j.stage === "Waiting for Signature" || j.stage === "Queries");

  const pt = data.personalTaxJobs;
  const ptFiled = pt.filter((j) => j.status === "Filed").length;
  const ptInScope = pt.filter((j) => j.status !== "Not Doing").length;

  const p11dFiled = data.p11dRows.filter((r) => r.status === "Filed").length;
  const p11dActionable = data.p11dRows.filter((r) => r.status !== "Payrolled / Not Required").length;

  const stageCounts = STAGE_ORDER.map((s) => ({ stage: s, count: jobs.filter((j) => j.stage === s).length }))
    .filter((s) => s.count > 0);
  const maxStage = Math.max(...stageCounts.map((s) => s.count), 1);

  const managers = [...new Set(open.map((j) => j.manager).filter(Boolean))].sort();
  const managerCounts = managers
    .map((m) => ({ manager: m, count: open.filter((j) => j.manager === m).length }))
    .sort((a, b) => b.count - a.count);
  const maxManager = Math.max(...managerCounts.map((m) => m.count), 1);

  const confStmts = upcomingConfStmts(60);
  const issues = issueCount();

  const upcoming = [...open]
    .filter((j) => j.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 10);

  const upcomingCols: Column<AccountsJob>[] = [
    {
      key: "client", header: "Client",
      render: (r) => (
        <button type="button" className="link-btn" disabled={!r.clientId} onClick={() => openClient(r.clientId)}>
          {r.client}
        </button>
      ),
    },
    { key: "deadline", header: "Deadline", render: (r) => fmtDate(r.deadline) },
    {
      key: "yearEnd", header: "Time left",
      render: (r) => { const d = daysUntil(r.deadline); return <Badge tone={deadlineTone(d)}>{deadlineLabel(d)}</Badge>; },
    },
    { key: "stage", header: "Stage", render: (r) => <Badge tone={stageTone(r.stage)}>{r.stage}</Badge> },
    { key: "manager", header: "Manager" },
  ];

  return (
    <div>
      <div className="view-head">
        <div>
          <h1 className="view-title">Practice overview</h1>
          <p className="view-sub">
            {data.clients.length} clients · schedule year {data.scheduleYear} · tax year {data.taxYear}
          </p>
        </div>
      </div>

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <Banner
          tone={overdue.length > 0 ? "danger" : "warning"}
          title={
            overdue.length > 0
              ? `${overdue.length} accounts job${overdue.length === 1 ? "" : "s"} past the statutory deadline`
              : `${dueSoon.length} accounts job${dueSoon.length === 1 ? "" : "s"} due within two months`
          }
          style={{ marginBottom: "var(--sp-5)" }}
        >
          {overdue.length > 0
            ? overdue.map((j) => j.client).join(", ")
            : "Open the accounts view to see what's left on each."}
        </Banner>
      )}

      <div className="stat-grid">
        <StatCard label="Open accounts jobs" value={`${open.length}`} />
        <StatCard label="Filed this schedule year" value={`${filed.length} / ${jobs.length}`} />
        <StatCard label="Due in next 62 days" value={`${dueSoon.length}`} />
        <StatCard label="Waiting on clients" value={`${waitingOnClient.length}`} />
      </div>

      <div className="two-col">
        <Card>
          <h2 className="card-title">Next statutory deadlines</h2>
          <div className="table-scroll">
            <DataTable caption="Open accounts jobs by statutory deadline" columns={upcomingCols} rows={upcoming} />
          </div>
        </Card>

        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          <Card>
            <h2 className="card-title">Accounts jobs by stage</h2>
            {stageCounts.map((s) => (
              <div className="count-bar-row" key={s.stage}>
                <span className="count-bar-label">{s.stage}</span>
                <Progress value={s.count} max={maxStage} label={`${s.stage}: ${s.count} jobs`} />
                <span className="count-bar-value">{s.count}</span>
              </div>
            ))}
          </Card>

          <Card>
            <h2 className="card-title">Open jobs by manager</h2>
            {managerCounts.map((m) => (
              <div className="count-bar-row" key={m.manager}>
                <span className="count-bar-label">{m.manager}</span>
                <Progress value={m.count} max={maxManager} label={`${m.manager}: ${m.count} open jobs`} />
                <span className="count-bar-value">{m.count}</span>
              </div>
            ))}
          </Card>

          <Card>
            <h2 className="card-title">Confirmation statements — next 60 days</h2>
            {confStmts.length === 0 ? (
              <p className="view-sub" style={{ margin: 0 }}>Nothing due in the next two months.</p>
            ) : (
              confStmts.map((x, i) => (
                <div key={i} className="contact-row">
                  <div className="contact-meta">
                    <div className="contact-name">
                      <button type="button" className="link-btn" onClick={() => openClient(x.client.id)}>
                        {x.client.name}
                      </button>
                    </div>
                    <div className="contact-sub">Due {fmtDate(x.client.confStmtDue)} · manager {x.client.manager || "—"}</div>
                  </div>
                  <Badge tone={deadlineTone(x.days)}>{deadlineLabel(x.days)}</Badge>
                </div>
              ))
            )}
          </Card>

          {issues > 0 && (
            <Card>
              <h2 className="card-title">Data issues</h2>
              <p className="view-sub" style={{ marginTop: 0 }}>
                {issues} thing{issues === 1 ? "" : "s"} in the sheet or Pixie look{issues === 1 ? "s" : ""} wrong —
                suspect deadlines, missing filing dates, unmatched names or stale statutory dates.
              </p>
              <Button variant="outline" size="sm" onClick={() => goTo("housekeeping")}>
                Open housekeeping
              </Button>
            </Card>
          )}

          <Card>
            <h2 className="card-title">Season progress</h2>
            <div style={{ display: "grid", gap: "var(--sp-3)" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Personal tax {data.taxYear}</span>
                  <strong>{ptFiled} / {ptInScope} filed</strong>
                </div>
                <Progress value={ptFiled} max={ptInScope} label="Personal tax returns filed" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>P11D {data.taxYear}</span>
                  <strong>{p11dFiled} / {p11dActionable} filed</strong>
                </div>
                <Progress value={p11dFiled} max={p11dActionable} label="P11D returns filed" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Accounts {data.scheduleYear}</span>
                  <strong>{filed.length} / {jobs.length} filed</strong>
                </div>
                <Progress value={filed.length} max={jobs.length} label="Accounts jobs filed" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
