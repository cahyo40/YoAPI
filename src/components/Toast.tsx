import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: string; msg: string; kind: "success" | "error" | "info" };
const Ctx = createContext<(msg: string, kind?: Toast["kind"]) => void>(() => {});

export const useToast = () => useContext(Ctx);

/** Toast pojok kanan bawah, auto-dismiss 3s, aria-live polite (DESIGN.md). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, kind: Toast["kind"] = "success") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="ignite flex items-center gap-2.5 rounded-lg border bg-elevated px-3.5 py-2.5 text-[14px] text-text shadow-panel"
            style={{
              borderColor:
                t.kind === "success" ? "var(--signal-dim)" : t.kind === "info" ? "var(--info)" : "var(--err)",
            }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                background: t.kind === "success" ? "var(--ok)" : t.kind === "info" ? "var(--info)" : "var(--err)",
                boxShadow: `0 0 8px ${t.kind === "success" ? "var(--ok)" : t.kind === "info" ? "var(--info)" : "var(--err)"}`,
              }}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
