import React from "react";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  hint?: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

/** Accessible radio group. Use for a small set of mutually exclusive choices. */
export function RadioGroup({ name, label, options, value, defaultValue, onChange }: RadioGroupProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const selected = value ?? internal;
  const set = (v: string) => { if (value === undefined) setInternal(v); onChange?.(v); };
  return (
    <div role="radiogroup" aria-label={label} className="radio-group">
      {label && <span className="field-label">{label}</span>}
      {options.map((o) => (
        <label className="radio" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={selected === o.value}
            onChange={() => set(o.value)}
          />
          <span>
            {o.label}
            {o.hint && <span className="radio-hint">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
