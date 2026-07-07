import React from "react";

export interface TooltipProps {
  /** The tooltip text. */
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: "top" | "bottom";
}

let uid = 0;

/**
 * Lightweight tooltip shown on hover and keyboard focus.
 * Wrap a single focusable element.
 */
export function Tooltip({ content, children, placement = "top" }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useMemo(() => `yt-tip-${++uid}`, []);

  return (
    <span className="tooltip-wrap">
      {React.cloneElement(children, {
        "aria-describedby": open ? id : undefined,
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      })}
      <span role="tooltip" id={id} className={`tooltip tooltip-${placement}`} data-open={open || undefined}>
        {content}
      </span>
    </span>
  );
}
