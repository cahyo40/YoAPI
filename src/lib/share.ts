import type { HeaderPair, HttpMethod } from "../types.ts";

export interface ShareState {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
}

// base64url dari JSON (UTF-8 aman). Tanpa DB — seluruh state ada di URL.
// ponytail: tak ada kompresi; request raksasa → URL panjang. Cukup untuk umumnya.
function toB64Url(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeShare(s: ShareState): string {
  return toB64Url(JSON.stringify(s));
}

/** Decode; kembalikan null bila rusak (jangan lempar ke UI). */
export function decodeShare(token: string): ShareState | null {
  try {
    const o = JSON.parse(fromB64Url(token));
    if (typeof o?.url !== "string" || typeof o?.method !== "string") return null;
    return {
      method: o.method,
      url: o.url,
      headers: Array.isArray(o.headers) ? o.headers : [],
      params: Array.isArray(o.params) ? o.params : [],
      body: typeof o.body === "string" ? o.body : "",
    };
  } catch {
    return null;
  }
}
