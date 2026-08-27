import type { HttpMethod } from "../types.ts";

/**
 * Method lamp: each HTTP verb owns a hue (DESIGN.md). Returns the CSS var so it
 * works as inline `color`/`background` — Tailwind can't do dynamic per-method
 * classes without a safelist, and one source of truth beats five.
 */
const LAMP: Record<string, string> = {
  GET: "var(--m-get)",
  POST: "var(--m-post)",
  PUT: "var(--m-put)",
  PATCH: "var(--m-patch)",
  DELETE: "var(--m-delete)",
};

export function methodLamp(method: string): string {
  return LAMP[method] ?? "var(--text-dim)";
}

/** Status → readout lamp color (2xx ok, 3xx info, 4xx warn, 5xx err). */
export function statusLamp(status: number): string {
  if (status >= 200 && status < 300) return "var(--ok)";
  if (status >= 300 && status < 400) return "var(--info)";
  if (status >= 400 && status < 500) return "var(--warn)";
  return "var(--err)";
}

export type { HttpMethod };
