import { useEffect, type ReactNode } from "react";

/** Modal instrumen — overlay gelap + panel terangkat, Esc menutup. */
export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="ignite w-full max-w-sm rounded-panel border border-border-strong bg-elevated p-5 text-text shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-mono text-[12px] uppercase tracking-[0.16em] text-text-dim">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
