import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";
import { field, btnSignal, btnOutline, panelLabel } from "../components/ui.ts";
import { IconGoogle, IconArrowLeft } from "../components/icons.tsx";

export default function Login() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const expired = sp.get("expired") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) return setError(error.message);
    nav("/");
  };

  const google = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="instrument-grid flex min-h-screen flex-col bg-bg text-text">
      <div className="flex flex-1 items-center justify-center p-5">
        <div className="w-full max-w-sm">
          {/* wordmark + logo, same instrument identity as the header */}
          <div className="mb-8 flex items-center gap-2.5">
            <img src="/icon.svg" alt="" aria-hidden className="signal-live h-8 w-8" />
            <span className="font-mono text-[18px] font-bold tracking-tight">
              Yo<span className="text-signal">Api</span>
            </span>
          </div>

          <div className="rounded-panel border border-border bg-surface p-6 shadow-panel">
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "signin" ? "Masuk" : "Buat akun"}
            </h1>
            <p className="mt-1 text-[14px] text-text-dim">
              {mode === "signin"
                ? "Akses folder & riwayat tersimpan."
                : "Simpan endpoint dan riwayat di cloud."}
            </p>

            {expired && (
              <p
                className="mt-4 rounded-lg px-3 py-2 text-[13px] text-warn"
                style={{ background: "color-mix(in srgb, var(--warn) 12%, transparent)" }}
              >
                Sesi berakhir. Masuk lagi untuk menyimpan.
              </p>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block space-y-1.5">
                <span className={panelLabel}>Email</span>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={panelLabel}>Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                />
              </label>
              {error && <p className="text-[14px] text-err">{error}</p>}
              <button type="submit" disabled={busy} className={btnSignal + " w-full"}>
                {busy ? "Memproses…" : mode === "signin" ? "Masuk" : "Daftar"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">atau</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button onClick={google} className={btnOutline + " w-full justify-center gap-2.5"}>
              <IconGoogle size={16} />
              Lanjut dengan Google
            </button>

            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 w-full text-center text-[14px] text-text-dim transition hover:text-signal"
            >
              {mode === "signin" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
            </button>
          </div>

          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 text-[14px] text-text-dim transition hover:text-signal"
          >
            <IconArrowLeft size={15} />
            Kembali ke Console
          </Link>
        </div>
      </div>
    </div>
  );
}
