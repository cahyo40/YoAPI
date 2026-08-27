import { useState } from "react";
import type { HeaderPair, HttpMethod } from "../types.ts";
import type { AuthConfig, AuthType } from "../lib/auth.ts";
import type { EnvVar } from "../lib/env.ts";
import type { Folder } from "../hooks/useWorkspace.ts";
import { fieldMono } from "./ui.ts";
import { IconPlus, IconX } from "./icons.tsx";

type Tab = "params" | "headers" | "auth" | "body" | "env";

function PairEditor({
  pairs,
  onChange,
  keyPlaceholder,
}: {
  pairs: HeaderPair[];
  onChange: (p: HeaderPair[]) => void;
  keyPlaceholder: string;
}) {
  const update = (i: number, patch: Partial<HeaderPair>) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const add = () => onChange([...pairs, { key: "", value: "", enabled: true }]);
  const remove = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {pairs.length === 0 && (
        <p className="text-[13px] text-text-faint">
          Belum ada {keyPlaceholder}. Tambahkan baris di bawah.
        </p>
      )}
      {pairs.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => update(i, { enabled: e.target.checked })}
            aria-label="aktifkan"
            className="accent-signal"
          />
          <input
            value={p.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder={keyPlaceholder}
            className={fieldMono + " flex-1 py-1.5"}
          />
          <input
            value={p.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value"
            className={fieldMono + " flex-1 py-1.5"}
          />
          <button
            onClick={() => remove(i)}
            className="rounded-md p-1.5 text-text-faint transition hover:bg-surface-2 hover:text-err"
            aria-label="hapus baris"
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-signal transition hover:bg-signal/10"
      >
        <IconPlus size={14} />
        Tambah
      </button>
    </div>
  );
}

const AUTH_TYPES: { v: AuthType; label: string }[] = [
  { v: "none", label: "None" },
  { v: "bearer", label: "Bearer" },
  { v: "basic", label: "Basic" },
  { v: "apikey", label: "API Key" },
];

function AuthEditor({ auth, onChange }: { auth: AuthConfig; onChange: (a: AuthConfig) => void }) {
  return (
    <div className="space-y-2.5">
      <select
        value={auth.type}
        onChange={(e) => onChange({ ...auth, type: e.target.value as AuthType })}
        className="cursor-pointer rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[14px] text-text focus:border-signal-dim focus:outline-none"
        aria-label="Tipe auth"
      >
        {AUTH_TYPES.map((t) => (
          <option key={t.v} value={t.v} className="bg-elevated">
            {t.label}
          </option>
        ))}
      </select>
      {auth.type === "bearer" && (
        <input
          value={auth.token}
          onChange={(e) => onChange({ ...auth, token: e.target.value })}
          placeholder="token"
          className={fieldMono}
        />
      )}
      {auth.type === "basic" && (
        <div className="flex gap-2">
          <input
            value={auth.username}
            onChange={(e) => onChange({ ...auth, username: e.target.value })}
            placeholder="username"
            className={fieldMono}
          />
          <input
            value={auth.password}
            onChange={(e) => onChange({ ...auth, password: e.target.value })}
            placeholder="password"
            type="password"
            className={fieldMono}
          />
        </div>
      )}
      {auth.type === "apikey" && (
        <div className="flex gap-2">
          <input
            value={auth.apiKeyName}
            onChange={(e) => onChange({ ...auth, apiKeyName: e.target.value })}
            placeholder="nama header"
            className={fieldMono}
          />
          <input
            value={auth.token}
            onChange={(e) => onChange({ ...auth, token: e.target.value })}
            placeholder="value"
            className={fieldMono}
          />
        </div>
      )}
      {auth.type !== "none" && (
        <p className="text-[13px] text-text-faint">
          Header auth otomatis ditambahkan saat kirim; di-mask sebelum disimpan.
        </p>
      )}
    </div>
  );
}

function EnvEditor({
  vars,
  onChange,
  folders,
  activeFolderId,
  onActiveFolder,
}: {
  vars: EnvVar[];
  onChange: (v: EnvVar[]) => void;
  folders: Folder[];
  activeFolderId: string | null;
  onActiveFolder: (id: string | null) => void;
}) {
  const update = (i: number, patch: Partial<EnvVar>) =>
    onChange(vars.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const add = () => onChange([...vars, { key: "", value: "" }]);
  const remove = (i: number) => onChange(vars.filter((_, idx) => idx !== i));
  const scoped = !!activeFolderId && folders.some((f) => f.id === activeFolderId);
  return (
    <div className="space-y-2">
      {folders.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-text-faint">Scope</span>
          <select
            value={activeFolderId ?? ""}
            onChange={(e) => onActiveFolder(e.target.value || null)}
            className={fieldMono + " flex-1 py-1.5"}
            aria-label="Scope environment"
          >
            <option value="">Global (browser ini)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                Folder: {f.folder_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <p className="text-[13px] text-text-faint">
        Pakai <code className="font-mono text-signal-dim">{"{{key}}"}</code> di URL, header, atau body.{" "}
        {scoped ? "Tersimpan di folder ini (Supabase)." : "Disimpan di browser ini."}
      </p>
      {vars.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={v.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="base_url"
            className={fieldMono + " flex-1 py-1.5"}
          />
          <input
            value={v.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="https://api.example.com"
            className={fieldMono + " flex-1 py-1.5"}
          />
          <button
            onClick={() => remove(i)}
            className="rounded-md p-1.5 text-text-faint transition hover:bg-surface-2 hover:text-err"
            aria-label="hapus var"
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-signal transition hover:bg-signal/10"
      >
        <IconPlus size={14} />
        Tambah
      </button>
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = {
  params: "Params",
  headers: "Headers",
  auth: "Auth",
  body: "Body",
  env: "Env",
};

export default function RequestPanel({
  method,
  headers,
  params,
  body,
  auth,
  env,
  folders,
  activeFolderId,
  onActiveFolder,
  onHeaders,
  onParams,
  onBody,
  onAuth,
  onEnv,
}: {
  method: HttpMethod;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
  auth: AuthConfig;
  env: EnvVar[];
  folders: Folder[];
  activeFolderId: string | null;
  onActiveFolder: (id: string | null) => void;
  onHeaders: (p: HeaderPair[]) => void;
  onParams: (p: HeaderPair[]) => void;
  onBody: (b: string) => void;
  onAuth: (a: AuthConfig) => void;
  onEnv: (e: EnvVar[]) => void;
}) {
  const [tab, setTab] = useState<Tab>("params");
  const hasBody = ["POST", "PUT", "PATCH"].includes(method);
  const tabs: Tab[] = ["params", "headers", "auth", "body", "env"];

  const count: Partial<Record<Tab, number>> = {
    params: params.filter((p) => p.key).length,
    headers: headers.filter((h) => h.key).length,
    env: env.filter((v) => v.key).length,
  };

  return (
    <div className="flex flex-col border-b border-border bg-surface">
      <div className="flex gap-0.5 border-b border-border px-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 font-mono text-[13px] uppercase tracking-[0.06em] transition ${
              tab === t ? "text-signal" : "text-text-faint hover:text-text-dim"
            }`}
          >
            {TAB_LABEL[t]}
            {count[t] ? (
              <span className="tnum rounded-full bg-surface-2 px-1.5 text-[11px] text-text-dim">
                {count[t]}
              </span>
            ) : null}
            {tab === t && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-signal" style={{ boxShadow: "0 0 8px var(--signal)" }} />
            )}
          </button>
        ))}
      </div>
      <div className="p-3.5">
        {tab === "params" && <PairEditor pairs={params} onChange={onParams} keyPlaceholder="param" />}
        {tab === "headers" && <PairEditor pairs={headers} onChange={onHeaders} keyPlaceholder="header" />}
        {tab === "auth" && <AuthEditor auth={auth} onChange={onAuth} />}
        {tab === "env" && (
          <EnvEditor
            vars={env}
            onChange={onEnv}
            folders={folders}
            activeFolderId={activeFolderId}
            onActiveFolder={onActiveFolder}
          />
        )}
        {tab === "body" &&
          (hasBody ? (
            <textarea
              value={body}
              onChange={(e) => onBody(e.target.value)}
              placeholder='{"key":"value"}'
              spellCheck={false}
              className={fieldMono + " h-32 resize-y leading-relaxed"}
            />
          ) : (
            <p className="text-[13px] text-text-faint">Body hanya untuk POST/PUT/PATCH.</p>
          ))}
      </div>
    </div>
  );
}
