import React from "react";
import {
  Badge, Card, DataTable, EmptyState, Input, Progress, SegmentedControl, Select, Tag, Tooltip, type Column,
} from "@youtopia/design-system";
import { data, fmtDate, isOpenPt, ptTone, uniqueSorted, type PersonalTaxJob } from "../lib/data";

interface Props {
  openClient: (id: string | null) => void;
}

export function PersonalTax({ openClient }: Props) {
  const [scope, setScope] = React.useState("open");
  const [status, setStatus] = React.useState("all");
  const [owner, setOwner] = React.useState("all");
  const [q, setQ] = React.useState("");

  const statuses = uniqueSorted(data.personalTaxJobs.map((j) => j.status));
  const owners = uniqueSorted(data.personalTaxJobs.map((j) => j.owner));

  const filed = data.personalTaxJobs.filter((j) => j.status === "Filed").length;
  const inScope = data.personalTaxJobs.filter((j) => j.status !== "Not Doing").length;

  const rows = data.personalTaxJobs
    .filter((j) => (scope === "all" ? true : scope === "open" ? isOpenPt(j.status) : j.status === "Filed"))
    .filter((j) => status === "all" || j.status === status)
    .filter((j) => owner === "all" || j.owner === owner)
    .filter((j) => (j.client + " " + j.company).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.client.localeCompare(b.client));

  const columns: Column<PersonalTaxJob>[] = [
    {
      key: "client", header: "Client", sortable: true,
      render: (r) => (
        <button type="button" className="link-btn" disabled={!r.clientId} onClick={() => openClient(r.clientId)}>
          {r.client}
        </button>
      ),
    },
    { key: "company", header: "Linked company", sortable: true, render: (r) => r.company || <span style={{ color: "var(--text-subtle)" }}>—</span> },
    { key: "owner", header: "Owner", sortable: true },
    { key: "status", header: "Status", sortable: true, render: (r) => <Badge tone={ptTone(r.status)}>{r.status}</Badge> },
    {
      key: "invoice", header: "Invoice",
      render: (r) => (r.invoice ? <Tag>To invoice</Tag> : <span style={{ color: "var(--text-subtle)" }}>—</span>),
    },
    { key: "filedDate", header: "Filed", sortable: true, render: (r) => fmtDate(r.filedDate) },
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
          <h1 className="view-title">Personal tax</h1>
          <p className="view-sub">Self Assessment returns · tax year {data.taxYear}</p>
        </div>
        <SegmentedControl
          aria-label="Return scope"
          value={scope}
          onChange={setScope}
          segments={[
            { value: "open", label: "Open" },
            { value: "filed", label: "Filed" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <Card padded style={{ marginBottom: "var(--sp-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 8 }}>
          <strong>Season progress</strong>
          <span>{filed} of {inScope} returns filed · {inScope - filed} to go before 31 Jan</span>
        </div>
        <Progress value={filed} max={inScope} label="Personal tax returns filed" />
      </Card>

      <div className="filter-row">
        <div className="filter-grow">
          <Input label="Search" placeholder="Client or company…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="all">All owners</option>
          {owners.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
        <span className="filter-count">{rows.length} return{rows.length === 1 ? "" : "s"}</span>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No returns match" description="Try clearing the search or widening the filters." />
        ) : (
          <div className="table-scroll">
            <DataTable caption="Personal tax returns" columns={columns} rows={rows} />
          </div>
        )}
      </Card>
    </div>
  );
}
