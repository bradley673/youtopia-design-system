import React from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Footer actions, typically Buttons. */
  footer?: React.ReactNode;
  /** Max width in px. */
  width?: number;
}

/**
 * Accessible dialog: focus moves in on open and restores on close, Escape and
 * backdrop-click dismiss, and body scroll is locked while open.
 */
export function Modal({ open, onClose, title, children, footer, width = 480 }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const lastFocused = React.useRef<Element | null>(null);
  const titleId = React.useId?.() ?? "yt-modal-title";

  React.useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (lastFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        style={{ maxWidth: width }}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{title}</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
