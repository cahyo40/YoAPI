import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";

/** Tujuan redirect OAuth Google. SDK menukar code→session lewat detectSessionInUrl. */
export default function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    // Sesi sudah/akan dibaca dari URL oleh SDK; tunggu lalu pulang.
    const { data } = supabase.auth.onAuthStateChange(() => nav("/", { replace: true }));
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) nav("/", { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  return (
    <div className="instrument-grid flex min-h-screen items-center justify-center bg-bg text-text">
      <div className="flex items-center gap-2.5">
        <span
          className="signal-live h-2.5 w-2.5 rounded-sm bg-signal"
          style={{ boxShadow: "0 0 10px var(--signal)" }}
          aria-hidden
        />
        <span className="font-mono text-[14px] uppercase tracking-[0.14em] text-text-dim">
          Memproses login…
        </span>
      </div>
    </div>
  );
}
