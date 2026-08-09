import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, footer, maxWidth }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="ui-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="ui-modal__head">
          <h3 className="ui-modal__title">{title}</h3>
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="ui-drawer-overlay" onMouseDown={onClose} />
      <aside className="ui-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ui-drawer__head">
          <h3 className="ui-modal__title">{title}</h3>
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-drawer__body">{children}</div>
        {footer && <div className="ui-drawer__foot">{footer}</div>}
      </aside>
    </>,
    document.body,
  );
}
