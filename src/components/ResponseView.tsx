import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import type { ApiResponse, HttpMethod } from "../types.ts";
import { statusLamp, methodLamp } from "../lib/lamp.ts";
import { defineMonacoThemes } from "../lib/monacoTheme.ts";
import { panelLabel } from "./ui.ts";
import { IconX } from "./icons.tsx";
import { prettyJson } from "../lib/pretty.ts";

/** Bahasa Monaco dari content-type response (pretty non-JSON: XML/HTML disorot). */
function langFromHeaders(headers: Record<string, string>, jsonOk: boolean): string {
  if (jsonOk) return "json";
  const ct = (
    Object.entries(headers).find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? ""
  ).toLowerCase();
  if (ct.includes("html")) return "html";
  if (ct.includes("xml")) return "xml";
  if (ct.includes("javascript")) return "javascript";
  if (ct.includes("css")) return "css";
  return "text";
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export default function ResponseView({
  response,
  error,
  dark,
  starters,
  onSelectStarter,
}: {
  response: ApiResponse | null;
  error: string | null;
  dark: boolean;
  starters?: { label: string; method: HttpMethod; url: string }[];
  onSelectStarter?: (s: { label: string; method: HttpMethod; url: string }) => void;
}) {
  const [tab, setTab] = useState<"body" | "headers">("body");
  const [search, setSearch] = useState("");
  const [matchInfo, setMatchInfo] = useState<{ total: number } | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const headerCount = response ? Object.keys(response.headers).length : 0;
  const nonJson = response ? !isJson(response.body) : false;
  const lamp = response ? statusLamp(response.status) : "var(--text-faint)";
  const bodyLang = response ? langFromHeaders(response.headers, !nonJson) : "text";

  // Cari teks di body: pakai findMatches Monaco (tanpa dependency), sorot & lompat.
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    const model = ed.getModel();
    if (!model) return;
    if (!search.trim()) {
      ed.deltaDecorations(ed.__searchDecos ?? [], []);
      ed.__searchDecos = [];
      setMatchInfo(null);
      return;
    }
    const matches = model.findMatches(search, true, false, false, null, false);
    ed.__searchDecos = ed.deltaDecorations(
      ed.__searchDecos ?? [],
      matches.map((m: any) => ({
        range: m.range,
        options: { inlineClassName: "yoapi-find-match" },
      }))
    );
    setMatchInfo({ total: matches.length });
    if (matches.length > 0) ed.revealRangeInCenter(matches[0].range);
  }, [search, tab, response]);

  return (
    <div className="flex h-full flex-col">
      {/* Title bar — compact h-9 matched with Model panel */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className={panelLabel}>Response</span>
          {response ? (
            <div key={response.status + "-" + response.timeMs} className="ignite flex items-center gap-2 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: lamp }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: lamp, boxShadow: `0 0 6px ${lamp}` }} />
                {response.status} {response.statusText}
              </span>
              <span className="text-border-strong">•</span>
              <span className="text-text-dim">{response.timeMs} ms</span>
              <span className="text-border-strong">•</span>
              <span className="text-text-dim">{fmtSize(response.sizeBytes)}</span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-text-faint">— — —</span>
          )}
        </div>

        {response && (
          <div className="flex shrink-0 items-center gap-1.5">
            {tab === "body" && (
              <div className="relative flex items-center">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari…"
                  spellCheck={false}
                  className="h-6.5 w-24 rounded-md border border-border bg-surface-2 pl-2 pr-7 font-mono text-[11px] text-text placeholder:text-text-faint focus:border-signal-dim focus:outline-none sm:w-32"
                  aria-label="Cari di body response"
                />
                {search && (
                  <>
                    <span className="tnum pointer-events-none absolute right-4 font-mono text-[9px] text-text-faint">
                      {matchInfo?.total ?? 0}
                    </span>
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-1 rounded p-0.5 text-text-faint transition hover:text-text"
                      aria-label="Hapus pencarian"
                    >
                      <IconX size={10} />
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="flex h-6.5 items-center rounded-md border border-border bg-surface-2 p-0.5">
              {(["body", "headers"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`h-full rounded px-2 font-mono text-[10px] uppercase tracking-[0.06em] transition ${
                    tab === t ? "bg-elevated text-signal shadow-sm" : "text-text-faint hover:text-text-dim"
                  }`}
                >
                  {t === "headers" ? `Headers ${headerCount}` : "Body"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {response && tab === "body" && nonJson && (
        <p className="border-b border-border px-4 py-1.5 text-[13px] text-warn" style={{ background: "color-mix(in srgb, var(--warn) 10%, transparent)" }}>
          Response bukan JSON — ditampilkan mentah, konversi model dilewati.
        </p>
      )}

      <div className="min-h-0 flex-1">
        {error ? (
          <div className="flex h-full flex-col items-start gap-2 p-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-err">Signal lost</span>
            <p className="font-mono text-[14px] text-err">{error}</p>
          </div>
        ) : !response ? (
          <EmptyReadout starters={starters} onSelectStarter={onSelectStarter} />
        ) : tab === "headers" ? (
          <div className="h-full overflow-auto p-4">
            {headerCount === 0 ? (
              <p className="font-mono text-[13px] text-text-faint">Tak ada header.</p>
            ) : (
              <table className="w-full border-collapse font-mono text-[13px]">
                <tbody>
                  {Object.entries(response.headers).map(([k, v]) => (
                    <tr key={k} className="border-b border-border/60 align-top">
                      <td className="whitespace-nowrap py-1.5 pr-4 text-signal-dim">{k}</td>
                      <td className="break-all py-1.5 text-text-dim">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <Editor
            height="100%"
            language={bodyLang}
            path={`response.${extFor(bodyLang)}`}
            value={nonJson ? prettyText(response.body, bodyLang) : prettyJson(response.body)}
            beforeMount={defineMonacoThemes}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
            }}
            theme={dark ? "yoapi-dark" : "yoapi-light"}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 14 },
              scrollBeyondLastLine: false,
              renderLineHighlight: "none",
              wordWrap: nonJson ? "on" : "off",
            }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyReadout({
  starters,
  onSelectStarter,
}: {
  starters?: { label: string; method: HttpMethod; url: string }[];
  onSelectStarter?: (s: { label: string; method: HttpMethod; url: string }) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="tnum font-mono text-3xl font-bold tracking-[0.15em] text-border-strong">
          — — —
        </div>
        <p className="max-w-[28ch] text-[13px] text-text-faint">
          Kirim request untuk menyalakan readout & model.
        </p>
      </div>

      {starters && starters.length > 0 && onSelectStarter && (
        <div className="flex max-w-sm flex-col items-center gap-2.5 rounded-panel border border-border/80 bg-surface/80 p-3.5 shadow-panel">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
            Kalibrasi Cepat
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {starters.map((s) => (
              <button
                key={s.url}
                onClick={() => onSelectStarter(s)}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[12px] text-text-dim transition hover:border-signal-dim hover:text-text"
              >
                <span
                  className="tnum font-mono text-[10px] font-bold"
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
    </div>
  );
}

const EXT: Record<string, string> = { json: "json", html: "html", xml: "xml", javascript: "js", css: "css", text: "txt" };
function extFor(lang: string): string {
  return EXT[lang] ?? "txt";
}

/** Rapikan non-JSON: XML/HTML dapat indentasi ringan tanpa parser eksternal (RULES lazy). */
function prettyText(text: string, lang: string): string {
  if (lang !== "xml" && lang !== "html") return text;
  // ponytail: indentasi berbasis tag sederhana; naikkan ke parser XML bila struktur kompleks salah indent.
  const withBreaks = text.replace(/>\s*</g, ">\n<");
  let depth = 0;
  return withBreaks
    .split("\n")
    .map((line) => {
      const l = line.trim();
      if (!l) return "";
      if (/^<\//.test(l)) depth = Math.max(0, depth - 1);
      const out = "  ".repeat(depth) + l;
      if (/^<[^/!?][^>]*[^/]>$/.test(l) && !/^<.*<\/.*>$/.test(l)) depth += 1;
      return out;
    })
    .filter((l) => l !== "")
    .join("\n");
}
