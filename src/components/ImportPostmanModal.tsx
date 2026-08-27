import { useMemo, useRef, useState } from "react";
import type { Folder } from "../hooks/useWorkspace.ts";
import { parsePostman, type ParsedPostman } from "../lib/parsePostman.ts";
import Modal from "./Modal.tsx";
import { field, fieldMono, btnOutline, btnSignal, panelLabel } from "./ui.ts";
import { methodLamp } from "../lib/lamp.ts";

/** Import Postman Collection (v2.x JSON) ke sebuah folder — khusus user login. */
export default function ImportPostmanModal({
  open,
  folders,
  onClose,
  onImport,
}: {
  open: boolean;
  folders: Folder[];
  onClose: () => void;
  onImport: (folderId: string, parsed: ParsedPostman) => void;
}) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  // Parse langsung saat mengetik/menempel agar preview jumlah endpoint tampil.
  const parsed = useMemo<ParsedPostman | null>(() => {
    if (!raw.trim()) return null;
    try {
      return parsePostman(raw);
    } catch {
      return null;
    }
  }, [raw]);

  const reset = () => {
    setRaw("");
    setErr(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setRaw(await file.text());
      setErr(null);
    } catch {
      setErr("Gagal membaca file.");
    }
  };

  const doImport = () => {
    const fid = folderId || folders[0]?.id;
    if (!fid) {
      setErr("Pilih folder tujuan dulu.");
      return;
    }
    try {
      const p = parsePostman(raw);
      if (p.items.length === 0) {
        setErr("Koleksi tak berisi request apa pun.");
        return;
      }
      onImport(fid, p);
      reset();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal parse. Pastikan ini export Postman Collection v2.x (JSON).");
    }
  };

  return (
    <Modal open={open} title="Import dari Postman" onClose={onClose}>
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className={panelLabel}>Folder tujuan</span>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className={field + " cursor-pointer"}
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id} className="bg-elevated">
                {f.folder_name}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1.5">
          <span className={panelLabel}>Collection JSON</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="block w-full text-[13px] text-text-dim file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-text-dim hover:file:border-signal-dim hover:file:text-signal"
          />
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder='…atau tempel isi file .postman_collection.json di sini'
            spellCheck={false}
            className={fieldMono + " h-36 resize-y text-[13px] leading-relaxed"}
          />
        </div>

        {parsed && (
          <div className="rounded-panel border border-border bg-surface-2 p-3">
            <p className="text-[13px] text-text-dim">
              <b className="text-text">{parsed.name}</b> — {parsed.items.length} endpoint
            </p>
            <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto">
              {parsed.items.slice(0, 30).map((it, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="tnum w-12 shrink-0 font-mono font-bold"
                    style={{ color: methodLamp(it.method) }}
                  >
                    {it.method}
                  </span>
                  <span className="truncate text-text-dim">{it.name}</span>
                </li>
              ))}
              {parsed.items.length > 30 && (
                <li className="text-[12px] text-text-faint">+{parsed.items.length - 30} lainnya…</li>
              )}
            </ul>
          </div>
        )}

        {err && <p className="text-[14px] text-err">{err}</p>}
        <p className="text-[12px] leading-relaxed text-text-faint">
          Hanya body mode <span className="font-mono">raw</span> yang diimport; form-data & file
          diabaikan. Header sensitif otomatis di-mask.
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnOutline}>
            Batal
          </button>
          <button onClick={doImport} disabled={!parsed || folders.length === 0} className={btnSignal}>
            Import {parsed ? `(${parsed.items.length})` : ""}
          </button>
        </div>
      </div>
    </Modal>
  );
}
