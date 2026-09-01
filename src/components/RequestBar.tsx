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
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-surface px-3 py-1.5 sm:px-4">
      <div
        className="relative flex h-8 items-center rounded-md border border-border bg-surface-2 pl-2.5"
        style={{ boxShadow: `inset 2.5px 0 0 0 ${lamp}` }}
      >
        <select
          value={method}
          onChange={(e) => onMethod(e.target.value as HttpMethod)}
          className="cursor-pointer appearance-none bg-transparent py-1 pl-0.5 pr-6 font-mono text-[12px] font-bold tracking-wide focus:outline-none"
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
        className="h-8 min-w-0 flex-1 basis-full rounded-md border border-border bg-surface-2 px-3 font-mono text-[12px] text-text placeholder:text-text-faint transition focus:border-signal-dim focus:outline-none focus:ring-1 focus:ring-signal-dim sm:basis-0"
        aria-label="Request URL"
      />

      <button
        onClick={loading ? onCancel : onSend}
        disabled={!loading && !url.trim()}
        className={`inline-flex h-8 min-w-[88px] flex-1 items-center justify-center gap-1.5 rounded-md px-3.5 font-mono text-[12px] font-semibold uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${
          loading
            ? "bg-err text-on-err hover:brightness-110"
            : "bg-signal text-on-signal shadow-glow hover:brightness-110 disabled:shadow-none"
        }`}
      >
        {loading ? (
          <>
            <IconStop size={13} />
            Batal
          </>
        ) : (
          <>
            <IconSend size={13} />
            Send
          </>
        )}
      </button>
    </div>
  );
}
