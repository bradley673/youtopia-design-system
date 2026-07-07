import React from "react";

export interface Segment {
  value: string;
  label: React.ReactNode;
}

export interface SegmentedControlProps {
  segments: Segment[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  "aria-label"?: string;
}

/**
 * Compact single-select toggle for switching between a few equal options
 * (e.g. Week / Month / Quarter). Roving-tabindex keyboard support.
 */
export function SegmentedControl({ segments, value, defaultValue, onChange, ...aria }: SegmentedControlProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? segments[0]?.value);
  const selected = value ?? internal;
  const set = (v: string) => { if (value === undefined) setInternal(v); onChange?.(v); };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    set(segments[(i + dir + segments.length) % segments.length].value);
  };

  return (
    <div className="segmented" role="tablist" aria-label={aria["aria-label"]}>
      {segments.map((s, i) => (
        <button
          key={s.value}
          type="button"
          role="tab"
          className="segment"
          aria-selected={selected === s.value}
          data-active={selected === s.value || undefined}
          tabIndex={selected === s.value ? 0 : -1}
          onClick={() => set(s.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
