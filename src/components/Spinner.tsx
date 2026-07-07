import React from "react";

export interface SpinnerProps {
  size?: number;
  label?: string;
}

/** Indeterminate loading spinner. Provide a label for screen readers. */
export function Spinner({ size = 20, label = "Loading" }: SpinnerProps) {
  return (
    <span
      className="spinner"
      role="status"
      aria-label={label}
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
    />
  );
}
