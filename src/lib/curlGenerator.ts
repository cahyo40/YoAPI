import type { HeaderPair, HttpMethod } from "../types.ts";

function escapeShell(str: string): string {
  return str.replace(/'/g, "'\\''");
}

function buildUrlWithParams(url: string, params: HeaderPair[]): string {
  const active = params.filter((p) => p.enabled && p.key.trim());
  if (active.length === 0) return url;
  try {
    const u = new URL(url);
    for (const p of active) {
      u.searchParams.set(p.key.trim(), p.value);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Generate perintah cURL siap eksekusi dari konfigurasi request.
 * Mendukung URL, method, query params, headers, dan body.
 */
export function generateCurl(req: {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
}): string {
  const fullUrl = buildUrlWithParams(req.url, req.params);
  const parts: string[] = ["curl"];

  if (req.method !== "GET") {
    parts.push(`-X ${req.method}`);
  }

  parts.push(`'${escapeShell(fullUrl)}'`);

  const activeHeaders = req.headers.filter((h) => h.enabled && h.key.trim());
  for (const h of activeHeaders) {
    parts.push(`-H '${escapeShell(h.key.trim())}: ${escapeShell(h.value)}'`);
  }

  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.body.trim();
  if (hasBody) {
    // Jika ada body tapi belum ada header Content-Type, otomatis tambahkan di cURL jika terlihat seperti JSON
    const hasContentType = activeHeaders.some((h) => h.key.toLowerCase().trim() === "content-type");
    if (!hasContentType && req.body.trim().startsWith("{")) {
      parts.push(`-H 'Content-Type: application/json'`);
    }
    parts.push(`-d '${escapeShell(req.body)}'`);
  }

  return parts.join(" \\\n  ");
}
