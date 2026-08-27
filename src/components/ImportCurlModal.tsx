import { useState } from "react";
import Modal from "./Modal.tsx";
import { parseCurl } from "../lib/parseCurl.ts";
import type { ParsedCurl } from "../lib/parseCurl.ts";
import { fieldMono, btnOutline, btnSignal } from "./ui.ts";

export default function ImportCurlModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (r: ParsedCurl) => void;
}) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const doImport = () => {
    try {
      const r = parseCurl(raw);
      if (!r.url) {
        setErr("URL tak ditemukan di perintah cURL.");
        return;
      }
      onImport(r);
      setRaw("");
      setErr(null);
      onClose();
    } catch {
      setErr("Gagal parse. Pastikan ini perintah cURL valid.");
    }
  };

  return (
    <Modal open={open} title="Import cURL" onClose={onClose}>
      <div className="space-y-3">
        <textarea
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="curl -X POST https://api.example.com ..."
          spellCheck={false}
          className={fieldMono + " h-40 resize-y text-[13px] leading-relaxed"}
        />
        {err && <p className="text-[14px] text-err">{err}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnOutline}>
            Batal
          </button>
          <button onClick={doImport} disabled={!raw.trim()} className={btnSignal}>
            Import
          </button>
        </div>
      </div>
    </Modal>
  );
}
