import type { HttpMethod } from "../types.ts";
import { methodLamp } from "../lib/lamp.ts";
import { IconSend, IconStop } from "./icons.tsx";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function RequestBar({
  method,
  url,
  loading,
  onMethod,
  onUrl,
  onCommit,
  onSend,
  onCancel,
}: {
  method: HttpMethod;
  url: string;
  loading: boolean;
  onMethod: (m: HttpMethod) => void;
  onUrl: (u: string) => void;
  onCommit: (u: string) => void;
  onSend: () => void;
  onCancel: () => void;
}) {
  const lamp = methodLamp(method);
  return (
    <div className="flex flex-wrap items-stretch gap-2 border-b border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3">
      <div
        className="relative flex items-center rounded-lg border border-border bg-surface-2 pl-3"
        style={{ boxShadow: `inset 3px 0 0 0 ${lamp}` }}
      >
        <select
          value={method}
          onChange={(e) => onMethod(e.target.value as HttpMethod)}
          className="cursor-pointer appearance-none bg-transparent py-2 pl-1 pr-7 font-mono text-[14px] font-bold tracking-wide focus:outline-none"
          style={{ color: lamp }}
          aria-label="HTTP method"
        >
          {METHODS.map((m) => (
            <option key={m} value={m} className="bg-elevated text-text">
              {m}
            </option>
          ))}
        </select>
      </div>

      <input
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onCommit(url);
            onSend();
          }
        }}
        placeholder="https://api.example.com/users/1"
        spellCheck={false}
        inputMode="url"
        className="min-w-0 flex-1 basis-full rounded-lg border border-border bg-surface-2 px-3.5 py-2 font-mono text-[14px] text-text placeholder:text-text-faint transition focus:border-signal-dim focus:outline-none focus:ring-1 focus:ring-signal-dim sm:basis-0"
        aria-label="Request URL"
      />

      <button
        onClick={loading ? onCancel : onSend}
        disabled={!loading && !url.trim()}
        className={`inline-flex min-w-[104px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-mono text-[14px] font-semibold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:py-0 ${
          loading
            ? "bg-err text-on-err hover:brightness-110"
            : "bg-signal text-on-signal shadow-glow hover:brightness-110 disabled:shadow-none"
        }`}
      >
        {loading ? (
          <>
            <IconStop size={15} />
            Batal
          </>
        ) : (
          <>
            <IconSend size={15} />
            Send
          </>
        )}
      </button>
    </div>
  );
}
