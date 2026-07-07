import React from "react";

let uid = 0;
const nextId = () => `yt-select-${++uid}`;

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Labelled select with the Youtopia chevron affordance. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className = "", children, ...rest },
  ref
) {
  const autoId = React.useMemo(nextId, []);
  const fieldId = id ?? autoId;
  const cls = ["select", error ? "is-error" : "", className].filter(Boolean).join(" ");
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={fieldId}>{label}</label>}
      <select ref={ref} id={fieldId} className={cls} aria-invalid={error ? true : undefined} {...rest}>
        {children}
      </select>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
});
