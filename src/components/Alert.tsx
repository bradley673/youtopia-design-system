import React from "react";

export type AlertTone = "success" | "warning" | "danger" | "info";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title: string;
}

const glyph: Record<AlertTone, string> = { success: "✓", warning: "!", danger: "×", info: "i" };

/**
 * Inline message. Says what happened and what to do next —
 * no apologies, no vagueness.
 */
export function Alert({ tone = "info", title, className = "", children, ...rest }: AlertProps) {
  const cls = ["alert", `alert-${tone}`, className].filter(Boolean).join(" ");
  return (
    <div className={cls} role={tone === "danger" ? "alert" : "status"} {...rest}>
      <span className="alert-ico" aria-hidden="true">{glyph[tone]}</span>
      <div>
        <strong className="alert-title">{title}</strong>
        {children && <p className="alert-body">{children}</p>}
      </div>
    </div>
  );
}
