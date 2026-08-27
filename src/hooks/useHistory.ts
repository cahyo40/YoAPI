import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry, HttpMethod } from "../types.ts";
import { supabase } from "../lib/supabase.ts";

const KEY = "yoapi_history_guest";
const MAX = 50;
const MAX_BODY = 256 * 1024; // cap body tersimpan 256KB (RULES #3) — lebih besar dilewati

/**
 * History: guest → localStorage (hilang saat storage clear), authed → Supabase api_histories.
 * Beralih otomatis mengikuti userId (PRD §3 / US-03).
 */
export function useHistory(userId: string | null) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const loadGuest = () => {
    try {
      const raw = localStorage.getItem(KEY);
      setEntries(raw ? JSON.parse(raw) : []);
    } catch {
      setEntries([]);
    }
  };

  const loadAuthed = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("api_histories")
      .select("id,http_method,endpoint_url,response_status,response_body,executed_at")
      .order("executed_at", { ascending: false })
      .limit(MAX);
    if (error || !data) return;
    setEntries(
      data.map((r) => ({
        id: r.id,
        method: r.http_method as HttpMethod,
        url: r.endpoint_url,
        status: r.response_status,
        at: new Date(r.executed_at).getTime(),
        body: r.response_body ?? undefined,
      }))
    );
    void uid;
  }, []);

  useEffect(() => {
    if (userId) loadAuthed(userId);
    else loadGuest();
  }, [userId, loadAuthed]);

  const add = useCallback(
    async (method: HttpMethod, url: string, status: number, body?: string): Promise<string | null> => {
      const stored = body && body.length <= MAX_BODY ? body : undefined;
      if (userId) {
        const { data, error } = await supabase
          .from("api_histories")
          .insert({ user_id: userId, http_method: method, endpoint_url: url, response_status: status, response_body: stored ?? null })
          .select("id,executed_at")
          .single();
        if (error) return error.message;
        setEntries((prev) =>
          [
            {
              id: data?.id ?? crypto.randomUUID(),
              method,
              url,
              status,
              at: data ? new Date(data.executed_at).getTime() : Date.now(),
              body: stored,
            },
            ...prev,
          ].slice(0, MAX)
        );
        return null;
      }
      setEntries((prev) => {
        const next: HistoryEntry[] = [
          { id: crypto.randomUUID(), method, url, status, at: Date.now(), body: stored },
          ...prev,
        ].slice(0, MAX);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // abaikan kegagalan tulis
        }
        return next;
      });
      return null;
    },
    [userId]
  );

  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      if (userId) {
        const { error } = await supabase.from("api_histories").delete().eq("id", id);
        if (error) return error.message;
        setEntries((prev) => prev.filter((e) => e.id !== id));
        return null;
      }
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // abaikan
        }
        return next;
      });
      return null;
    },
    [userId]
  );

  const clear = useCallback(async (): Promise<string | null> => {
    if (userId) {
      const { error } = await supabase.from("api_histories").delete().eq("user_id", userId);
      if (error) return error.message;
      setEntries([]);
      return null;
    }
    try {
      localStorage.removeItem(KEY);
    } catch {
      // abaikan
    }
    setEntries([]);
    return null;
  }, [userId]);

  return { entries, add, remove, clear };
}
