import React from "react";
import {
  Avatar, Badge, Card, DataTable, EmptyState, Input, Pagination, Select, type Column,
} from "@youtopia/design-system";
import { data, fmtDate, fmtYearEnd, uniqueSorted, type Client } from "../lib/data";

interface Props {
  openClient: (id: string | null) => void;
}

const PAGE_SIZE = 15;

export function Clients({ openClient }: Props) {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("all");
  const [manager, setManager] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const types = uniqueSorted(data.clients.map((c) => c.type));
  const managers = uniqueSorted(data.clients.map((c) => c.manager));

  const filtered = data.clients
    .filter((c) => type === "all" || c.type === type)
    .filter((c) => manager === "all" || c.manager === manager)
    .filter((c) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.contacts.some((p) => `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(needle))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => { setPage(1); }, [q, type, manager]);

  const columns: Column<Client>[] = [
    {
      key: "name", header: "Client", sortable: true,
      render: (r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.name} />
          <button type="button" className="link-btn" onClick={() => openClient(r.id)}>{r.name}</button>
        </span>
      ),
    },
    { key: "type", header: "Type", sortable: true },
    { key: "manager", header: "Manager", sortable: true, render: (r) => r.manager || <span style={{ color: "var(--text-subtle)" }}>—</span> },
    { key: "yearEnd", header: "Year end", sortable: true, render: (r) => fmtYearEnd(r.yearEnd) },
    {
      key: "confStmtDue", header: "Conf. stmt due", sortable: true,
      render: (r) => (r.confStmtDue ? fmtDate(r.confStmtDue) : <span style={{ color: "var(--text-subtle)" }}>—</span>),
    },
    {
      key: "contacts", header: "AML",
      render: (r) => {
        const done = r.contacts.filter((p) => p.aml).length;
        if (r.contacts.length === 0) return <span style={{ color: "var(--text-subtle)" }}>—</span>;
        const complete = r.contacts.every((p) => p.aml);
        return (
          <Badge tone={complete ? "success" : done > 0 ? "warning" : "neutral"}>
            {done}/{r.contacts.length} checked
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <div className="view-head">
        <div>
          <h1 className="view-title">Clients</h1>
          <p className="view-sub">Pixie client directory · {data.clients.length} clients</p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-grow">
          <Input label="Search" placeholder="Client, contact or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select label="Manager" value={manager} onChange={(e) => setManager(e.target.value)}>
          <option value="all">All managers</option>
          {managers.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <span className="filter-count">{filtered.length} client{filtered.length === 1 ? "" : "s"}</span>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No clients match" description="Try clearing the search or widening the filters." />
        ) : (
          <>
            <div className="table-scroll">
              <DataTable caption="Client directory" columns={columns} rows={rows} />
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
  );
}
