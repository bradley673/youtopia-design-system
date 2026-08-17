import React from "react";
import {
  Badge, Card, DataTable, EmptyState, Input, SegmentedControl, Select, Tooltip, type Column,
} from "@youtopia/design-system";
import {
  data, daysUntil, deadlineLabel, deadlineTone, fmtDate, isOpenStage, stageTone, uniqueSorted,
  type AccountsJob,
} from "../lib/data";

interface Props {
  openClient: (id: string | null) => void;
}

export function AccountsJobs({ openClient }: Props) {
  const [scope, setScope] = React.useState("open");
  const [stage, setStage] = React.useState("all");
  const [manager, setManager] = React.useState("all");
  const [q, setQ] = React.useState("");

  const stages = uniqueSorted(data.accountsJobs.map((j) => j.stage));
  const managers = uniqueSorted(data.accountsJobs.map((j) => j.manager));

  const rows = data.accountsJobs
    .filter((j) => (scope === "all" ? true : scope === "open" ? isOpenStage(j.stage) : j.stage === "Filed"))
    .filter((j) => stage === "all" || j.stage === stage)
    .filter((j) => manager === "all" || j.manager === manager)
    .filter((j) => j.client.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : 1);

  const columns: Column<AccountsJob>[] = [
    {
      key: "client", header: "Client", sortable: true,
      render: (r) => (
        <button type="button" className="link-btn" disabled={!r.clientId} onClick={() => openClient(r.clientId)}>
          {r.client}
        </button>
      ),
    },
    { key: "yearEnd", header: "Year end", sortable: true, render: (r) => fmtDate(r.yearEnd) },
    { key: "deadline", header: "Deadline", sortable: true, render: (r) => fmtDate(r.deadline) },
    {
      key: "filedDate", header: "Time left",
      sortable: true, sortValue: (r) => (r.stage === "Filed" ? null : daysUntil(r.deadline)),
      render: (r) =>
        r.stage === "Filed"
          ? <span style={{ color: "var(--text-subtle)", fontSize: "0.82rem" }}>filed {fmtDate(r.filedDate)}</span>
          : (() => { const d = daysUntil(r.deadline); return <Badge tone={deadlineTone(d)}>{deadlineLabel(d)}</Badge>; })(),
    },
    { key: "stage", header: "Stage", sortable: true, render: (r) => <Badge tone={stageTone(r.stage)}>{r.stage}</Badge> },
    { key: "manager", header: "Manager", sortable: true },
    { key: "partner", header: "Partner", sortable: true },
    {
      key: "notes", header: "Latest note",
      render: (r) =>
        r.notes ? (
          <Tooltip content={r.notes}>
            <span className="cell-note">{r.notes}</span>
          </Tooltip>
        ) : (
          <span style={{ color: "var(--text-subtle)" }}>—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="view-head">
        <div>
          <h1 className="view-title">Accounts jobs</h1>
          <p className="view-sub">Year-end accounts tracker · schedule year {data.scheduleYear}</p>
        </div>
        <SegmentedControl
          aria-label="Job scope"
          value={scope}
          onChange={setScope}
          segments={[
            { value: "open", label: "Open" },
            { value: "filed", label: "Filed" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <div className="filter-row">
        <div className="filter-grow">
          <Input label="Search" placeholder="Client name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="all">All stages</option>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Manager" value={manager} onChange={(e) => setManager(e.target.value)}>
          <option value="all">All managers</option>
          {managers.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <span className="filter-count">{rows.length} job{rows.length === 1 ? "" : "s"}</span>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No jobs match" description="Try clearing the search or widening the filters." />
        ) : (
          <div className="table-scroll">
            <DataTable caption="Accounts jobs" columns={columns} rows={rows} />
          </div>
        )}
      </Card>
    </div>
  );
}
