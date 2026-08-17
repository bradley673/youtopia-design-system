import React from "react";
import {
  Alert, Badge, Card, DataTable, EmptyState, Input, Pagination, StatCard, type Column,
} from "@youtopia/design-system";
import { fmtDate } from "../lib/data";
import {
  amlChases, deadlineIssues, filedNoDateIssues, staleConfStmts, unmatchedIssues,
  type AmlChase,
} from "../lib/issues";

interface Props {
  openClient: (id: string | null) => void;
}

const PAGE_SIZE = 15;

const CHASE_TONES = { "Refer": "danger", "Request sent": "warning", "No AML on record": "neutral" } as const;

export function Housekeeping({ openClient }: Props) {
  const deadlines = deadlineIssues();
  const filedNoDate = filedNoDateIssues();
  const unmatched = unmatchedIssues();
  const stale = staleConfStmts();
  const chases = amlChases();

  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const filteredChases = chases.filter((c) =>
    `${c.contact.firstName} ${c.contact.lastName} ${c.client.name}`.toLowerCase().includes(q.trim().toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(filteredChases.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const chaseRows = filteredChases.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [q]);

  const chaseCols: Column<AmlChase>[] = [
    {
      key: "contact", header: "Contact", sortable: true, sortValue: (r) => `${r.contact.firstName} ${r.contact.lastName}`,
      render: (r) => <strong>{r.contact.firstName} {r.contact.lastName}</strong>,
    },
    {
      key: "client", header: "Client", sortable: true, sortValue: (r) => r.client.name,
      render: (r) => (
        <button type="button" className="link-btn" onClick={() => openClient(r.client.id)}>{r.client.name}</button>
      ),
    },
    {
      key: "reason", header: "Why it needs a look", sortable: true,
      render: (r) => <Badge tone={CHASE_TONES[r.reason]}>{r.reason}</Badge>,
    },
    {
      key: "client", header: "Manager", sortable: true, sortValue: (r) => r.client.manager,
      render: (r) => r.client.manager || <span style={{ color: "var(--text-subtle)" }}>—</span>,
    },
    {
      key: "contact", header: "Email", sortValue: (r) => r.contact.email,
      render: (r) => r.contact.email || <span style={{ color: "var(--text-subtle)" }}>—</span>,
    },
  ];

  const sheetIssueCount = deadlines.length + filedNoDate.length + unmatched.length + stale.length;

  return (
    <div>
      <div className="view-head">
        <div>
          <h1 className="view-title">Housekeeping</h1>
          <p className="view-sub">Things the data says about itself — fix these in the sheet or in Pixie, not here</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Suspect deadlines" value={`${deadlines.length}`} />
        <StatCard label="Filed with no date" value={`${filedNoDate.length}`} />
        <StatCard label="Not found in Pixie" value={`${unmatched.length}`} />
        <StatCard label="Stale conf. stmt dates" value={`${stale.length}`} />
      </div>

      {sheetIssueCount === 0 && (
        <Alert tone="success" title="The sheet and Pixie agree" style={{ marginBottom: "var(--sp-4)" }}>
          No deadline oddities, missing filing dates, unmatched names or stale statutory dates found.
        </Alert>
      )}

      <div style={{ display: "grid", gap: "var(--sp-4)" }}>
        {deadlines.length > 0 && (
          <Card>
            <h2 className="card-title">Deadlines that don't fit the year end</h2>
            <p className="view-sub" style={{ marginTop: 0, marginBottom: "var(--sp-3)" }}>
              A private company's accounts are due 9 months after the year end. These rows are more than a week off that
              — usually a wrong year typed in the sheet.
            </p>
            {deadlines.map((x, i) => (
              <div key={i} className="contact-row">
                <div className="contact-meta">
                  <div className="contact-name">{x.job.client}</div>
                  <div className="contact-sub">
                    Year end {fmtDate(x.job.yearEnd)} · sheet says {fmtDate(x.job.deadline)} · expected {fmtDate(x.expected)}
                  </div>
                </div>
                <Badge tone="danger">{Math.abs(x.offDays)}d {x.offDays < 0 ? "early" : "late"}</Badge>
              </div>
            ))}
          </Card>
        )}

        {filedNoDate.length > 0 && (
          <Card>
            <h2 className="card-title">Marked Filed, but no filing date recorded</h2>
            {filedNoDate.map((x, i) => (
              <div key={i} className="contact-row">
                <div className="contact-meta">
                  <div className="contact-name">{x.who}</div>
                  <div className="contact-sub">{x.detail}</div>
                </div>
                <Badge tone="warning">{x.kind}</Badge>
              </div>
            ))}
          </Card>
        )}

        {unmatched.length > 0 && (
          <Card>
            <h2 className="card-title">On the schedule, but not in Pixie</h2>
            <p className="view-sub" style={{ marginTop: 0, marginBottom: "var(--sp-3)" }}>
              No Pixie client record matched these names — either they're missing from Pixie, or the schedule
              name needs an alias when the data is rebuilt.
            </p>
            {unmatched.map((x, i) => (
              <div key={i} className="contact-row">
                <div className="contact-meta">
                  <div className="contact-name">{x.name}</div>
                  <div className="contact-sub">{x.detail}</div>
                </div>
                <Badge tone="info">{x.kind}</Badge>
              </div>
            ))}
          </Card>
        )}

        {stale.length > 0 && (
          <Card>
            <h2 className="card-title">Confirmation statement dates in the past</h2>
            <p className="view-sub" style={{ marginTop: 0, marginBottom: "var(--sp-3)" }}>
              These Pixie records show a confirmation statement date that has already gone — most likely the record
              wasn't updated after filing. Worth a sweep through Pixie.
            </p>
            {stale.map((x, i) => (
              <div key={i} className="contact-row">
                <div className="contact-meta">
                  <div className="contact-name">
                    <button type="button" className="link-btn" onClick={() => openClient(x.client.id)}>{x.client.name}</button>
                  </div>
                  <div className="contact-sub">Shown as due {fmtDate(x.client.confStmtDue)} · manager {x.client.manager || "—"}</div>
                </div>
                <Badge tone={x.daysPast > 365 ? "neutral" : "warning"}>{x.daysPast}d ago</Badge>
              </div>
            ))}
          </Card>
        )}

        <Card>
          <h2 className="card-title">AML &amp; onboarding chases</h2>
          <p className="view-sub" style={{ marginTop: 0, marginBottom: "var(--sp-3)" }}>
            Contacts with an AML referral, an unanswered onboarding request, or no AML check on record.
          </p>
          <div className="filter-row">
            <div className="filter-grow">
              <Input label="Search" placeholder="Contact or client…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <span className="filter-count">{filteredChases.length} contact{filteredChases.length === 1 ? "" : "s"}</span>
          </div>
          {chaseRows.length === 0 ? (
            <EmptyState title="Nothing to chase" description="Every contact has a completed AML check." />
          ) : (
            <>
              <div className="table-scroll">
                <DataTable caption="AML and onboarding chases" columns={chaseCols} rows={chaseRows} />
              </div>
              {pageCount > 1 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--sp-4)" }}>
                  <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
