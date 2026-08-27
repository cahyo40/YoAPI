import type { HeaderPair } from "../types.ts";

/** Pisah query string dari URL → base + pairs, untuk auto-isi tab Params. */
export function splitUrlQuery(url: string): { base: string; pairs: HeaderPair[] } {
  const q = url.indexOf("?");
  if (q === -1) return { base: url, pairs: [] };
  const base = url.slice(0, q);
  const pairs: HeaderPair[] = [];
  for (const part of url.slice(q + 1).split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const rawKey = eq === -1 ? part : part.slice(0, eq);
    const rawVal = eq === -1 ? "" : part.slice(eq + 1);
    const key = dec(rawKey);
    if (key) pairs.push({ key, value: dec(rawVal), enabled: true });
  }
  return { base, pairs };
}

/** Merge params dari URL ke daftar existing: key sama → update value + aktifkan. */
export function mergeParams(existing: HeaderPair[], incoming: HeaderPair[]): HeaderPair[] {
  const out = [...existing];
  for (const inc of incoming) {
    const i = out.findIndex((p) => p.key === inc.key);
    if (i === -1) out.push(inc);
    else out[i] = { ...out[i], value: inc.value, enabled: true };
  }
  return out;
}

function dec(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}
