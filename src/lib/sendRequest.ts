import type { ApiResponse, HeaderPair, HttpMethod } from "../types.ts";

/** Deteksi target localhost/IP privat — proxy serverless tak bisa menjangkaunya. */
export function isLocalTarget(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local")) return true;
    if (h === "127.0.0.1" || h.startsWith("127.")) return true;
    if (h === "::1" || h === "0.0.0.0") return true;
    if (h.startsWith("192.168.") || h.startsWith("10.")) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
    return false;
  } catch {
    return false;
  }
}

function enabledPairs(pairs: HeaderPair[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of pairs) {
    if (p.enabled && p.key.trim()) out[p.key.trim()] = p.value;
  }
  return out;
}

function buildUrl(url: string, params: HeaderPair[]): string {
  const active = params.filter((p) => p.enabled && p.key.trim());
  if (active.length === 0) return url;
  try {
    const u = new URL(url);
    for (const p of active) u.searchParams.set(p.key.trim(), p.value);
    return u.toString();
  } catch {
    return url; // biar proxy/validasi yang tolak URL invalid
  }
}

export interface SendResult {
  ok: boolean;
  response?: ApiResponse;
  error?: string;
  localBlocked?: boolean;
  aborted?: boolean;
}

/**
 * Kirim request lewat proxy serverless (default). Target localhost tak didukung
 * di MVP (butuh ekstensi, v1.1) → kembalikan localBlocked agar UI tampilkan banner.
 */
export async function sendRequest(cfg: {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
  signal?: AbortSignal;
}): Promise<SendResult> {
  const url = buildUrl(cfg.url, cfg.params);

  if (isLocalTarget(url)) {
    return { ok: false, localBlocked: true, error: "Target localhost belum didukung (perlu ekstensi, v1.1)." };
  }

  const headers = enabledPairs(cfg.headers);
  const hasBody = ["POST", "PUT", "PATCH"].includes(cfg.method) && cfg.body.trim();
  if (hasBody && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        method: cfg.method,
        headers,
        body: hasBody ? cfg.body : undefined,
      }),
      signal: cfg.signal,
    });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        return {
          ok: false,
          error: `Server proxy gagal (${res.status}): ${text.slice(0, 200) || res.statusText}`,
        };
      }
      return { ok: false, error: "Format respons proxy bukan JSON valid." };
    }
    if (!res.ok) return { ok: false, error: data?.error || `proxy error ${res.status}` };
    return { ok: true, response: data as ApiResponse };
  } catch (e: any) {
    if (e?.name === "AbortError") return { ok: false, error: "Request dibatalkan.", aborted: true };
    return { ok: false, error: `Gagal mengirim request: ${e?.message ?? "network error"}` };
  }
}
