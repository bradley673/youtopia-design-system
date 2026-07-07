import React from "react";
import {
  Card, Tabs, Tag, Pagination, EmptyState, Skeleton, Spinner, Accordion,
  Badge, Money, DataTable, DropdownMenu, Button, Icon, type Column,
} from "../index";

interface Row {
  client: string;
  ref: string;
  amount: number;
  due: string;
  status: "Paid" | "Due soon" | "Overdue";
}

const all: Row[] = [
  { client: "Meridian Studios", ref: "INV-2041", amount: 4200, due: "12 Aug", status: "Paid" },
  { client: "Harbour & Co", ref: "INV-2042", amount: 1850, due: "09 Aug", status: "Due soon" },
  { client: "Northgate Ltd", ref: "INV-2039", amount: 6140, due: "28 Jul", status: "Overdue" },
];

const tone = { Paid: "success", "Due soon": "warning", Overdue: "danger" } as const;

const columns: Column<Row>[] = [
  { key: "client", header: "Client", render: (r) => <strong>{r.client}</strong> },
  { key: "ref", header: "Invoice" },
  { key: "due", header: "Due" },
  { key: "amount", header: "Amount", numeric: true, render: (r) => <Money amount={r.amount} /> },
  { key: "status", header: "Status", render: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge> },
  {
    key: "ref", header: "", render: () => (
      <DropdownMenu align="end" trigger={<Button variant="ghost" size="sm">⋯</Button>}
        items={[{ label: "Edit", onSelect: () => {} }, { label: "Send reminder", onSelect: () => {} }, { label: "Void", onSelect: () => {}, danger: true }]} />
    ),
  },
];

function Loading() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Skeleton circle width={28} height={28} />
          <Skeleton width="40%" />
          <Skeleton width="20%" style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

/** Invoice management view — tabs, filters, a loading state, and an empty state. */
export function InvoicesExample() {
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const table = (data: Row[]) => (
    <>
      <div style={{ display: "flex", gap: 8, padding: "12px 4px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-text)", fontSize: ".8rem", color: "var(--text-subtle)" }}>Filters:</span>
        <Tag onRemove={() => {}}>This quarter</Tag>
        <Tag onRemove={() => {}}>&gt; £1,000</Tag>
        <Button variant="ghost" size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1200); }}>
          {loading ? <Spinner size={14} /> : <Icon name="search" size={14} />} Refresh
        </Button>
      </div>
      {loading ? <Loading /> : <DataTable columns={columns} rows={data} caption="Invoices" />}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
        <Pagination page={page} pageCount={5} onChange={setPage} />
      </div>
    </>
  );

  return (
    <div className="yt" style={{ background: "var(--bg)", padding: 32, minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: 0, color: "var(--text)" }}>Invoices</h1>
        <Button variant="primary"><Icon name="invoice" size={16} /> New invoice</Button>
      </div>

      <Card padded={false} style={{ padding: "4px 16px 8px", marginBottom: 24 }}>
        <Tabs
          items={[
            { id: "all", label: "All", content: table(all) },
            { id: "overdue", label: "Overdue", content: table(all.filter((r) => r.status === "Overdue")) },
            {
              id: "drafts", label: "Drafts", content: (
                <div style={{ padding: 16 }}>
                  <EmptyState
                    icon={<Icon name="invoice" size={40} />}
                    title="No draft invoices"
                    description="Invoices you start but don't send yet will wait here."
                    action={<Button variant="primary">Create a draft</Button>}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Accordion
        items={[
          { id: "q1", title: "When are reminders sent?", content: "On the due date, then every 5 working days until paid — unless you pause auto-chase." },
          { id: "q2", title: "Which payment methods are supported?", content: "Bank transfer, card, and direct debit via your connected processor." },
        ]}
        defaultOpen={["q1"]}
      />
    </div>
  );
}
