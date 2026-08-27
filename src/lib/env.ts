import type { HeaderPair } from "../types.ts";

export interface EnvVar {
  key: string;
  value: string;
}

const RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

/** Ganti {{key}} dengan nilai dari env. Key tak dikenal → dikumpulkan di `missing`. */
export function interpolate(text: string, env: Record<string, string>): { out: string; missing: string[] } {
  const missing: string[] = [];
  const out = text.replace(RE, (_, k) => {
    if (k in env) return env[k];
    if (!missing.includes(k)) missing.push(k);
    return `{{${k}}}`; // biarkan mentah agar terlihat, tak dikirim diam-diam
  });
  return { out, missing };
}

export function envMap(vars: EnvVar[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const v of vars) if (v.key.trim()) m[v.key.trim()] = v.value;
  return m;
}

/** Interpolasi url + tiap pair + body sekaligus; gabungkan semua var yang hilang. */
export function applyEnv(
  cfg: { url: string; headers: HeaderPair[]; params: HeaderPair[]; body: string },
  env: Record<string, string>
): { url: string; headers: HeaderPair[]; params: HeaderPair[]; body: string; missing: string[] } {
  const missing = new Set<string>();
  const sub = (s: string) => {
    const r = interpolate(s, env);
    r.missing.forEach((m) => missing.add(m));
    return r.out;
  };
  const pair = (p: HeaderPair): HeaderPair => ({ ...p, key: sub(p.key), value: sub(p.value) });
  return {
    url: sub(cfg.url),
    headers: cfg.headers.map(pair),
    params: cfg.params.map(pair),
    body: sub(cfg.body),
    missing: [...missing],
  };
}
