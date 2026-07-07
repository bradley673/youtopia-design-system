import React from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

/** Toggle for immediate on/off settings (e.g. "Bank feed connected"). */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className = "", ...rest },
  ref
) {
  const control = (
    <span className="switch">
      <input ref={ref} type="checkbox" role="switch" {...rest} />
      <span className="track" aria-hidden="true" />
    </span>
  );
  if (!label) return control;
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: "pointer" }} className={className}>
      {control}
      <span style={{ fontFamily: "var(--font-text)", fontSize: ".9rem", color: "var(--text)" }}>{label}</span>
    </label>
  );
});
