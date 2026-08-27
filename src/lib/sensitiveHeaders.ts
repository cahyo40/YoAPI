import type { HeaderPair } from "../types.ts";

// Nama header / pola nilai yang lazim membawa kredensial.
const SENSITIVE_KEYS = /^(authorization|x-api-key|api-key|x-auth-token|cookie|proxy-authorization)$/i;
const BEARER = /^bearer\s+\S/i;

export function isSensitive(h: HeaderPair): boolean {
  return SENSITIVE_KEYS.test(h.key.trim()) || BEARER.test(h.value.trim());
}

export function hasSensitive(headers: HeaderPair[]): boolean {
  return headers.some(isSensitive);
}

/** Ganti nilai header sensitif jadi placeholder sebelum simpan ke cloud (PRD §10). */
export function maskSensitive(headers: HeaderPair[]): HeaderPair[] {
  return headers.map((h) => (isSensitive(h) ? { ...h, value: "••••••" } : h));
}
