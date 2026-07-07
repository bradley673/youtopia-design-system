import React from "react";
import {
  Breadcrumb, SegmentedControl, StatCard, Sparkline, Money, Card, Button,
  DataTable, Badge, Progress, Avatar, AvatarGroup, Banner, Icon, DropdownMenu,
  Tooltip, type Column,
} from "../index";

interface InvoiceRow {
  client: string;
  ref: string;
  amount: number;
  status: "Paid" | "Due soon" | "Overdue" | "Draft";
}

const rows: InvoiceRow[] = [
  { client: "Meridian Studios", ref: "INV-2041", amount: 4200, status: "Paid" },
  { client: "Harbour & Co", ref: "INV-2042", amount: 1850, status: "Due soon" },
  { client: "Northgate Ltd", ref: "INV-2039", amount: 6140, status: "Overdue" },
  { client: "Willow Health", ref: "INV-2043", amount: 980.5, status: "Draft" },
];

const statusTone = {
  Paid: "success", "Due soon": "warning", Overdue: "danger", Draft: "info",
} as const;

const columns: Column<InvoiceRow>[] = [
  { key: "client", header: "Client", render: (r) => <strong>{r.client}</strong> },
  { key: "ref", header: "Invoice" },
  { key: "amount", header: "Amount", numeric: true, render: (r) => <Money amount={r.amount} /> },
  { key: "status", header: "Status", render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
];

/**
 * Finance overview dashboard — a realistic composition of the KPI, table,
 * and shell components working together.
 */
export function DashboardExample() {
  const [range, setRange] = React.useState("month");
  return (
    <div className="yt" style={{ background: "var(--bg)", padding: 32, minHeight: "100%" }}>
      <Breadcrumb items={[{ label: "Youtopia", href: "#" }, { label: "Clients", href: "#" }, { label: "Meridian Studios" }]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", margin: "16px 0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--text)" }}>Overview</h1>
          <AvatarGroup>
            <Avatar name="Sam Booth" />
            <Avatar name="Rae Kapoor" />
            <Avatar name="Alex Lund" />
          </AvatarGroup>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SegmentedControl
            aria-label="Time range"
            value={range}
            onChange={setRange}
            segments={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "quarter", label: "Quarter" }]}
          />
          <Tooltip content="Export as PDF">
            <Button variant="outline" size="sm"><Icon name="download" size={16} /> Export</Button>
          </Tooltip>
          <DropdownMenu
            trigger={<Button variant="ghost" size="sm">⋯</Button>}
            items={[
              { label: "Send statement", onSelect: () => {} },
              { label: "Schedule review", onSelect: () => {} },
              { label: "Archive client", onSelect: () => {}, danger: true },
            ]}
            align="end"
          />
        </div>
      </div>

      <Banner tone="warning" title="3 invoices due this week" action={<Button size="sm" variant="primary">Turn on auto-chase</Button>} style={{ marginBottom: 24 }}>
        Totalling £6,140. Reminders can be sent automatically on each due date.
      </Banner>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Cash in bank" value={<Money amount={48320} compact />} deltaPct={12.4} deltaLabel="vs March"
          trend={<Sparkline data={[30, 32, 31, 36, 40, 44, 48]} color="var(--chart-1)" />} />
        <StatCard label="Overdue" value={<Money amount={6140} compact />} deltaPct={8.0} deltaLabel="vs March" invertDelta
          trend={<Sparkline data={[2, 3, 3, 5, 4, 6, 6.1]} color="var(--chart-5)" />} />
        <StatCard label="Revenue (MTD)" value={<Money amount={31900} compact />} deltaPct={5.2} deltaLabel="vs March"
          trend={<Sparkline data={[24, 26, 25, 28, 30, 31, 31.9]} color="var(--chart-3)" />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card padded={false}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: 0, color: "var(--text)" }}>Recent invoices</h2>
            <Button size="sm" variant="outline"><Icon name="invoice" size={16} /> New invoice</Button>
          </div>
          <DataTable columns={columns} rows={rows} caption="Recent invoices for Meridian Studios" />
        </Card>
        <Card>
          <p style={{ fontFamily: "var(--font-text)", fontSize: ".85rem", fontWeight: 600, margin: "0 0 8px", color: "var(--text)" }}>Month-end close</p>
          <p style={{ fontFamily: "var(--font-text)", fontSize: ".8rem", color: "var(--text-muted)", margin: "0 0 10px" }}>7 of 10 tasks complete</p>
          <Progress value={70} label="Month-end close progress" />
          <div style={{ marginTop: 20, display: "flex", gap: 8, alignItems: "center", color: "var(--success-fg)", fontSize: ".85rem", fontWeight: 600 }}>
            <Icon name="check" size={18} /> Bank feed reconciled
          </div>
        </Card>
      </div>
    </div>
  );
}
