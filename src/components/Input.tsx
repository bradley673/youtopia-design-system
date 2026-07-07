import React from "react";

let uid = 0;
const nextId = () => `yt-field-${++uid}`;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  /** Error text — also flips the field into its error style. */
  error?: string;
}

/**
 * Labelled text input. Labels are always visible; errors explain the fix.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = "", ...rest },
  ref
) {
  const autoId = React.useMemo(nextId, []);
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errId = `${fieldId}-err`;
  const cls = ["input", error ? "is-error" : "", className].filter(Boolean).join(" ");
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={fieldId}>{label}</label>}
      <input
        ref={ref}
        id={fieldId}
        className={cls}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : hint ? hintId : undefined}
        {...rest}
      />
      {error ? (
        <p className="field-error" id={errId}>{error}</p>
      ) : hint ? (
        <p className="field-hint" id={hintId}>{hint}</p>
      ) : null}
    </div>
  );
});
