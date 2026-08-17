import React from "react";
import {
  Badge, Card, DataTable, EmptyState, Input, Money, Select, StatCard, type Column,
} from "@youtopia/design-system";
import { data, fmtDate, uniqueSorted, type P11dRow, type Tone } from "../lib/data";

const P11D_TONES: Record<string, Tone> = {
  "Filed": "success",
  "Sent to Client": "warning",
  "Information Required": "danger",
  "Payrolled / Not Required": "neutral",
};

export function P11d() {
  const [status, setStatus] = React.useState("all");
  const [q, setQ] = React.useState("");

  const statuses = uniqueSorted(data.p11dRows.map((r) => r.status));
  const filed = data.p11dRows.filter((r) => r.status === "Filed").length;
  const outstanding = data.p11dRows.filter((r) => r.status !== "Filed" && r.status !== "Payrolled / Not Required").length;
  const totalValue = data.p11dRows.reduce((s, r) => s + (r.value ?? 0), 0);
  const totalNI = data.p11dRows.reduce((s, r) => s + (r.class1aNI ?? 0), 0);

  const rows = data.p11dRows
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => (r.person + " " + r.company).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.company.localeCompare(b.company) || a.person.localeCompare(b.person));

  const columns: Column<P11dRow>[] = [
    { key: "person", header: "Employee", render: (r) => <strong>{r.person || "—"}</strong> },
    { key: "company", header: "Company" },
    { key: "benefit", header: "Benefit" },
    {
      key: "value", header: "P11D value", numeric: true,
      render: (r) => (r.value !== null ? <Money amount={r.value} /> : <span style={{ color: "var(--text-subtle)" }}>—</span>),
    },
    {
      key: "class1aNI", header: "Class 1A NI", numeric: true,
      render: (r) => (r.class1aNI !== null ? <Money amount={r.class1aNI} /> : <span style={{ color: "var(--text-subtle)" }}>—</span>),
    },
    {
      key: "status", header: "Status",
      render: (r) => <Badge tone={P11D_TONES[r.status] ?? "neutral"}>{r.status || "—"}</Badge>,
    },
    { key: "dateFiled", header: "Filed", render: (r) => fmtDate(r.dateFiled) },
    { key: "manager", header: "Manager" },
  ];

  return (
    <div>
      <div className="view-head">
        <div>
          <h1 className="view-title">P11D benefits</h1>
          <p className="view-sub">Benefits in kind tracker · tax year {data.taxYear}</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Returns filed" value={`${filed}`} />
        <StatCard label="Still outstanding" value={`${outstanding}`} />
        <StatCard label="Total benefit value" value={<Money amount={totalValue} />} />
        <StatCard label="Total Class 1A NI" value={<Money amount={totalNI} />} />
      </div>

      <div className="filter-row">
        <div className="filter-grow">
          <Input label="Search" placeholder="Employee or company…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <span className="filter-count">{rows.length} row{rows.length === 1 ? "" : "s"}</span>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No P11D rows match" description="Try clearing the search or widening the filters." />
        ) : (
          <div className="table-scroll">
            <DataTable caption="P11D benefit rows" columns={columns} rows={rows} />
          </div>
        )}
      </Card>
    </div>
  );
}
