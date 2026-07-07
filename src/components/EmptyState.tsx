import React from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional illustration or icon node. */
  icon?: React.ReactNode;
  /** Primary action, e.g. a Button. */
  action?: React.ReactNode;
}

/** Shown when a list or view has no data yet. Guides the next step. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
