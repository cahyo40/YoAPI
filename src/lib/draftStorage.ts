import type { HeaderPair, HttpMethod } from "../types.ts";
import type { AuthConfig } from "./auth.ts";

export interface WorkbenchDraft {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
  auth: AuthConfig;
  updatedAt: number;
}

const DRAFT_KEY = "yoapi_workbench_draft";

/** Simpan snapshot draf kerja aktif di browser (Console state). */
export function saveDraft(draft: Omit<WorkbenchDraft, "updatedAt">): void {
  try {
    const data: WorkbenchDraft = { ...draft, updatedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // Abaikan kegagalan localStorage (quota / incognito restriction)
  }
}

/** Muat snapshot draf kerja aktif dari browser bila valid. */
export function loadDraft(): WorkbenchDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d?.url !== "string" || typeof d?.method !== "string") return null;
    return {
      method: d.method,
      url: d.url,
      headers: Array.isArray(d.headers) ? d.headers : [],
      params: Array.isArray(d.params) ? d.params : [],
      body: typeof d.body === "string" ? d.body : "",
      auth:
        d.auth && typeof d.auth.type === "string"
          ? d.auth
          : { type: "none" },
      updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/** Hapus draf kerja yang tersimpan. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Abaikan
  }
}
