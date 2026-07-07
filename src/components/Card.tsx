import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Apply the standard internal padding. Turn off to lay out custom regions. */
  padded?: boolean;
}

/**
 * The workhorse container: summary first, detail second, one clear action.
 */
export function Card({ padded = true, className = "", children, ...rest }: CardProps) {
  const cls = ["card", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {padded ? <div className="card-pad">{children}</div> : children}
    </div>
  );
}
