import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ApiResponse, ConvertOptions, HeaderPair, HttpMethod } from "../types.ts";
import { sendRequest } from "../lib/sendRequest.ts";
import { classNameFromUrl } from "../lib/classNameFromUrl.ts";
import { hasSensitive } from "../lib/sensitiveHeaders.ts";
import { applyEnv, envMap } from "../lib/env.ts";
import { authHeader, emptyAuth, type AuthConfig } from "../lib/auth.ts";
import type { ParsedCurl } from "../lib/parseCurl.ts";
import type { ParsedPostman } from "../lib/parsePostman.ts";
import { useConvert } from "../hooks/useConvert.ts";
import { useHistory } from "../hooks/useHistory.ts";
import { useEnv } from "../hooks/useEnv.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { useTheme } from "../hooks/useTheme.ts";
import { useToast } from "../components/Toast.tsx";
import { useWorkspace, type SavedRequest } from "../hooks/useWorkspace.ts";
import { supabase } from "../lib/supabase.ts";
import AppHeader from "../components/AppHeader.tsx";
import Footer from "../components/Footer.tsx";
import RequestBar from "../components/RequestBar.tsx";
import RequestPanel from "../components/RequestPanel.tsx";
import ResponseView from "../components/ResponseView.tsx";
import DartOutput from "../components/CodeOutput.tsx";
import Sidebar from "../components/Sidebar.tsx";
import SaveRequestModal from "../components/SaveRequestModal.tsx";
import ImportCurlModal from "../components/ImportCurlModal.tsx";
import ImportPostmanModal from "../components/ImportPostmanModal.tsx";
import ExportFolderModal from "../components/ExportFolderModal.tsx";
import ConfirmModal from "../components/ConfirmModal.tsx";
import { exportFolder, type ExportItem } from "../lib/exportFolder.ts";
import { encodeShare, decodeShare } from "../lib/share.ts";
import type { Folder } from "../hooks/useWorkspace.ts";
import type { TargetLang } from "../types.ts";
import { methodLamp } from "../lib/lamp.ts";
import { splitUrlQuery, mergeParams } from "../lib/urlQuery.ts";
import { guestRemaining, bumpGuest, GUEST_LIMIT } from "../lib/guestQuota.ts";
import { generateCurl } from "../lib/curlGenerator.ts";
import { saveDraft, loadDraft } from "../lib/draftStorage.ts";
import { IconImport, IconShare, IconSave, IconCopy } from "../components/icons.tsx";

const MAX_CONVERT_BYTES = 2 * 1024 * 1024; // cap 2 MB (TECH_SPEC)

// Contoh starter siap-klik untuk empty state (T8.5).
const STARTERS: { label: string; method: HttpMethod; url: string }[] = [
  { label: "User", method: "GET", url: "https://jsonplaceholder.typicode.com/users/1" },
  { label: "GitHub user", method: "GET", url: "https://api.github.com/users/octocat" },
  { label: "Pokémon", method: "GET", url: "https://pokeapi.co/api/v2/pokemon/ditto" },
  { label: "Random dog", method: "GET", url: "https://dog.ceo/api/breeds/image/random" },
];

export default function Dashboard() {
  const { dark, toggle: toggleTheme } = useTheme();
  const toast = useToast();
  const location = useLocation();
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/users/1");
  const [headers, setHeaders] = useState<HeaderPair[]>([]);
  const [params, setParams] = useState<HeaderPair[]>([]);
  const [body, setBody] = useState("");
  const [auth, setAuth] = useState<AuthConfig>(emptyAuth);

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [reqError, setReqError] = useState<string | null>(null);
  const [localBanner, setLocalBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConvertOptions>({
    target: "dart",
    freezed: false,
    nullSafety: true,
    jsonAnnotation: false,
    copyWith: false,
    equatable: false,
    pythonPydantic: false,
    javaLombok: false,
    csharpSystemText: false,
    rustDerive: false,
  });
  const [saveOpen, setSaveOpen] = useState(false);
  const [curlOpen, setCurlOpen] = useState(false);
  const [postmanOpen, setPostmanOpen] = useState(false);
  const [exportFolderTarget, setExportFolderTarget] = useState<Folder | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { code, error: convError, converting, convert, sampleCount } = useConvert();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const history = useHistory(userId);
  const env = useEnv();
  const { folders, requests, createFolder, renameFolder, deleteFolder, setFolderEnv, updateRequest, deleteRequest, saveRequest, importRequests } =
    useWorkspace(userId);

  // Folder aktif (T9.3): env diambil dari folder ini bila authed & terpilih.
  // Guest / belum pilih folder → env global (localStorage) sebagai fallback.
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;
  const useFolderEnv = !!user && !!activeFolder;
  const envVars = useFolderEnv ? activeFolder!.env : env.vars;
  const setEnvVars = useFolderEnv
    ? (v: typeof env.vars) => void setFolderEnv(activeFolder!.id, v).then((e) => e && toast(`Gagal simpan env: ${e}`, "error"))
    : env.set;

  // className: auto dari URL, tapi bisa di-override user (T4.2). null = ikut auto.
  const [classNameOverride, setClassNameOverride] = useState<string | null>(null);
  const autoClassName = classNameFromUrl(url);
  const className = classNameOverride ?? autoClassName;

  const send = async (opts?: { method: HttpMethod; url: string; record: boolean }) => {
    const m = opts?.method ?? method;
    const u = opts?.url ?? url;
    const record = opts?.record ?? true;

    // Kuota guest (nudge): guest habis jatah → minta login, jangan kirim.
    if (!user && guestRemaining() <= 0) {
      setGateOpen(true);
      return;
    }

    // Auth helper (T5.3): sisipkan header auth bila belum ada nama sama.
    const ah = authHeader(auth);
    const mergedHeaders =
      ah && !headers.some((h) => h.key.toLowerCase() === ah.key.toLowerCase())
        ? [...headers, ah]
        : headers;

    // Env vars (T5.2): interpolasi {{...}}; var hilang → jangan kirim mentah.
    const applied = applyEnv({ url: u, headers: mergedHeaders, params, body }, envMap(envVars));
    if (applied.missing.length > 0) {
      setLoading(false);
      setReqError(`Variabel env belum diisi: ${applied.missing.map((k) => `{{${k}}}`).join(", ")}`);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setReqError(null);
    setResponse(null);
    setLocalBanner(false);
    const result = await sendRequest({
      method: m,
      url: applied.url,
      headers: applied.headers,
      params: applied.params,
      body: applied.body,
      signal: ctrl.signal,
    });
    if (abortRef.current === ctrl) abortRef.current = null;
    setLoading(false);

    if (!result.ok || !result.response) {
      if (result.aborted) return; // dibatalkan user, bukan error
      if (result.localBlocked) setLocalBanner(true);
      setReqError(result.error ?? "gagal");
      return;
    }
    setResponse(result.response);
    // Guest: hitung request sukses. Sisa menipis → beri tahu lewat toast.
    if (!user) {
      const left = bumpGuest();
      if (left > 0 && left <= 3) toast(`Sisa ${left} request sebelum perlu login.`, "info");
    }
    if (record) {
      const err = await history.add(m, applied.url, result.response.status, result.response.body);
      if (err) toast(`Gagal simpan history: ${err}`, "error");
    }
  };

  const cancel = () => abortRef.current?.abort();

  // Auto-params: URL ber-query string → pindahkan ke tab Params, URL jadi bersih.
  const commitUrl = (u: string) => {
    const { base, pairs } = splitUrlQuery(u);
    if (pairs.length === 0) return;
    setUrl(base);
    setParams((prev) => mergeParams(prev, pairs));
  };

  const importCurl = (r: ParsedCurl) => {
    const { base, pairs } = splitUrlQuery(r.url);
    setMethod(r.method);
    setUrl(base);
    setParams((prev) => mergeParams(prev, pairs));
    setHeaders(r.headers);
    setBody(r.body);
    toast("cURL diimport.", "success");
  };

  // Import Postman → semua endpoint masuk ke folder terpilih (khusus authed).
  const importPostman = async (folderId: string, parsed: ParsedPostman) => {
    const err = await importRequests(folderId, parsed.items);
    toast(
      err ? `Gagal import: ${err}` : `${parsed.items.length} endpoint diimport dari "${parsed.name}".`,
      err ? "error" : "success"
    );
  };

  const pickRequest = (r: SavedRequest) => {
    const { base, pairs } = splitUrlQuery(r.endpoint_url);
    setMethod(r.http_method);
    setUrl(base);
    setParams(mergeParams(r.params ?? [], pairs));
    setHeaders(r.headers ?? []);
    setBody(r.request_body ?? "");
    setActiveFolderId(r.folder_id); // env ikut folder endpoint (T9.3)
  };

  // Muat draf kerja dari browser bila bukan dari share link atau replay history
  useEffect(() => {
    const hasShare = window.location.hash.includes("share=");
    const hasReplay = !!(location.state as any)?.url;
    if (hasShare || hasReplay) return;
    const draft = loadDraft();
    if (draft) {
      setMethod(draft.method);
      setUrl(draft.url);
      setHeaders(draft.headers);
      setParams(draft.params);
      setBody(draft.body);
      setAuth(draft.auth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draf perubahan ke browser
  useEffect(() => {
    saveDraft({ method, url, headers, params, body, auth });
  }, [method, url, headers, params, body, auth]);

  // Share link (T8.4): buka #share=<b64> → isi RequestBar identik. Tanpa DB.
  useEffect(() => {
    const m = window.location.hash.match(/share=([^&]+)/);
    if (!m) return;
    const s = decodeShare(m[1]);
    if (s) {
      setMethod(s.method);
      setUrl(s.url);
      setHeaders(s.headers);
      setParams(s.params);
      setBody(s.body);
      toast("Request dari share link dimuat.", "success");
    } else {
      toast("Share link tidak valid.", "error");
    }
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replay dari halaman History: state {method,url} → isi & kirim ulang tanpa
  // menambah entri baru.
  useEffect(() => {
    const st = location.state as { method?: HttpMethod; url?: string } | null;
    if (st?.url && st?.method) {
      setMethod(st.method);
      setUrl(st.url);
      void send({ method: st.method, url: st.url, record: false });
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyCurl = async () => {
    const ah = authHeader(auth);
    const mergedHeaders =
      ah && !headers.some((h) => h.key.toLowerCase() === ah.key.toLowerCase())
        ? [...headers, ah]
        : headers;
    const curl = generateCurl({ method, url, headers: mergedHeaders, params, body });
    try {
      await navigator.clipboard.writeText(curl);
      toast("Perintah cURL tersalin ke clipboard.", "success");
    } catch {
      toast("Gagal menyalin cURL.", "error");
    }
  };

  const shareLink = async () => {
    const token = encodeShare({ method, url, headers, params, body });
    const link = `${window.location.origin}/#share=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast("Share link tersalin ke clipboard.", "success");
    } catch {
      toast("Gagal menyalin link.", "error");
    }
  };

  const openSave = () => {
    if (folders.length === 0) {
      toast("Buat folder dulu di sidebar.", "error");
      return;
    }
    setSaveOpen(true);
  };

  const doSave = async (folderId: string, name: string) => {
    setSaveOpen(false);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.href = "/login?expired=1";
      return;
    }
    const err = await saveRequest({ folderId, name, method, url, headers, params, body });
    toast(err ? `Gagal simpan: ${err}` : "Request tersimpan.", err ? "error" : "success");
  };

  const doCreateFolder = async (name: string) => {
    const err = await createFolder(name);
    if (err) toast(`Gagal buat folder: ${err}`, "error");
  };

  const doRenameFolder = async (id: string, name: string) => {
    const err = await renameFolder(id, name);
    if (err) toast(`Gagal rename: ${err}`, "error");
  };

  const doDeleteFolder = async (id: string) => {
    const err = await deleteFolder(id);
    toast(err ? `Gagal hapus: ${err}` : "Folder dihapus.", err ? "error" : "success");
  };

  const doUpdateRequest = async (id: string, name: string, u: string, folderId: string) => {
    const err = await updateRequest(id, name, u, folderId);
    toast(err ? `Gagal edit: ${err}` : "Endpoint diperbarui.", err ? "error" : "success");
  };

  const doDeleteRequest = async (id: string) => {
    const err = await deleteRequest(id);
    toast(err ? `Gagal hapus: ${err}` : "Endpoint dihapus.", err ? "error" : "success");
  };

  const doExportFolder = async (ids: string[], target: TargetLang) => {
    const items: ExportItem[] = requests
      .filter((r) => ids.includes(r.id))
      .map((r) => ({
        name: r.request_name,
        method: r.http_method,
        url: r.endpoint_url,
        headers: r.headers ?? [],
        params: r.params ?? [],
        body: r.request_body ?? "",
      }));
    if (items.length === 0) return;
    setExporting(true);
    try {
      const { target: _t, ...rest } = options;
      const { blob, errors } = await exportFolder(items, target, rest);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(exportFolderTarget?.folder_name ?? "export").replace(/[^\w.-]+/g, "_")}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      if (errors.length > 0) {
        toast(`Zip siap; ${errors.length} endpoint gagal: ${errors.map((e) => e.name).join(", ")}`, "error");
      } else {
        toast("Folder ter-export.", "success");
      }
      setExportFolderTarget(null);
    } catch (e: any) {
      toast(`Gagal export: ${e?.message ?? "error"}`, "error");
    } finally {
      setExporting(false);
    }
  };

  // Auto-convert saat response JSON valid & dalam batas ukuran.
  useEffect(() => {
    if (!response) return;
    if (response.sizeBytes > MAX_CONVERT_BYTES) return;
    try {
      JSON.parse(response.body);
    } catch {
      return;
    }
    convert(response.body, className, options);
  }, [response, options, className, convert]);

  return (
    <div className="instrument-grid flex h-[100dvh] flex-col bg-bg text-text">
      <AppHeader
        dark={dark}
        user={user}
        onToggleTheme={toggleTheme}
        onLogout={() => setConfirmLogout(true)}
        onMenu={() => setSidebarOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          authed={!!user}
          folders={folders}
          requests={requests}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCreateFolder={doCreateFolder}
          onRenameFolder={doRenameFolder}
          onDeleteFolder={doDeleteFolder}
          onExportFolder={setExportFolderTarget}
          onPickRequest={pickRequest}
          onUpdateRequest={doUpdateRequest}
          onDeleteRequest={doDeleteRequest}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <RequestBar
            method={method}
            url={url}
            loading={loading}
            onMethod={setMethod}
            onUrl={setUrl}
            onCommit={commitUrl}
            onSend={() => send()}
            onCancel={cancel}
          />
          <RequestPanel
            method={method}
            headers={headers}
            params={params}
            body={body}
            auth={auth}
            env={envVars}
            folders={user ? folders : []}
            activeFolderId={activeFolderId}
            onActiveFolder={setActiveFolderId}
            onHeaders={setHeaders}
            onParams={setParams}
            onBody={setBody}
            onAuth={setAuth}
            onEnv={setEnvVars}
          />

          <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-1.5">
            <ToolButton onClick={copyCurl} icon={<IconCopy size={14} />}>
              Salin cURL
            </ToolButton>
            <ToolButton onClick={() => setCurlOpen(true)} icon={<IconImport size={14} />}>
              Import cURL
            </ToolButton>
            <ToolButton onClick={shareLink} icon={<IconShare size={14} />}>
              Share link
            </ToolButton>
            {user && (
              <ToolButton onClick={openSave} icon={<IconSave size={14} />}>
                Simpan ke folder
              </ToolButton>
            )}
            {user && (
              <ToolButton
                onClick={() =>
                  folders.length === 0
                    ? toast("Buat folder dulu di sidebar.", "error")
                    : setPostmanOpen(true)
                }
                icon={<IconImport size={14} />}
              >
                Import Postman
              </ToolButton>
            )}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
            <div className="flex min-h-[60vh] min-w-0 flex-col border-b border-border md:min-h-0 md:border-b-0 md:border-r">
              {localBanner && (
                <p
                  className="border-b border-border px-4 py-1.5 text-[13px] text-info"
                  style={{ background: "color-mix(in srgb, var(--info) 10%, transparent)" }}
                >
                  Target localhost belum didukung (perlu browser extension, v1.1).
                </p>
              )}
              {!response && !reqError && !loading && (
                <div className="border-b border-border px-4 py-3">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
                    Kalibrasi cepat
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s.url}
                        onClick={() => {
                          setMethod(s.method);
                          setUrl(s.url);
                          void send({ method: s.method, url: s.url, record: true });
                        }}
                        className="group inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-text-dim transition hover:border-signal-dim hover:text-text"
                      >
                        <span
                          className="tnum font-mono text-[11px] font-bold"
                          style={{ color: methodLamp(s.method) }}
                        >
                          {s.method}
                        </span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="min-h-[40vh] flex-1 md:min-h-0">
                <ResponseView response={response} error={localBanner ? null : reqError} dark={dark} />
              </div>
            </div>
            <div className="flex min-h-[60vh] min-w-0 flex-col md:min-h-0">
              <DartOutput
                code={code}
                className={className}
                options={options}
                converting={converting}
                error={convError}
                dark={dark}
                sampleCount={sampleCount}
                onOptions={setOptions}
                onClassName={(name) => setClassNameOverride(name)}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <SaveRequestModal
        open={saveOpen}
        folders={folders}
        sensitive={hasSensitive(headers)}
        onClose={() => setSaveOpen(false)}
        onSave={doSave}
      />

      <ImportCurlModal open={curlOpen} onClose={() => setCurlOpen(false)} onImport={importCurl} />

      <ImportPostmanModal
        open={postmanOpen}
        folders={folders}
        onClose={() => setPostmanOpen(false)}
        onImport={importPostman}
      />

      <ConfirmModal
        open={confirmLogout}
        title="Keluar dari akun?"
        message="Sesi kamu akan diakhiri. Request & folder tersimpan tetap aman."
        confirmLabel="Keluar"
        danger={false}
        onConfirm={() => supabase.auth.signOut()}
        onClose={() => setConfirmLogout(false)}
      />

      <ConfirmModal
        open={gateOpen}
        title="Batas guest tercapai"
        message={
          <>
            Kamu sudah memakai {GUEST_LIMIT} request gratis hari ini di browser ini. Jatah
            reset otomatis dalam 24 jam — atau login sekarang untuk request tanpa batas,
            plus simpan endpoint, folder, dan history yang sinkron antar-perangkat.
          </>
        }
        confirmLabel="Login"
        danger={false}
        onConfirm={() => {
          window.location.href = "/login";
        }}
        onClose={() => setGateOpen(false)}
      />

      <ExportFolderModal
        open={!!exportFolderTarget}
        folderName={exportFolderTarget?.folder_name ?? ""}
        requests={requests.filter((r) => r.folder_id === exportFolderTarget?.id)}
        busy={exporting}
        onClose={() => setExportFolderTarget(null)}
        onExport={doExportFolder}
      />
    </div>
  );
}

function ToolButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-signal"
    >
      {icon}
      {children}
    </button>
  );
}
