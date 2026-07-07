import React from "react";

export type BannerTone = "info" | "success" | "warning" | "danger";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: BannerTone;
  title: string;
  /** Optional action element rendered on the right (e.g. a Button). */
  action?: React.ReactNode;
  onDismiss?: () => void;
}

/**
 * Page- or section-level message. Wider and more prominent than an inline
 * Alert — use for things that affect the whole view.
 */
export function Banner({ tone = "info", title, action, onDismiss, className = "", children, ...rest }: BannerProps) {
  const cls = ["banner", `banner-${tone}`, className].filter(Boolean).join(" ");
  return (
    <div className={cls} role={tone === "danger" ? "alert" : "status"} {...rest}>
      <div className="banner-text">
        <strong className="banner-title">{title}</strong>
        {children && <p className="banner-body">{children}</p>}
      </div>
      {action && <div className="banner-action">{action}</div>}
      {onDismiss && (
        <button type="button" className="banner-close" aria-label="Dismiss" onClick={onDismiss}>×</button>
      )}
    </div>
  );
}
