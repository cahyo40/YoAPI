import { useCallback, useEffect, useState } from "react";
import type { HeaderPair, HttpMethod } from "../types.ts";
import type { EnvVar } from "../lib/env.ts";
import { supabase } from "../lib/supabase.ts";
import { maskSensitive } from "../lib/sensitiveHeaders.ts";

export interface Folder {
  id: string;
  folder_name: string;
  env: EnvVar[];
}
export interface SavedRequest {
  id: string;
  folder_id: string;
  request_name: string;
  http_method: HttpMethod;
  endpoint_url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  request_body: string | null;
}

// Operasi mengembalikan pesan error (string) atau null bila sukses — pemanggil
// tampilkan lewat toast (RULES: kegagalan tak boleh senyap, T4.1).
type Fail = string | null;

/** Folder + saved request milik user (authed). RLS memastikan hanya baris sendiri. */
export function useWorkspace(userId: string | null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [requests, setRequests] = useState<SavedRequest[]>([]);

  const reload = useCallback(async () => {
    if (!userId) {
      setFolders([]);
      setRequests([]);
      return;
    }
    const [f, r] = await Promise.all([
      supabase.from("workspace_folders").select("id,folder_name,env").order("created_at"),
      supabase
        .from("api_requests")
        .select("id,folder_id,request_name,http_method,endpoint_url,headers,params,request_body")
        .order("created_at"),
    ]);
    if (!f.error) setFolders((f.data ?? []).map((x) => ({ ...x, env: x.env ?? [] })) as Folder[]);
    if (!r.error) setRequests(r.data as SavedRequest[]);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createFolder = useCallback(
    async (name: string): Promise<Fail> => {
      if (!userId) return "Belum login.";
      const { error } = await supabase
        .from("workspace_folders")
        .insert({ user_id: userId, folder_name: name });
      if (error) return error.message;
      await reload();
      return null;
    },
    [userId, reload]
  );

  const renameFolder = useCallback(
    async (id: string, name: string): Promise<Fail> => {
      const { error } = await supabase
        .from("workspace_folders")
        .update({ folder_name: name })
        .eq("id", id);
      if (error) return error.message;
      await reload();
      return null;
    },
    [reload]
  );

  // Hapus folder → request di dalamnya ikut terhapus (FK on delete cascade).
  const deleteFolder = useCallback(
    async (id: string): Promise<Fail> => {
      const { error } = await supabase.from("workspace_folders").delete().eq("id", id);
      if (error) return error.message;
      await reload();
      return null;
    },
    [reload]
  );

  /** Simpan env vars milik folder (T9.3, kolom jsonb Supabase). */
  const setFolderEnv = useCallback(
    async (id: string, env: EnvVar[]): Promise<Fail> => {
      // optimistik: update state dulu agar editor responsif
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, env } : f)));
      const { error } = await supabase
        .from("workspace_folders")
        .update({ env: env.filter((v) => v.key) })
        .eq("id", id);
      if (error) return error.message;
      return null;
    },
    []
  );

  /** Edit nama, URL, & folder endpoint tersimpan (pindah folder = ganti folder_id). */
  const updateRequest = useCallback(
    async (id: string, name: string, url: string, folderId?: string): Promise<Fail> => {
      const patch: Record<string, string> = { request_name: name, endpoint_url: url };
      if (folderId) patch.folder_id = folderId;
      const { error } = await supabase.from("api_requests").update(patch).eq("id", id);
      if (error) return error.message;
      await reload();
      return null;
    },
    [reload]
  );

  const deleteRequest = useCallback(
    async (id: string): Promise<Fail> => {
      const { error } = await supabase.from("api_requests").delete().eq("id", id);
      if (error) return error.message;
      await reload();
      return null;
    },
    [reload]
  );

  /** Simpan request. Header sensitif di-mask lebih dulu (T2.6). */
  const saveRequest = useCallback(
    async (r: {
      folderId: string;
      name: string;
      method: HttpMethod;
      url: string;
      headers: HeaderPair[];
      params: HeaderPair[];
      body: string;
    }): Promise<Fail> => {
      const { error } = await supabase.from("api_requests").insert({
        folder_id: r.folderId,
        request_name: r.name,
        http_method: r.method,
        endpoint_url: r.url,
        headers: maskSensitive(r.headers),
        params: r.params,
        request_body: r.body || null,
      });
      if (error) return error.message;
      await reload();
      return null;
    },
    [reload]
  );

  /** Import banyak request sekaligus ke satu folder (Postman). Satu insert batch. */
  const importRequests = useCallback(
    async (
      folderId: string,
      rows: {
        name: string;
        method: HttpMethod;
        url: string;
        headers: HeaderPair[];
        params: HeaderPair[];
        body: string;
      }[]
    ): Promise<Fail> => {
      if (!userId) return "Belum login.";
      if (rows.length === 0) return "Tak ada request untuk diimport.";
      const { error } = await supabase.from("api_requests").insert(
        rows.map((r) => ({
          folder_id: folderId,
          request_name: r.name,
          http_method: r.method,
          endpoint_url: r.url,
          headers: maskSensitive(r.headers),
          params: r.params,
          request_body: r.body || null,
        }))
      );
      if (error) return error.message;
      await reload();
      return null;
    },
    [userId, reload]
  );

  return { folders, requests, createFolder, renameFolder, deleteFolder, setFolderEnv, updateRequest, deleteRequest, saveRequest, importRequests, reload };
}
