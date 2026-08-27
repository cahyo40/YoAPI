import { lineDiff } from "../lib/lineDiff.ts";
import { prettyJson } from "../lib/pretty.ts";
import { IconX } from "./icons.tsx";
import { panelLabel } from "./ui.ts";

/** Diff dua body response (baris demi baris). Dipakai History untuk lihat perubahan antar eksekusi. */
export default function DiffModal({
  open,
  older,
  newer,
  url,
  onClose,
}: {
  open: boolean;
  older: string;
  newer: string;
  url: string;
  onClose: () => void;
}) {
  if (!open) return null;
  const lines = lineDiff(prettyJson(older), prettyJson(newer));
  const adds = lines.filter((l) => l.kind === "add").length;
  const dels = lines.filter((l) => l.kind === "del").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-panel border border-border bg-surface shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          <span className={panelLabel}>Diff</span>
          <span className="truncate font-mono text-[13px] text-text-dim">{url}</span>
          <span className="ml-auto shrink-0 font-mono text-[12px]">
            <span className="text-ok">+{adds}</span> <span className="text-err">−{dels}</span>
          </span>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-text-faint transition hover:text-text"
            aria-label="Tutup"
          >
            <IconX size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <pre className="font-mono text-[12px] leading-relaxed">
            {lines.map((l, i) => (
              <div
                key={i}
                className="px-4"
                style={{
                  background:
                    l.kind === "add"
                      ? "color-mix(in srgb, var(--ok) 14%, transparent)"
                      : l.kind === "del"
                        ? "color-mix(in srgb, var(--err) 14%, transparent)"
                        : "transparent",
                  color:
                    l.kind === "add"
                      ? "var(--ok)"
                      : l.kind === "del"
                        ? "var(--err)"
                        : "var(--text-dim)",
                }}
              >
                <span className="mr-2 select-none text-text-faint">
                  {l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}
                </span>
                {l.text || " "}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
