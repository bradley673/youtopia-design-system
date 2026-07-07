import React from "react";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple panels open at once. Defaults to single. */
  multiple?: boolean;
  defaultOpen?: string[];
}

/** Disclosure list. Keyboard- and screen-reader-friendly. */
export function Accordion({ items, multiple = false, defaultOpen = [] }: AccordionProps) {
  const [open, setOpen] = React.useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="accordion">
      {items.map((it) => {
        const isOpen = open.has(it.id);
        return (
          <div className="accordion-item" key={it.id}>
            <h3 className="accordion-heading">
              <button
                type="button"
                className="accordion-trigger"
                aria-expanded={isOpen}
                aria-controls={`acc-panel-${it.id}`}
                id={`acc-trigger-${it.id}`}
                onClick={() => toggle(it.id)}
              >
                <span>{it.title}</span>
                <span className="accordion-chevron" aria-hidden="true" data-open={isOpen || undefined}>⌄</span>
              </button>
            </h3>
            <div
              id={`acc-panel-${it.id}`}
              role="region"
              aria-labelledby={`acc-trigger-${it.id}`}
              className="accordion-panel"
              hidden={!isOpen}
            >
              <div className="accordion-content">{it.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
