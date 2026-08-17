import React from "react";
import { Avatar, Badge, Divider, Modal, Tag } from "@youtopia/design-system";
import {
  clientById, data, daysUntil, deadlineLabel, deadlineTone, fmtDate, fmtYearEnd, ptTone, stageTone,
} from "../lib/data";

interface Props {
  clientId: string | null;
  onClose: () => void;
}

function amlTone(result: string) {
  if (result === "Pass") return "success" as const;
  if (result === "Refer") return "warning" as const;
  return "neutral" as const;
}

export function ClientDetail({ clientId, onClose }: Props) {
  const client = clientId ? clientById.get(clientId) : undefined;
  if (!client) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;

  const jobs = data.accountsJobs.filter((j) => j.clientId === client.id);
  const ptJobs = data.personalTaxJobs.filter((j) => j.clientId === client.id);

  return (
    <Modal open={!!client} onClose={onClose} title={client.name} width={640}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--sp-4)" }}>
        <Tag>{client.type}</Tag>
        {client.manager && <Tag>Manager: {client.manager}</Tag>}
        {client.partner && <Tag>Partner: {client.partner}</Tag>}
        {client.risk && <Tag>Risk: {client.risk}</Tag>}
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Year end</dt>
          <dd>{fmtYearEnd(client.yearEnd)}</dd>
        </div>
        <div>
          <dt>Confirmation stmt due</dt>
          <dd>{client.confStmtDue ? fmtDate(client.confStmtDue) : "—"}</dd>
        </div>
        <div>
          <dt>Company no.</dt>
          <dd>{client.coRegNo || "—"}</dd>
        </div>
        <div>
          <dt>VAT no.</dt>
          <dd>{client.vatNo || "—"}</dd>
        </div>
        {client.email && (
          <div>
            <dt>Email</dt>
            <dd>{client.email}</dd>
          </div>
        )}
        {client.incomeSources && (
          <div>
            <dt>Income sources</dt>
            <dd>{client.incomeSources}</dd>
          </div>
        )}
      </dl>

      {jobs.length > 0 && (
        <>
          <Divider label="Accounts jobs" />
          {jobs.map((j, i) => (
            <div key={i} className="contact-row">
              <div className="contact-meta">
                <div className="contact-name">Year end {fmtDate(j.yearEnd)}</div>
                <div className="contact-sub">
                  Deadline {fmtDate(j.deadline)}
                  {j.filedDate ? ` · filed ${fmtDate(j.filedDate)}` : ""}
                  {j.notes ? ` · ${j.notes}` : ""}
                </div>
              </div>
              {j.stage !== "Filed" && (() => {
                const d = daysUntil(j.deadline);
                return <Badge tone={deadlineTone(d)}>{deadlineLabel(d)}</Badge>;
              })()}
              <Badge tone={stageTone(j.stage)}>{j.stage}</Badge>
            </div>
          ))}
        </>
      )}

      {ptJobs.length > 0 && (
        <>
          <Divider label={`Personal tax ${data.taxYear}`} />
          {ptJobs.map((j, i) => (
            <div key={i} className="contact-row">
              <div className="contact-meta">
                <div className="contact-name">{j.client}</div>
                <div className="contact-sub">
                  {j.owner ? `Owner: ${j.owner}` : ""}
                  {j.filedDate ? ` · filed ${fmtDate(j.filedDate)}` : ""}
                  {j.notes ? ` · ${j.notes}` : ""}
                </div>
              </div>
              {j.invoice && <Tag>To invoice</Tag>}
              <Badge tone={ptTone(j.status)}>{j.status}</Badge>
            </div>
          ))}
        </>
      )}

      {client.contacts.length > 0 && (
        <>
          <Divider label="Contacts" />
          {client.contacts.map((p, i) => (
            <div key={i} className="contact-row">
              <Avatar name={`${p.firstName} ${p.lastName}`} />
              <div className="contact-meta">
                <div className="contact-name">
                  {p.firstName} {p.lastName}
                  {p.primary && <span style={{ color: "var(--text-subtle)", fontWeight: 400 }}> · primary</span>}
                </div>
                <div className="contact-sub">
                  {[p.jobTitle, p.email, p.phone].filter(Boolean).join(" · ") || "No contact details"}
                </div>
              </div>
              <Badge tone={amlTone(p.aml)}>
                {p.aml ? `AML ${p.aml}` : p.onboarding || "AML pending"}
              </Badge>
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}
