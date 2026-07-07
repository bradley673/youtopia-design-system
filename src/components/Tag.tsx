import React from "react";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Show a remove (×) button and handle its click. */
  onRemove?: () => void;
}

/**
 * A removable label for user-applied categories/filters
 * (distinct from <Badge>, which conveys read-only status).
 */
export function Tag({ onRemove, className = "", children, ...rest }: TagProps) {
  return (
    <span className={["tag", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {onRemove && (
        <button type="button" className="tag-remove" aria-label="Remove" onClick={onRemove}>
          ×
        </button>
      )}
    </span>
  );
}
