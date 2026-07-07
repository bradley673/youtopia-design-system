import React from "react";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  /** Uncontrolled initial tab id. Defaults to the first item. */
  defaultTab?: string;
}

/**
 * Tabs for switching views within one context — not page navigation.
 * Fully keyboard operable (arrow keys move focus and selection).
 */
export function Tabs({ items, defaultTab }: TabsProps) {
  const [active, setActive] = React.useState(defaultTab ?? items[0]?.id);
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = items[(index + dir + items.length) % items.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div>
      <div className="tabs" role="tablist">
        {items.map((it, i) => (
          <button
            key={it.id}
            ref={(el) => { refs.current[it.id] = el; }}
            className="tab"
            role="tab"
            id={`tab-${it.id}`}
            aria-selected={active === it.id}
            aria-controls={`panel-${it.id}`}
            tabIndex={active === it.id ? 0 : -1}
            onClick={() => setActive(it.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          className="tabpanel"
          role="tabpanel"
          id={`panel-${it.id}`}
          aria-labelledby={`tab-${it.id}`}
          hidden={active !== it.id}
        >
          {it.content}
        </div>
      ))}
    </div>
  );
}
