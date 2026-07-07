import React from "react";

let uid = 0;
const nextId = () => `yt-textarea-${++uid}`;

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Labelled multi-line text field, matching Input's behaviour. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className = "", rows = 4, ...rest },
  ref
) {
  const autoId = React.useMemo(nextId, []);
  const fieldId = id ?? autoId;
  const cls = ["textarea", error ? "is-error" : "", className].filter(Boolean).join(" ");
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={fieldId}>{label}</label>}
      <textarea ref={ref} id={fieldId} rows={rows} className={cls} aria-invalid={error ? true : undefined} {...rest} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
});
