import React from "react";

export interface ProgressProps {
  /** 0–100. */
  value: number;
  max?: number;
  label?: string;
}

/** Determinate progress bar using the brand magenta→purple gradient. */
export function Progress({ value, max = 100, label }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <span className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
