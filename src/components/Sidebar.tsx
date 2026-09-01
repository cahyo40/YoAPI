import { useState } from "react";
import { Link } from "react-router-dom";
import type { Folder, SavedRequest } from "../hooks/useWorkspace.ts";
import { methodLamp } from "../lib/lamp.ts";
import Modal from "./Modal.tsx";
import ConfirmModal from "./ConfirmModal.tsx";
import { field, fieldMono, btnOutline, btnSignal, panelLabel } from "./ui.ts";
import { IconPlus, IconEdit, IconTrash, IconDownload, IconFolder, IconChevron, IconX } from "./icons.tsx";

export default function Sidebar({
  authed,
  folders,
  requests,
  open,
  onClose,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onExportFolder,
  onPickRequest,
  onUpdateRequest,
  onDeleteRequest,
}: {
  authed: boolean;
  folders: Folder[];
  requests: SavedRequest[];
  open: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onExportFolder: (f: Folder) => void;
  onPickRequest: (r: SavedRequest) => void;
  onUpdateRequest: (id: string, name: string, url: string, folderId: string) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const [newFolder, setNewFolder] = useState("");
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const [editingReq, setEditingReq] = useState<SavedRequest | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [deletingReq, setDeletingReq] = useState<SavedRequest | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleFolder = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Kelas panel: statis di desktop (lg+), drawer off-canvas di tablet/mobile.
  const shell =
    "fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] transform border-r border-border bg-surface " +
    "shadow-panel transition-transform duration-200 lg:static lg:z-auto lg:w-56 lg:max-w-none lg:transform-none lg:shadow-none " +
    (open ? "translate-x-0" : "-translate-x-full lg:translate-x-0");
  // Backdrop hanya di mobile/tablet saat drawer terbuka.
  const backdrop = open ? (
    <div
      className="fixed inset-0 z-30 bg-black/50 lg:hidden"
      onClick={onClose}
      aria-hidden
    />
  ) : null;

  if (!authed) {
    return (
      <>
        {backdrop}
        <aside className={shell + " flex shrink-0 flex-col gap-3 p-3"}>
          <span className={panelLabel}>Collections</span>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <IconFolder size={18} className="text-text-faint" />
            <p className="mt-2 text-[12px] leading-relaxed text-text-dim">
              Simpan endpoint & organisasi folder butuh akun.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-signal px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-on-signal shadow-glow transition hover:brightness-110"
            >
              Login untuk simpan
            </Link>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {backdrop}
      <aside className={shell + " flex shrink-0 flex-col overflow-hidden"}>
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <input
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newFolder.trim()) {
              onCreateFolder(newFolder.trim());
              setNewFolder("");
            }
          }}
          placeholder="Folder baru"
          className={field + " py-1 text-[12px]"}
        />
        <button
          onClick={() => {
            if (newFolder.trim()) {
              onCreateFolder(newFolder.trim());
              setNewFolder("");
            }
          }}
          className="shrink-0 rounded-md border border-border bg-surface-2 p-1.5 text-text-dim transition hover:border-signal-dim hover:text-signal"
          aria-label="Tambah folder"
        >
          <IconPlus size={14} />
        </button>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md border border-border bg-surface-2 p-1.5 text-text-dim transition hover:border-signal-dim hover:text-signal lg:hidden"
          aria-label="Tutup panel"
        >
          <IconX size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {folders.length === 0 && (
          <p className="px-1 pt-2 text-[13px] leading-relaxed text-text-faint">
            Belum ada folder. Buat satu untuk mengumpulkan endpoint.
          </p>
        )}
        {folders.map((f) => {
          const items = requests.filter((r) => r.folder_id === f.id);
          const open = !collapsed.has(f.id);
          return (
            <div key={f.id} className="group/folder">
              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={() => toggleFolder(f.id)}
                  aria-label={open ? "Tutup folder" : "Buka folder"}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-1 rounded-md py-0.5 text-left transition hover:text-signal"
                >
                  <IconChevron
                    size={13}
                    className={`shrink-0 text-text-faint transition-transform ${open ? "rotate-90" : ""}`}
                  />
                  <IconFolder size={14} className="shrink-0 text-text-faint" />
                  <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-text">
                    {f.folder_name}
                    <span className="tnum ml-1.5 font-mono text-[12px] text-text-faint">
                      {items.length}
                    </span>
                  </p>
                </button>
                <FolderAction label="Download (zip)" onClick={() => onExportFolder(f)}>
                  <IconDownload size={14} />
                </FolderAction>
                <FolderAction
                  label="Rename"
                  onClick={() => {
                    setRenaming(f);
                    setRenameVal(f.folder_name);
                  }}
                >
                  <IconEdit size={14} />
                </FolderAction>
                <FolderAction label="Hapus" danger onClick={() => setDeleting(f)}>
                  <IconTrash size={14} />
                </FolderAction>
              </div>

              {open && (
                <ul className="mt-1 space-y-0.5 border-l border-border pl-2.5">
                  {items.length === 0 && (
                    <li className="py-1 pl-2 text-[12px] text-text-faint">Kosong</li>
                  )}
                  {items.map((r) => (
                    <li key={r.id} className="group/req flex items-center gap-1 rounded-md pl-2 pr-1 transition hover:bg-surface-2">
                      <button
                        onClick={() => {
                          onPickRequest(r);
                          onClose(); // tutup drawer di mobile setelah pilih
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                      >
                        <span
                          className="tnum shrink-0 font-mono text-[11px] font-bold"
                          style={{ color: methodLamp(r.http_method) }}
                        >
                          {r.http_method}
                        </span>
                        <span className="truncate text-[13px] text-text-dim transition group-hover/req:text-text">
                          {r.request_name}
                        </span>
                      </button>
                      <FolderAction
                        label="Edit"
                        req
                        onClick={() => {
                          setEditingReq(r);
                          setEditName(r.request_name);
                          setEditUrl(r.endpoint_url);
                          setEditFolder(r.folder_id);
                        }}
                      >
                        <IconEdit size={13} />
                      </FolderAction>
                      <FolderAction label="Hapus" req danger onClick={() => setDeletingReq(r)}>
                        <IconTrash size={13} />
                      </FolderAction>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!renaming} title="Rename folder" onClose={() => setRenaming(null)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming && renameVal.trim()) {
              onRenameFolder(renaming.id, renameVal.trim());
              setRenaming(null);
            }
          }}
          className="space-y-4"
        >
          <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} className={field} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRenaming(null)} className={btnOutline}>
              Batal
            </button>
            <button type="submit" disabled={!renameVal.trim()} className={btnSignal}>
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingReq} title="Edit endpoint" onClose={() => setEditingReq(null)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingReq && editName.trim() && editUrl.trim() && editFolder) {
              onUpdateRequest(editingReq.id, editName.trim(), editUrl.trim(), editFolder);
              setEditingReq(null);
            }
          }}
          className="space-y-4"
        >
          <label className="block space-y-1.5">
            <span className={panelLabel}>Nama endpoint</span>
            <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className={panelLabel}>URL endpoint</span>
            <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className={fieldMono} />
          </label>
          <label className="block space-y-1.5">
            <span className={panelLabel}>Folder</span>
            <select
              value={editFolder}
              onChange={(e) => setEditFolder(e.target.value)}
              className={field + " cursor-pointer"}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-elevated">
                  {f.folder_name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingReq(null)} className={btnOutline}>
              Batal
            </button>
            <button type="submit" disabled={!editName.trim() || !editUrl.trim()} className={btnSignal}>
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deletingReq}
        title="Hapus endpoint?"
        message={
          <>
            Endpoint <b className="text-text">{deletingReq?.request_name}</b> akan dihapus permanen.
          </>
        }
        onConfirm={() => deletingReq && onDeleteRequest(deletingReq.id)}
        onClose={() => setDeletingReq(null)}
      />

      <ConfirmModal
        open={!!deleting}
        title="Hapus folder?"
        message={
          <>
            Folder <b className="text-text">{deleting?.folder_name}</b> dan semua endpoint di dalamnya akan dihapus permanen.
          </>
        }
        onConfirm={() => deleting && onDeleteFolder(deleting.id)}
        onClose={() => setDeleting(null)}
      />
      </aside>
    </>
  );
}

function FolderAction({
  label,
  onClick,
  danger,
  req,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  req?: boolean;
  children: React.ReactNode;
}) {
  const group = req ? "group-hover/req:opacity-100" : "group-hover/folder:opacity-100";
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`shrink-0 rounded-md p-1 text-text-faint opacity-0 transition ${group} hover:bg-elevated ${
        danger ? "hover:text-err" : "hover:text-signal"
      }`}
    >
      {children}
    </button>
  );
}
