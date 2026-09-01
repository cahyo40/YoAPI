import { useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.tsx";
import Footer from "../components/Footer.tsx";
import { useTheme } from "../hooks/useTheme.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { supabase } from "../lib/supabase.ts";
import {
  IconConsole,
  IconZap,
  IconShield,
  IconCode,
  IconBox,
  IconImport,
  IconGitCompare,
  IconCheck,
  IconCopy,
} from "../components/icons.tsx";
import { useToast } from "../components/Toast.tsx";

const CODE_SAMPLES: Record<
  string,
  { label: string; lang: string; code: string }
> = {
  dart: {
    label: "Dart (Freezed)",
    lang: "dart",
    code: `@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required int id,
    required String name,
    required String email,
    required bool isActive,
    DateTime? createdAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}`,
  },
  typescript: {
    label: "TypeScript",
    lang: "typescript",
    code: `export interface UserModel {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
}`,
  },
  kotlin: {
    label: "Kotlin",
    lang: "kotlin",
    code: `data class UserModel(
    val id: Long,
    val name: String,
    val email: String,
    val isActive: Boolean,
    val createdAt: String? = null
)`,
  },
  swift: {
    label: "Swift (Codable)",
    lang: "swift",
    code: `struct UserModel: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let isActive: Bool
    let createdAt: String?
}`,
  },
  python: {
    label: "Python (Pydantic)",
    lang: "python",
    code: `from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserModel(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None`,
  },
  rust: {
    label: "Rust (Serde)",
    lang: "rust",
    code: `use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserModel {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub is_active: bool,
    pub created_at: Option<String>,
}`,
  },
};

export default function About() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [activeLang, setActiveLang] = useState("dart");
  const [copied, setCopied] = useState(false);

  const sampleJson = `{
  "id": 101,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "isActive": true,
  "createdAt": "2026-09-01T09:00:00Z"
}`;

  const copySample = async () => {
    await navigator.clipboard.writeText(CODE_SAMPLES[activeLang].code);
    setCopied(true);
    toast("Contoh kode tersalin.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="instrument-grid flex min-h-[100dvh] flex-col bg-bg text-text selection:bg-signal/20">
      <AppHeader
        dark={dark}
        user={user}
        onToggleTheme={toggleTheme}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-border px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-signal-dim/40 bg-signal/10 px-3 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal shadow-glow">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              Nol Instalasi • 100% Client-Side Privacy • Multi-Language Model
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-4xl lg:text-5xl">
              Dari Endpoint ke Model Bertipe{" "}
              <span className="text-signal">dalam Satu Tarikan Napas</span>
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-[14px] leading-relaxed text-text-dim sm:text-[16px]">
              Platform pengujian REST API berbasis web yang mengeksekusi HTTP request via proxy serverless
              (bypass CORS) lalu mengonversi respons JSON secara instan menjadi model bertipe ketat
              untuk <strong>Dart (Flutter), Kotlin, Swift, TypeScript, Go, Python, Java, C#, dan Rust</strong>.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 font-mono text-[13px] font-bold tracking-wide text-on-signal shadow-glow transition hover:brightness-110"
              >
                <IconConsole size={16} />
                Buka Console (Gratis Tanpa Login)
              </Link>
              <a
                href="https://github.com/cahyo40/YoAPI"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-2 px-4 py-2.5 text-[13px] font-medium text-text-dim transition hover:border-signal-dim hover:text-text"
              >
                Dokumentasi GitHub
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] text-text-faint sm:gap-8">
              <span className="inline-flex items-center gap-1.5">
                <IconCheck size={13} className="text-signal" /> Zero Install (Web SPA)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheck size={13} className="text-signal" /> Bypass CORS Otomatis
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheck size={13} className="text-signal" /> Web Worker Sandboxed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheck size={13} className="text-signal" /> Export 1 Folder ke ZIP
              </span>
            </div>
          </div>
        </section>

        {/* CODE & MODEL LIVE SHOWCASE */}
        <section className="border-b border-border bg-surface/40 px-4 py-12 sm:px-6 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
                Interactive Generation
              </span>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text sm:text-2xl">
                JSON Mentah $\rightarrow$ Model Bertipe Siap Tempel
              </h2>
              <p className="mt-1.5 text-[13px] text-text-dim">
                Lihat bagaimana respons JSON diubah seketika menjadi struktur model dengan gaya koding modern.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* INPUT JSON */}
              <div className="flex flex-col rounded-panel border border-border bg-surface shadow-panel">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-signal" />
                    <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-text-dim">
                      Input Response JSON
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-text-faint">live readout</span>
                </div>
                <div className="p-4">
                  <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-signal-dim">
                    {sampleJson}
                  </pre>
                </div>
              </div>

              {/* OUTPUT CODE */}
              <div className="flex flex-col rounded-panel border border-border bg-surface shadow-panel">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
                  <div className="flex flex-wrap items-center gap-1">
                    {Object.keys(CODE_SAMPLES).map((k) => (
                      <button
                        key={k}
                        onClick={() => setActiveLang(k)}
                        className={`rounded-md px-2.5 py-1 font-mono text-[12px] font-medium transition ${
                          activeLang === k
                            ? "bg-surface-2 text-signal"
                            : "text-text-faint hover:text-text-dim"
                        }`}
                      >
                        {CODE_SAMPLES[k].label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={copySample}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] text-text-dim transition hover:bg-surface-2 hover:text-signal"
                    aria-label="Salin contoh kode"
                  >
                    {copied ? <IconCheck size={13} className="text-signal" /> : <IconCopy size={13} />}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-text">
                    {CODE_SAMPLES[activeLang].code}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 CORE PILLARS */}
        <section className="px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-signal">
                Engineering Pillars
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Dirancang Khusus untuk Alur Kerja Developer
              </h2>
              <p className="mt-2 text-[14px] text-text-dim">
                Menghilangkan setiap gesekan saat menghubungkan backend API ke aplikasi Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <PillarCard
                icon={<IconZap size={20} className="text-signal" />}
                title="Bypass CORS & SSRF Guard"
                description="Kirim request HTTP ke mana saja via proxy serverless (region sin1) tanpa instalasi extension, dilengkapi filter SSRF ketat setelah resolusi DNS."
              />
              <PillarCard
                icon={<IconShield size={20} className="text-signal" />}
                title="100% Client-Side Privacy"
                description="Response payload Anda tidak pernah dikirim atau disimpan di server YoApi. Seluruh parsing dan konversi model berjalan di Web Worker browser Anda."
              />
              <PillarCard
                icon={<IconBox size={20} className="text-signal" />}
                title="Export Proyek ke ZIP"
                description="Unduh satu folder endpoint menjadi file ZIP lengkap berisi model di bahasa pilihan Anda, response JSON mentah, index endpoint, dan file README.md."
              />
              <PillarCard
                icon={<IconCode size={20} className="text-signal" />}
                title="Multi-Language Support"
                description="Hasilkan model bertipe ketat untuk Dart (Freezed, Null Safety, Equatable), Kotlin, Swift Codable, TypeScript, Python Pydantic, Rust, Go, Java, dan C#."
              />
              <PillarCard
                icon={<IconImport size={20} className="text-signal" />}
                title="Integrasi cURL & Postman"
                description="Salin perintah cURL dengan 1 klik, import cURL multiline, atau import koleksi Postman JSON langsung ke workspace folder Anda."
              />
              <PillarCard
                icon={<IconGitCompare size={20} className="text-signal" />}
                title="History Diff & Env Scoping"
                description="Bandingkan perbedaan response payload antar eksekusi (LCS Diff) dan atur environment variables {{key}} per folder yang tersinkron via Supabase."
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / COMPARISON */}
        <section className="border-t border-border bg-surface/50 px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-signal">
                Workflow Comparison
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Hemat Waktu 90% Setiap Integrasi Endpoint
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-panel border border-border bg-surface p-6">
                <h3 className="flex items-center gap-2 font-mono text-[14px] font-bold text-err">
                  <span className="h-2 w-2 rounded-full bg-err" />
                  Alur Manual (~3–5 Menit)
                </h3>
                <ul className="mt-4 space-y-3 text-[14px] text-text-dim">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-text-faint">1.</span> Buka Postman / terminal untuk kirim request.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-text-faint">2.</span> Salin payload JSON panjang.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-text-faint">3.</span> Buka generator online terpisah atau ketik manual.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-text-faint">4.</span> Bersihkan nama class yang acak dan perbaiki null-safety.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-text-faint">5.</span> Tempel ke project dan perbaiki error compile.
                  </li>
                </ul>
              </div>

              <div className="rounded-panel border border-signal-dim/60 bg-surface p-6 shadow-glow">
                <h3 className="flex items-center gap-2 font-mono text-[14px] font-bold text-signal">
                  <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
                  Dengan YoApi (&lt; 30 Detik)
                </h3>
                <ul className="mt-4 space-y-3 text-[14px] text-text">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-signal">1.</span> Masukkan URL endpoint dan klik <strong>Send</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-signal">2.</span> Model bertipe langsung ter-generate instan di layar.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-signal">3.</span> Nama class otomatis rapi, null-safety terdeteksi akurat.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-signal">4.</span> Salin model atau unduh seluruh folder dalam format ZIP.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="border-t border-border px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Mulai Uji API & Generate Model Sekarang
            </h2>
            <p className="mt-3 text-[15px] text-text-dim">
              Bebas digunakan sebagai Guest tanpa perlu login. Masuk hanya bila Anda ingin menyimpan folder dan sinkronisasi cloud.
            </p>
            <div className="mt-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-signal px-7 py-3.5 font-mono text-[14px] font-bold tracking-wide text-on-signal shadow-glow transition hover:brightness-110"
              >
                <IconConsole size={18} />
                Buka YoApi Console
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PillarCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col rounded-panel border border-border bg-surface p-6 shadow-panel transition hover:border-border-strong">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-2">
        {icon}
      </div>
      <h3 className="text-[16px] font-semibold text-text">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-text-dim">{description}</p>
    </div>
  );
}
