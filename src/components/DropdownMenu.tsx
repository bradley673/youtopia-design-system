import React from "react";

export interface MenuAction {
  label: string;
  onSelect: () => void;
  /** Render in the danger colour (e.g. "Delete"). */
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** The trigger element (usually a Button). */
  trigger: React.ReactElement;
  items: MenuAction[];
  align?: "start" | "end";
}

/** Click-to-open action menu with outside-click and Escape dismissal. */
export function DropdownMenu({ trigger, items, align = "start" }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const triggerEl = React.cloneElement(trigger, {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: () => setOpen((v) => !v),
  });

  return (
    <div className="menu-root" ref={rootRef}>
      {triggerEl}
      {open && (
        <div className={`menu menu-${align}`} role="menu">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className={["menu-item", it.danger ? "menu-item-danger" : ""].filter(Boolean).join(" ")}
              disabled={it.disabled}
              onClick={() => { it.onSelect(); setOpen(false); }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
