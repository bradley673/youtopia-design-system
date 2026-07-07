import React from "react";
import { createPortal } from "react-dom";

export type ToastTone = "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Auto-dismiss after ms. Set 0 to keep until dismissed. Default 4500. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/** Wrap your app once; then call useToast() anywhere below it. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastRecord[]>([]);
  const seq = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((opts: ToastOptions) => {
    const id = ++seq.current;
    setItems((list) => [...list, { id, tone: "info", duration: 4500, ...opts }]);
    const d = opts.duration ?? 4500;
    if (d > 0) setTimeout(() => dismiss(id), d);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="toast-region" role="region" aria-label="Notifications">
            {items.map((t) => (
              <div key={t.id} className={`toast toast-${t.tone}`} role="status">
                <div className="toast-text">
                  <strong className="toast-title">{t.title}</strong>
                  {t.description && <p className="toast-desc">{t.description}</p>}
                </div>
                <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>.");
  return ctx;
}
