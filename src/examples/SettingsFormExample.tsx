import React from "react";
import {
  Card, Input, Select, Textarea, RadioGroup, Checkbox, Switch, Divider,
  Button, Alert, Modal, Tag, Icon, ToastProvider, useToast,
} from "../index";

function SettingsForm() {
  const { toast } = useToast();
  const [companyNo, setCompanyNo] = React.useState("1234");
  const [disconnectOpen, setDisconnectOpen] = React.useState(false);
  const [feedConnected, setFeedConnected] = React.useState(true);

  const companyError = companyNo.length > 0 && companyNo.length !== 8 ? "Company numbers are 8 digits." : undefined;

  const save = () => {
    if (companyError) return;
    toast({ tone: "success", title: "Settings saved", description: "Meridian Studios has been updated." });
  };

  return (
    <div className="yt" style={{ background: "var(--bg)", padding: 32, minHeight: "100%" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "0 0 4px", color: "var(--text)" }}>Client settings</h1>
      <p style={{ fontFamily: "var(--font-text)", color: "var(--text-muted)", margin: "0 0 24px" }}>Meridian Studios Ltd</p>

      <Card style={{ maxWidth: 560 }}>
        <Input label="Client name" defaultValue="Meridian Studios Ltd" />
        <Input label="Company number" value={companyNo} onChange={(e) => setCompanyNo(e.target.value)}
          error={companyError} hint={companyError ? undefined : "8 digits, as registered at Companies House."} />
        <Select label="VAT scheme" hint="We'll set filing reminders to match.">
          <option>Standard (20%)</option><option>Flat rate</option><option>Cash accounting</option><option>Not registered</option>
        </Select>

        <div className="field">
          <span className="field-label">Services</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag onRemove={() => {}}>Bookkeeping</Tag>
            <Tag onRemove={() => {}}>VAT returns</Tag>
            <Tag onRemove={() => {}}>Management accounts</Tag>
          </div>
        </div>

        <RadioGroup name="cadence" label="Reporting cadence"
          defaultValue="monthly"
          options={[
            { value: "monthly", label: "Monthly", hint: "Recommended for growing businesses" },
            { value: "quarterly", label: "Quarterly" },
          ]} />

        <Textarea label="Internal notes" placeholder="Anything the team should know about this client…" />

        <Divider />

        <Checkbox label="Email the monthly management pack" defaultChecked />
        <div style={{ height: 12 }} />
        <Switch label="Bank feed connected" checked={feedConnected}
          onChange={(e) => { const on = e.target.checked; if (!on) setDisconnectOpen(true); else setFeedConnected(true); }} />

        {companyError && (
          <Alert tone="danger" title="Fix one field before saving" style={{ marginTop: 20 }}>
            The company number needs to be 8 digits.
          </Alert>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" onClick={save}><Icon name="check" size={16} /> Save changes</Button>
        </div>
      </Card>

      <Modal
        open={disconnectOpen}
        onClose={() => { setDisconnectOpen(false); setFeedConnected(true); }}
        title="Disconnect bank feed?"
        footer={<>
          <Button variant="ghost" onClick={() => { setDisconnectOpen(false); setFeedConnected(true); }}>Keep connected</Button>
          <Button variant="danger" onClick={() => { setFeedConnected(false); setDisconnectOpen(false); toast({ tone: "warning", title: "Bank feed disconnected" }); }}>Disconnect</Button>
        </>}
      >
        Transactions will stop importing automatically and reconciliation may fall behind. You can reconnect at any time.
      </Modal>
    </div>
  );
}

/** Client settings form — validation, a confirm modal, and a save toast. */
export function SettingsFormExample() {
  return (
    <ToastProvider>
      <SettingsForm />
    </ToastProvider>
  );
}
