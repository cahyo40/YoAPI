import { useCallback, useEffect, useState } from "react";
import type { EnvVar } from "../lib/env.ts";

const KEY = "yoapi_env_vars";

/** Environment variables disimpan lokal (localStorage). Guest & authed sama —
 * var lingkungan bukan data sensitif per-akun, cukup per-browser. */
export function useEnv() {
  const [vars, setVars] = useState<EnvVar[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(vars));
    } catch {
      // abaikan kegagalan tulis
    }
  }, [vars]);

  const set = useCallback((next: EnvVar[]) => setVars(next), []);
  return { vars, set };
}
