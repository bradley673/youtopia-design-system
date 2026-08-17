import React from "react";
import { Icon, type IconName } from "@youtopia/design-system";
import { data } from "./lib/data";
import { Dashboard } from "./views/Dashboard";
import { AccountsJobs } from "./views/AccountsJobs";
import { PersonalTax } from "./views/PersonalTax";
import { P11d } from "./views/P11d";
import { Clients } from "./views/Clients";
import { ClientDetail } from "./components/ClientDetail";

type ViewId = "dashboard" | "accounts" | "personal-tax" | "p11d" | "clients";

const NAV: { id: ViewId; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "chart" },
  { id: "accounts", label: "Accounts jobs", icon: "invoice" },
  { id: "personal-tax", label: "Personal tax", icon: "check" },
  { id: "p11d", label: "P11D benefits", icon: "wallet" },
  { id: "clients", label: "Clients", icon: "search" },
];

export function App() {
  const [view, setView] = React.useState<ViewId>("dashboard");
  const [openClientId, setOpenClientId] = React.useState<string | null>(null);
  const openClient = (id: string | null) => { if (id) setOpenClientId(id); };

  return (
    <div className="yt app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">Y</span>
          <span>
            <strong>Youtopia</strong>
            <small>Practice</small>
          </span>
        </div>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`app-nav-item${view === n.id ? " is-active" : ""}`}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => setView(n.id)}
            >
              <Icon name={n.icon} size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="app-sidebar-foot">
          Schedule {data.scheduleYear} · Pixie export
          <br />
          Data as of {new Date(data.generatedAt + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </aside>

      <main className="app-main">
        {view === "dashboard" && <Dashboard openClient={openClient} goTo={(v) => setView(v as ViewId)} />}
        {view === "accounts" && <AccountsJobs openClient={openClient} />}
        {view === "personal-tax" && <PersonalTax openClient={openClient} />}
        {view === "p11d" && <P11d />}
        {view === "clients" && <Clients openClient={openClient} />}
      </main>

      <ClientDetail clientId={openClientId} onClose={() => setOpenClientId(null)} />
    </div>
  );
}
