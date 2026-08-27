import Editor from "@monaco-editor/react";
import { useState } from "react";
import type { ConvertOptions, TargetLang } from "../types.ts";
import { defineMonacoThemes } from "../lib/monacoTheme.ts";
import { useToast } from "./Toast.tsx";
import { panelLabel } from "./ui.ts";
import { IconCopy, IconCheck, IconDownload } from "./icons.tsx";

const LANGS: { v: TargetLang; label: string; ext: string; monaco: string }[] = [
  { v: "dart", label: "Dart", ext: "dart", monaco: "dart" },
  { v: "kotlin", label: "Kotlin", ext: "kt", monaco: "kotlin" },
  { v: "swift", label: "Swift", ext: "swift", monaco: "swift" },
  { v: "typescript", label: "TypeScript", ext: "ts", monaco: "typescript" },
  { v: "go", label: "Go", ext: "go", monaco: "go" },
  { v: "python", label: "Python", ext: "py", monaco: "python" },
  { v: "java", label: "Java", ext: "java", monaco: "java" },
  { v: "csharp", label: "C#", ext: "cs", monaco: "csharp" },
  { v: "rust", label: "Rust", ext: "rs", monaco: "rust" },
];

/** Small toggle chip — used for Dart generator flags. */
function Toggle({
  label,
  checked,
  disabled,
  title,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  title?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      title={title}
      className={`flex cursor-pointer select-none items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[12px] transition ${
        disabled
          ? "cursor-not-allowed border-border/60 text-text-faint opacity-50"
          : checked
            ? "border-signal-dim bg-signal/10 text-signal"
            : "border-border text-text-dim hover:border-border-strong hover:text-text"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${checked && !disabled ? "bg-signal" : "bg-border-strong"}`}
      />
      {label}
    </label>
  );
}

export default function CodeOutput({
  code,
  className,
  options,
  converting,
  error,
  dark,
  sampleCount,
  onOptions,
  onClassName,
}: {
  code: string;
  className: string;
  options: ConvertOptions;
  converting: boolean;
  error: string | null;
  dark: boolean;
  sampleCount: number;
  onOptions: (o: ConvertOptions) => void;
  onClassName: (name: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const lang = LANGS.find((l) => l.v === options.target) ?? LANGS[0];
  const isDart = options.target === "dart";
  const eqDisabled = options.freezed || options.jsonAnnotation;
  const set = (patch: Partial<ConvertOptions>) => onOptions({ ...options, ...patch });

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast("Kode tersalin.");
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${snake(className)}_model.${lang.ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-surface px-3 py-2.5 sm:px-4">
        <span className={panelLabel}>Model</span>

        <select
          value={options.target}
          onChange={(e) => onOptions({ ...options, target: e.target.value as TargetLang })}
          className="cursor-pointer rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-[13px] font-semibold text-signal focus:border-signal-dim focus:outline-none"
          aria-label="Bahasa target"
        >
          {LANGS.map((l) => (
            <option key={l.v} value={l.v} className="bg-elevated text-text">
              {l.label}
            </option>
          ))}
        </select>

        <input
          value={className}
          onChange={(e) => onClassName(e.target.value)}
          spellCheck={false}
          aria-label="Nama class model"
          className="w-28 min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-[13px] text-text focus:border-signal-dim focus:outline-none focus:ring-1 focus:ring-signal-dim sm:w-36 sm:flex-none"
        />

        {isDart && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Toggle
              label="Null Safety"
              checked={options.nullSafety}
              onChange={(v) => onOptions({ ...options, nullSafety: v })}
            />
            <Toggle
              label="Freezed"
              checked={options.freezed}
              onChange={(v) => onOptions({ ...options, freezed: v })}
            />
            <Toggle
              label="json_serializable"
              checked={options.jsonAnnotation}
              onChange={(v) => onOptions({ ...options, jsonAnnotation: v })}
            />
            <Toggle
              label="copyWith"
              checked={options.copyWith}
              onChange={(v) => onOptions({ ...options, copyWith: v })}
            />
            <Toggle
              label="Equatable"
              checked={options.equatable && !eqDisabled}
              disabled={eqDisabled}
              title={
                eqDisabled
                  ? "Equatable hanya untuk output plain (matikan Freezed & json_serializable)"
                  : undefined
              }
              onChange={(v) => onOptions({ ...options, equatable: v })}
            />
          </div>
        )}

        {options.target === "python" && (
          <Toggle
            label="Pydantic"
            title="Pakai pydantic BaseModel (validasi runtime), bukan dataclass biasa"
            checked={options.pythonPydantic}
            onChange={(v) => set({ pythonPydantic: v })}
          />
        )}
        {options.target === "java" && (
          <Toggle
            label="Lombok"
            title="Pakai anotasi Lombok (@Data) — kurangi boilerplate getter/setter"
            checked={options.javaLombok}
            onChange={(v) => set({ javaLombok: v })}
          />
        )}
        {options.target === "csharp" && (
          <Toggle
            label="System.Text.Json"
            title="Pakai System.Text.Json (default .NET), bukan Newtonsoft.Json"
            checked={options.csharpSystemText}
            onChange={(v) => set({ csharpSystemText: v })}
          />
        )}
        {options.target === "rust" && (
          <Toggle
            label="derive Debug/Clone"
            title="Tambah #[derive(Debug, Clone)] ke tiap struct"
            checked={options.rustDerive}
            onChange={(v) => set({ rustDerive: v })}
          />
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={copy}
            disabled={!code}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-signal disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-dim"
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? "Tersalin" : "Copy"}
          </button>
          <button
            onClick={download}
            disabled={!code}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-signal disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-dim"
          >
            <IconDownload size={14} />
            Download
          </button>
        </div>
      </div>

      {isDart && eqDisabled && code && (
        <p
          className="border-b border-border px-4 py-1.5 text-[13px] text-signal"
          style={{ background: "color-mix(in srgb, var(--signal) 8%, transparent)" }}
        >
          Jalankan <code className="font-mono">dart run build_runner build</code> untuk generate{" "}
          <code className="font-mono">.freezed.dart</code> / <code className="font-mono">.g.dart</code>.
        </p>
      )}
      {sampleCount > 1 && code && (
        <p
          className="border-b border-border px-4 py-1.5 text-[13px] text-ok"
          style={{ background: "color-mix(in srgb, var(--ok) 8%, transparent)" }}
        >
          Model digabung dari {sampleCount} sampel — field yang tak selalu ada jadi opsional.
        </p>
      )}

      <div className="min-h-0 flex-1">
        {error ? (
          <div className="flex h-full flex-col items-start gap-2 p-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-err">Konversi gagal</span>
            <p className="font-mono text-[14px] text-err">{error}</p>
          </div>
        ) : converting ? (
          <div className="flex h-full items-center justify-center">
            <span className="signal-live font-mono text-[13px] uppercase tracking-[0.14em] text-signal">
              Mengonversi…
            </span>
          </div>
        ) : code ? (
          <Editor
            height="100%"
            language={lang.monaco}
            path={`model.${lang.ext}`}
            value={code}
            beforeMount={defineMonacoThemes}
            theme={dark ? "yoapi-dark" : "yoapi-light"}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 14 },
              scrollBeyondLastLine: false,
              renderLineHighlight: "none",
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="font-mono text-2xl font-bold tracking-[0.15em] text-border-strong">{"{ }"}</div>
            <p className="max-w-[30ch] text-[14px] text-text-faint">
              Model {lang.label} ter-generate otomatis setelah response JSON.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function snake(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase() || "model";
}
