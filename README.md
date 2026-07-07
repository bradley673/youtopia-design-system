# Youtopia Design System

Tokens and React components for consistent, on-brand Youtopia product UI —
built to be uploaded to **Claude Design** via `/design-sync`.

## Add it to Claude Design

From this folder, in an interactive terminal:

```bash
cd youtopia-design-system
claude
/design-sync
```

The first run opens a browser to authorize design-system access, then reads the
tokens and React components below and publishes them under **Design systems** for
your org. Re-run `/design-sync` any time to push updates.

## What's inside

```
tokens/
  tokens.css     # CSS custom properties (light + dark) + embedded brand fonts
  tokens.json    # the same values as structured data
src/
  styles.css     # core component styles, consuming the tokens
  styles.ext.css # styles for the extended component set
  index.ts       # barrel export (import this once — it also loads the CSS)
  components/     # 32 components (see below)
  examples/       # composed screens: Dashboard, SettingsForm, Invoices
```

### Example screens

`src/examples/` contains three realistic, finance-flavoured screens composed
from the components — a **Dashboard** (KPIs, sparklines, invoice table), a
**SettingsForm** (validation, confirm modal, save toast), and an **Invoices**
view (tabs, filters, loading + empty states, pagination). Together they exercise
every component, and they double as living documentation for how pieces combine.

### Components

**Actions & forms** — Button, Input, Textarea, Select, Checkbox, Switch,
RadioGroup, SegmentedControl.

**Content & layout** — Card, Divider, Accordion, Tabs, DataTable, Breadcrumb,
Pagination, EmptyState.

**Status & feedback** — Badge, Tag, Alert, Banner, Tooltip, Modal, DropdownMenu,
Toast (`ToastProvider` + `useToast`), Spinner, Skeleton, Progress, Avatar.

**Finance-forward** — StatCard (KPI tile with trend delta), Sparkline, Money
(Intl currency formatter, GBP by default), and a 12-icon set (`Icon`).

### Foundations in tokens

Colour (magenta + purple ramps, violet neutrals, semantic), typography
(Bricolage Grotesque + Hanken Grotesk), spacing (8&nbsp;px rhythm), radius,
elevation, **motion** (durations + easing curves), **z-index scale**, and a
**data-viz chart palette** (`--chart-1…6`).

## Usage

```tsx
import { Button, Badge, Card, Alert } from "@youtopia/design-system";

export function Example() {
  return (
    <Card>
      <Badge tone="danger">Overdue</Badge>
      <Alert tone="warning" title="3 invoices due this week">
        Total £6,140. Turn on auto-chase to send reminders on the due date.
      </Alert>
      <Button variant="primary">Send reminder</Button>
    </Card>
  );
}
```

## Theming

The system ships light and dark. It follows the OS preference automatically, and
you can force a theme by setting `data-theme="light"` or `data-theme="dark"` on the
`<html>` element — the explicit value always wins.

## Foundations

- **Colour** — Magenta (primary, `#E4197E`) and Purple (secondary, `#6B2FB5`) as
  full 50–900 ramps; violet-biased neutrals; semantic success / warning / danger / info.
- **Type** — *Bricolage Grotesque* (display) + *Hanken Grotesk* (text/UI), embedded
  as woff2 so they render without a CDN.
- **Space** — 8&nbsp;px rhythm with a 4&nbsp;px half-step. **Radius** — 4 → 26&nbsp;px + pill.
- **Elevation** — three soft, magenta-tinted shadows.
