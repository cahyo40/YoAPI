import { useState } from "react";
import type { Folder } from "../hooks/useWorkspace.ts";
import Modal from "./Modal.tsx";
import { field, btnOutline, btnSignal, panelLabel } from "./ui.ts";

/** Modal simpan request — ganti prompt/confirm native (RULES non-negotiable #7). */
export default function SaveRequestModal({
  open,
  folders,
  sensitive,
  onClose,
  onSave,
}: {
  open: boolean;
  folders: Folder[];
  sensitive: boolean;
  onClose: () => void;
  onSave: (folderId: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fid = folderId || folders[0]?.id;
    if (!name.trim() || !fid) return;
    onSave(fid, name.trim());
    setName("");
  };

  return (
    <Modal open={open} title="Simpan request ke folder" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className={panelLabel}>Folder</span>
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

        <label className="block space-y-1.5">
          <span className={panelLabel}>Nama request</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Daftar produk"
            className={field}
          />
        </label>

        {sensitive && (
          <p
            className="rounded-lg px-3 py-2 text-[13px] text-warn"
            style={{ background: "color-mix(in srgb, var(--warn) 12%, transparent)" }}
          >
            Header sensitif (token/API key) terdeteksi — akan disimpan dalam bentuk ter-mask.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnOutline}>
            Batal
          </button>
          <button type="submit" disabled={!name.trim()} className={btnSignal}>
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
