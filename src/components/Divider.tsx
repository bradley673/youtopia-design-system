import React from "react";

export interface DividerProps {
  /** Optional centered label, e.g. "or". */
  label?: string;
  orientation?: "horizontal" | "vertical";
}

/** A hairline separator. With a label it becomes a labelled rule. */
export function Divider({ label, orientation = "horizontal" }: DividerProps) {
  if (orientation === "vertical") {
    return <span className="divider-v" role="separator" aria-orientation="vertical" />;
  }
  if (label) {
    return (
      <div className="divider-labelled" role="separator" aria-label={label}>
        <span>{label}</span>
      </div>
    );
  }
  return <hr className="divider" />;
}
