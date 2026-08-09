import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { haptic } from "@/lib/haptics";
import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
  type ToastItem,
  type ToastKind,
} from "./toastContext";

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

const SHOW_MS = 4200;
const LEAVE_MS = 260;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, LEAVE_MS);
  }, []);

  const toast = useCallback(
    ({ kind = "info", title, message }: ToastInput) => {
      // The buzz tells the doctor the outcome without reading the toast.
      haptic(kind === "success" ? "success" : kind === "error" ? "error" : "light");
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, kind, title, message, leaving: false },
      ]);
      window.setTimeout(() => dismiss(id), SHOW_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="ui-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`ui-toast ui-toast--${t.kind} ${t.leaving ? "ui-toast--leaving" : ""}`}
              onClick={() => dismiss(t.id)}
              role="status"
            >
              <span className="ui-toast__icon">{ICONS[t.kind]}</span>
              <div>
                <div className="ui-toast__title">{t.title}</div>
                {t.message && <div className="ui-toast__msg">{t.message}</div>}
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
