import React from "react";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Show the leading status dot. */
  dot?: boolean;
}

/**
 * Status pill. Always pairs colour with a word — never colour alone —
 * so meaning is legible for everyone.
 */
export function Badge({ tone = "neutral", dot = true, className = "", children, ...rest }: BadgeProps) {
  const cls = ["badge", `badge-${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
