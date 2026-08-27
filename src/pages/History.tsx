import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { HistoryEntry } from "../types.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { useHistory } from "../hooks/useHistory.ts";
import { useWorkspace } from "../hooks/useWorkspace.ts";
import { useTheme } from "../hooks/useTheme.ts";
import { useToast } from "../components/Toast.tsx";
import { supabase } from "../lib/supabase.ts";
import AppHeader from "../components/AppHeader.tsx";
import ConfirmModal from "../components/ConfirmModal.tsx";
import SaveRequestModal from "../components/SaveRequestModal.tsx";
import DiffModal from "../components/DiffModal.tsx";
import { methodLamp, statusLamp } from "../lib/lamp.ts";
import { field, btnDanger, panelLabel } from "../components/ui.ts";
import { IconTrash, IconClock, IconArrowLeft, IconSave, IconGitCompare } from "../components/icons.tsx";

/** Group entries by calendar day for a scannable log. */
function dayLabel(at: number): string {
  const d = new Date(at);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Hari ini";
  if (sameDay(d, yest)) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function History() {
  const { dark, toggle } = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const history = useHistory(user?.id ?? null);
  const { folders, saveRequest } = useWorkspace(user?.id ?? null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saving, setSaving] = useState<HistoryEntry | null>(null);
  const [diff, setDiff] = useState<{ url: string; older: string; newer: string } | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle
      ? history.entries.filter(
          (e) => e.url.toLowerCase().includes(needle) || e.method.toLowerCase().includes(needle),
        )
      : history.entries;
  }, [history.entries, q]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const e of filtered) {
      const k = dayLabel(e.at);
      (map.get(k) ?? map.set(k, []).get(k)!).push(e);
    }
    return [...map.entries()];
  }, [filtered]);

  const remove = async (id: string) => {
    const err = await history.remove(id);
    if (err) toast(`Gagal hapus: ${err}`, "error");
  };
  const clear = async () => {
    const err = await history.clear();
    if (err) toast(`Gagal hapus: ${err}`, "error");
  };

  // Simpan entri history ke folder. History hanya punya method+URL, jadi
  // header/params/body kosong — user lengkapi di Console bila perlu.
  const doSaveToFolder = async (folderId: string, name: string) => {
    if (!saving) return;
    const entry = saving;
    setSaving(null);
    const err = await saveRequest({
      folderId,
      name,
      method: entry.method,
      url: entry.url,
      headers: [],
      params: [],
      body: "",
    });
    toast(err ? `Gagal simpan: ${err}` : "Endpoint tersimpan ke folder.", err ? "error" : "success");
  };

  // Cari entri lebih lama dengan URL+method sama yang punya body → untuk diff.
  const prevBodyOf = (e: HistoryEntry): string | null => {
    if (!e.body) return null;
    const older = history.entries.find(
      (o) => o.at < e.at && o.url === e.url && o.method === e.method && o.body,
    );
    return older?.body ?? null;
  };

  return (
    <div className="instrument-grid flex h-[100dvh] flex-col bg-bg text-text">
      <AppHeader
        dark={dark}
        user={user}
        onToggleTheme={toggle}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-5 sm:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Riwayat</h1>
            <p className="mt-1 text-[14px] text-text-dim">
              {history.entries.length > 0
                ? `${history.entries.length} eksekusi tercatat${user ? "" : " di browser ini"}.`
                : "Setiap request yang kamu kirim tercatat di sini."}
            </p>
          </div>
          {history.entries.length > 0 && (
            <button onClick={() => setConfirmClear(true)} className={btnDanger + " shrink-0 py-1.5"}>
              <IconTrash size={15} />
              Hapus semua
            </button>
          )}
        </div>

        {history.entries.length > 0 && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari URL atau method…"
            className={field + " mb-5 font-mono"}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {history.entries.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <p className="pt-8 text-center text-[14px] text-text-faint">
              Tak ada yang cocok dengan “{q}”.
            </p>
          ) : (
            <div className="space-y-7">
              {groups.map(([label, entries]) => (
                <section key={label}>
                  <h2 className={panelLabel + " mb-2.5"}>{label}</h2>
                  <ul className="overflow-hidden rounded-panel border border-border bg-surface">
                    {entries.map((e, i) => (
                      <li
                        key={e.id}
                        className={`group flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-2 ${
                          i > 0 ? "border-t border-border" : ""
                        }`}
                      >
                        <Link
                          to={`/?replay=${e.id}`}
                          state={{ method: e.method, url: e.url }}
                          className="flex min-w-0 flex-1 items-center gap-3"
                          title="Buka ulang di Console"
                        >
                          <span
                            className="tnum w-14 shrink-0 font-mono text-[12px] font-bold"
                            style={{ color: methodLamp(e.method) }}
                          >
                            {e.method}
                          </span>
                          <span className="truncate font-mono text-[13px] text-text-dim group-hover:text-text">
                            {e.url}
                          </span>
                        </Link>
                        <span
                          className="tnum shrink-0 font-mono text-[12px] font-semibold"
                          style={{ color: statusLamp(e.status) }}
                        >
                          {e.status || "—"}
                        </span>
                        <span className="tnum w-12 shrink-0 text-right font-mono text-[12px] text-text-faint">
                          {timeLabel(e.at)}
                        </span>
                        {user && (
                          <button
                            onClick={() =>
                              folders.length === 0
                                ? toast("Buat folder dulu di Console.", "error")
                                : setSaving(e)
                            }
                            className="shrink-0 rounded-md p-1 text-text-faint opacity-0 transition hover:text-signal group-hover:opacity-100"
                            aria-label="Simpan ke folder"
                            title="Simpan ke folder"
                          >
                            <IconSave size={14} />
                          </button>
                        )}
                        {(() => {
                          const older = prevBodyOf(e);
                          return older ? (
                            <button
                              onClick={() => setDiff({ url: e.url, older, newer: e.body! })}
                              className="shrink-0 rounded-md p-1 text-text-faint opacity-0 transition hover:text-signal group-hover:opacity-100"
                              aria-label="Bandingkan dengan eksekusi sebelumnya"
                              title="Diff vs eksekusi sebelumnya"
                            >
                              <IconGitCompare size={14} />
                            </button>
                          ) : null;
                        })()}
                        <button
                          onClick={() => remove(e.id)}
                          className="shrink-0 rounded-md p-1 text-text-faint opacity-0 transition hover:text-err group-hover:opacity-100"
                          aria-label="Hapus entri"
                          title="Hapus"
                        >
                          <IconTrash size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <SaveRequestModal
        open={!!saving}
        folders={folders}
        sensitive={false}
        onClose={() => setSaving(null)}
        onSave={doSaveToFolder}
      />

      <DiffModal
        open={!!diff}
        older={diff?.older ?? ""}
        newer={diff?.newer ?? ""}
        url={diff?.url ?? ""}
        onClose={() => setDiff(null)}
      />

      <ConfirmModal
        open={confirmClear}
        title="Hapus semua history?"
        message="Seluruh riwayat request akan dihapus permanen."
        confirmLabel="Hapus semua"
        onConfirm={clear}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-panel border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <IconClock size={26} className="text-text-faint" />
      <p className="max-w-[34ch] text-[14px] leading-relaxed text-text-dim">
        Belum ada riwayat. Kirim request pertamamu di Console dan hasilnya akan muncul di sini.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface-2 px-3.5 py-2 text-[14px] font-medium text-text-dim transition hover:border-signal-dim hover:text-text"
      >
        <IconArrowLeft size={15} />
        Ke Console
      </Link>
    </div>
  );
}
