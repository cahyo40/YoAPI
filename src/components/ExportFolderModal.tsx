import { useState } from "react";
import Modal from "./Modal.tsx";
import type { SavedRequest } from "../hooks/useWorkspace.ts";
import type { TargetLang } from "../types.ts";
import { methodLamp } from "../lib/lamp.ts";
import { field, btnOutline, btnSignal, panelLabel } from "./ui.ts";
import { IconDownload } from "./icons.tsx";

const LANGS: { v: TargetLang; label: string }[] = [
  { v: "dart", label: "Dart" },
  { v: "kotlin", label: "Kotlin" },
  { v: "swift", label: "Swift" },
  { v: "typescript", label: "TypeScript" },
  { v: "go", label: "Go" },
  { v: "python", label: "Python" },
  { v: "java", label: "Java" },
  { v: "csharp", label: "C#" },
  { v: "rust", label: "Rust" },
];

export default function ExportFolderModal({
  open,
  folderName,
  requests,
  busy,
  onClose,
  onExport,
}: {
  open: boolean;
  folderName: string;
  requests: SavedRequest[];
  busy: boolean;
  onClose: () => void;
  onExport: (ids: string[], target: TargetLang) => void;
}) {
  const [target, setTarget] = useState<TargetLang>("dart");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = requests.length > 0 && selected.size === requests.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(requests.map((r) => r.id)));

  return (
    <Modal open={open} title={`Export "${folderName}"`} onClose={onClose}>
      <div className="space-y-4">
        <label className="flex items-center gap-2.5">
          <span className={panelLabel}>Bahasa</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as TargetLang)}
            className={field + " w-auto cursor-pointer"}
          >
            {LANGS.map((l) => (
              <option key={l.v} value={l.v} className="bg-elevated">
                {l.label}
              </option>
            ))}
          </select>
        </label>

        {requests.length === 0 ? (
          <p className="text-[13px] text-text-faint">Folder ini belum punya request.</p>
        ) : (
          <>
            <label className="flex items-center gap-2.5 border-b border-border pb-2 text-[14px] font-medium">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-signal" />
              Pilih semua ({requests.length})
            </label>
            <ul className="max-h-48 space-y-0.5 overflow-y-auto">
              {requests.map((r) => (
                <li key={r.id}>
                  <label className="flex items-center gap-2.5 rounded-md px-1 py-1 transition hover:bg-surface-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="accent-signal"
                    />
                    <span
                      className="tnum font-mono text-[11px] font-bold"
                      style={{ color: methodLamp(r.http_method) }}
                    >
                      {r.http_method}
                    </span>
                    <span className="truncate text-[14px] text-text-dim">{r.request_name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnOutline}>
            Batal
          </button>
          <button
            onClick={() => onExport([...selected], target)}
            disabled={selected.size === 0 || busy}
            className={btnSignal}
          >
            <IconDownload size={15} />
            {busy ? "Mengekspor…" : `Export (${selected.size})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
