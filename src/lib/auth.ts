import type { HeaderPair } from "../types.ts";

export type AuthType = "none" | "bearer" | "basic" | "apikey";

export interface AuthConfig {
  type: AuthType;
  token: string; // bearer / api-key value
  username: string; // basic
  password: string; // basic
  apiKeyName: string; // nama header untuk apikey (default X-API-Key)
}

export const emptyAuth: AuthConfig = {
  type: "none",
  token: "",
  username: "",
  password: "",
  apiKeyName: "X-API-Key",
};

/** Bentuk satu HeaderPair dari konfigurasi auth, atau null bila type none/kosong. */
export function authHeader(a: AuthConfig): HeaderPair | null {
  switch (a.type) {
    case "bearer":
      return a.token ? { key: "Authorization", value: `Bearer ${a.token}`, enabled: true } : null;
    case "basic":
      return a.username || a.password
        ? { key: "Authorization", value: `Basic ${btoa(`${a.username}:${a.password}`)}`, enabled: true }
        : null;
    case "apikey":
      return a.token && a.apiKeyName
        ? { key: a.apiKeyName, value: a.token, enabled: true }
        : null;
    default:
      return null;
  }
}
