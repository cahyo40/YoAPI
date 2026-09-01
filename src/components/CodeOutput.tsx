import Editor from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";
import type { ConvertOptions, TargetLang } from "../types.ts";
import { defineMonacoThemes } from "../lib/monacoTheme.ts";
import { useToast } from "./Toast.tsx";
import { panelLabel } from "./ui.ts";
import { IconCopy, IconCheck, IconDownload, IconSliders, IconX } from "./icons.tsx";

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

function snake(s: string) {
  return (
    s
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[-\s]+/g, "_")
      .toLowerCase() || "model"
  );
}

/** Interactive switch row inside options popover */
function OptionRow({
  label,
  description,
  checked,
  disabled,
  disabledReason,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-start justify-between gap-3 rounded-md p-2 transition ${
        disabled
          ? "cursor-not-allowed opacity-50 bg-transparent"
          : "hover:bg-surface-2/70 active:bg-surface-2"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[12px] font-semibold text-text group-hover:text-signal">
            {label}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-tight text-text-dim">{description}</p>
        {disabled && disabledReason && (
          <p className="mt-1 font-mono text-[10px] text-warn">{disabledReason}</p>
        )}
      </div>

      <div className="relative inline-flex shrink-0 items-center pt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`h-4 w-7 rounded-full transition-colors ${
            checked && !disabled ? "bg-signal" : "bg-border-strong"
          }`}
        >
          <div
            className={`h-3 w-3 rounded-full bg-surface transition-transform duration-150 ${
              checked && !disabled ? "translate-x-3.5" : "translate-x-0.5"
            } mt-0.5`}
          />
        </div>
      </div>
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
  const [optionsOpen, setOptionsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const lang = LANGS.find((l) => l.v === options.target) ?? LANGS[0];
  const isDart = options.target === "dart";
  const eqDisabled = options.freezed || options.jsonAnnotation;
  const set = (patch: Partial<ConvertOptions>) => onOptions({ ...options, ...patch });

  // Count active flags
  let activeCount = 0;
  let hasOptions = true;
  if (isDart) {
    if (options.nullSafety) activeCount++;
    if (options.freezed) activeCount++;
    if (options.jsonAnnotation) activeCount++;
    if (options.copyWith) activeCount++;
    if (options.equatable && !eqDisabled) activeCount++;
  } else if (options.target === "python") {
    if (options.pythonPydantic) activeCount++;
  } else if (options.target === "java") {
    if (options.javaLombok) activeCount++;
  } else if (options.target === "csharp") {
    if (options.csharpSystemText) activeCount++;
  } else if (options.target === "rust") {
    if (options.rustDerive) activeCount++;
  } else {
    hasOptions = false;
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOptionsOpen(false);
    }
    if (optionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [optionsOpen]);

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
      {/* Title bar — symmetrical h-9 matched with ResponseView, zero scroll */}
      <div className="relative flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:px-4">
        {/* Left Side: Label, Language, Class Name */}
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`${panelLabel} shrink-0`}>Model</span>

          <select
            value={options.target}
            onChange={(e) => onOptions({ ...options, target: e.target.value as TargetLang })}
            className="h-6.5 shrink-0 cursor-pointer rounded-md border border-border bg-surface-2 px-1.5 font-mono text-[11px] font-semibold text-signal transition focus:border-signal-dim focus:outline-none"
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
            placeholder="Nama class"
            spellCheck={false}
            aria-label="Nama class model"
            className="h-6.5 w-24 min-w-[90px] rounded-md border border-border bg-surface-2 px-2 font-mono text-[11px] text-text placeholder:text-text-faint transition focus:border-signal-dim focus:outline-none focus:ring-1 focus:ring-signal-dim sm:w-32"
          />
        </div>

        {/* Right Side: Options Popover Trigger, Copy, Download */}
        <div className="flex shrink-0 items-center gap-1">
          {hasOptions && (
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setOptionsOpen((prev) => !prev)}
                className={`inline-flex h-6.5 items-center gap-1 rounded-md border px-2 font-mono text-[11px] font-medium transition ${
                  optionsOpen
                    ? "border-signal-dim bg-signal/15 text-signal"
                    : activeCount > 0
                      ? "border-border-strong bg-surface-2 text-signal hover:border-signal-dim"
                      : "border-border bg-surface-2 text-text-dim hover:border-border-strong hover:text-text"
                }`}
                title="Konfigurasi generator kode"
                aria-expanded={optionsOpen}
                aria-label="Buka opsi generator"
              >
                <IconSliders size={12} className={activeCount > 0 ? "text-signal" : "text-text-dim"} />
                <span className="hidden sm:inline">Opsi</span>
                {activeCount > 0 && (
                  <span className="grid h-3.5 min-w-[14px] place-items-center rounded-full bg-signal px-1 font-mono text-[9px] font-bold text-on-signal">
                    {activeCount}
                  </span>
                )}
              </button>

              {/* Impeccable Options Popover Dropdown */}
              {optionsOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-1.5 w-72 origin-top-right rounded-lg border border-border bg-surface p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 sm:w-80"
                  style={{ boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border)" }}
                >
                  <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5 px-1">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text">
                      Opsi {lang.label}
                    </span>
                    <button
                      onClick={() => setOptionsOpen(false)}
                      className="rounded p-0.5 text-text-faint transition hover:bg-surface-2 hover:text-text"
                      aria-label="Tutup opsi"
                    >
                      <IconX size={12} />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {isDart && (
                      <>
                        <OptionRow
                          label="Null Safety"
                          description="Gunakan tipe null-safe (? dan required)"
                          checked={options.nullSafety}
                          onChange={(v) => set({ nullSafety: v })}
                        />
                        <OptionRow
                          label="Freezed"
                          description="Generate class immutable dengan union & pattern matching"
                          checked={options.freezed}
                          onChange={(v) => set({ freezed: v })}
                        />
                        <OptionRow
                          label="json_serializable"
                          description="Generate konverter @JsonSerializable()"
                          checked={options.jsonAnnotation}
                          onChange={(v) => set({ jsonAnnotation: v })}
                        />
                        <OptionRow
                          label="copyWith"
                          description="Method salin & ubah properti objek"
                          checked={options.copyWith}
                          onChange={(v) => set({ copyWith: v })}
                        />
                        <OptionRow
                          label="Equatable"
                          description="Value equality tanpa boilerplate props"
                          checked={options.equatable && !eqDisabled}
                          disabled={eqDisabled}
                          disabledReason="Matikan Freezed & json_serializable untuk Equatable"
                          onChange={(v) => set({ equatable: v })}
                        />
                      </>
                    )}

                    {options.target === "python" && (
                      <OptionRow
                        label="Pydantic BaseModel"
                        description="Validasi tipe runtime otomatis berbasis Pydantic"
                        checked={options.pythonPydantic}
                        onChange={(v) => set({ pythonPydantic: v })}
                      />
                    )}

                    {options.target === "java" && (
                      <OptionRow
                        label="Lombok @Data"
                        description="Gunakan anotasi Lombok untuk ringkas getter/setter"
                        checked={options.javaLombok}
                        onChange={(v) => set({ javaLombok: v })}
                      />
                    )}

                    {options.target === "csharp" && (
                      <OptionRow
                        label="System.Text.Json"
                        description="Gunakan library serialization default .NET modern"
                        checked={options.csharpSystemText}
                        onChange={(v) => set({ csharpSystemText: v })}
                      />
                    )}

                    {options.target === "rust" && (
                      <OptionRow
                        label="derive Debug/Clone"
                        description="Tambahkan #[derive(Debug, Clone, Serialize, Deserialize)]"
                        checked={options.rustDerive}
                        onChange={(v) => set({ rustDerive: v })}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={copy}
            disabled={!code}
            className="inline-flex h-6.5 items-center gap-1 rounded-md px-2 font-mono text-[11px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-signal disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-dim"
          >
            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
            <span className="hidden xs:inline">{copied ? "Tersalin" : "Copy"}</span>
          </button>
          <button
            onClick={download}
            disabled={!code}
            className="inline-flex h-6.5 items-center gap-1 rounded-md px-2 font-mono text-[11px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-signal disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-dim"
            title={`Unduh file ${lang.ext}`}
          >
            <IconDownload size={12} />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {isDart && eqDisabled && code && (
        <p
          className="border-b border-border px-3 py-1 font-mono text-[11px] text-signal"
          style={{ background: "color-mix(in srgb, var(--signal) 8%, transparent)" }}
        >
          Jalankan <code className="font-bold">dart run build_runner build</code> untuk generate{" "}
          <code>.freezed.dart</code> / <code>.g.dart</code>.
        </p>
      )}
      {sampleCount > 1 && code && (
        <p
          className="border-b border-border px-3 py-1 font-mono text-[11px] text-ok"
          style={{ background: "color-mix(in srgb, var(--ok) 8%, transparent)" }}
        >
          Model digabung dari {sampleCount} sampel — field yang tak selalu ada jadi opsional.
        </p>
      )}

      <div className="min-h-0 flex-1">
        {error ? (
          <div className="flex h-full flex-col items-start gap-1.5 p-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-err">Konversi gagal</span>
            <p className="font-mono text-[12px] text-err">{error}</p>
          </div>
        ) : converting ? (
          <div className="flex h-full items-center justify-center">
            <span className="signal-live font-mono text-[12px] uppercase tracking-[0.14em] text-signal">
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
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 10 },
              scrollBeyondLastLine: false,
              renderLineHighlight: "none",
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="font-mono text-xl font-bold tracking-[0.15em] text-border-strong">{"{ }"}</div>
            <p className="max-w-[30ch] font-mono text-[12px] text-text-faint">
              Model {lang.label} ter-generate otomatis setelah response JSON.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
