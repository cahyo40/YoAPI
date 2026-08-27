# YoApi

**Web-based REST API console + multi-language typed-model generator.**

YoApi menyatukan dua alat yang biasanya terpisah: sebuah HTTP client (seperti Postman) dan sebuah JSON→code generator. Kirim satu request, dan model bertipe ketat untuk bahasa target Anda langsung ter-generate — tanpa langkah copy-paste ke tool lain. Konversi berjalan **100% di browser**; response Anda tidak pernah dikirim ke server YoApi.

> Dari "punya endpoint" menjadi "model siap tempel" dalam < 30 detik.

🔗 **Live:** https://yoapi.vercel.app

---

## Daftar Isi

- [Masalah yang Dipecahkan](#masalah-yang-dipecahkan)
- [Fitur](#fitur)
- [Cara Kerja](#cara-kerja)
- [Arsitektur](#arsitektur)
- [Bahasa Target & Opsi Generator](#bahasa-target--opsi-generator)
- [Keamanan & Privasi](#keamanan--privasi)
- [Progressive Web App](#progressive-web-app)
- [Desain](#desain)
- [Batasan](#batasan)
- [Stack Teknologi](#stack-teknologi)
- [Lisensi](#lisensi)

---

## Masalah yang Dipecahkan

Saat mengintegrasikan REST API ke aplikasi (khususnya Flutter/Dart), alur kerja normal itu lambat dan rawan salah ketik:

1. Buka HTTP client, kirim request, lihat response JSON.
2. Salin JSON ke tool generator terpisah.
3. Bersihkan nama class, pilih opsi, generate.
4. Salin lagi ke editor kode.

YoApi memampatkan seluruh siklus itu ke satu layar. Response JSON yang masuk **otomatis** menjadi model bertipe di panel sebelahnya, nama class dibersihkan otomatis, dan opsi generator menyesuaikan gaya proyek Anda.

## Fitur

### Konsol Request
- **Semua method HTTP** — GET, POST, PUT, PATCH, DELETE, dll.
- **Header, query params, dan body** editor dengan penyorotan.
- **Auth helper** — Bearer token, Basic auth, dan API key, di-inject ke header secara otomatis.
- **Import cURL** — tempel perintah `curl` apa pun, YoApi mengurai method/URL/header/body.
- **Environment variables** — sintaks `{{key}}` yang di-resolve dari variabel tersimpan (per folder untuk user login, localStorage untuk guest).
- **Share link** — bagikan konfigurasi request lewat URL (state di-encode di URL, tanpa database).
- **Starter examples** — endpoint publik nyata (JSONPlaceholder, GitHub API, PokeAPI, dog.ceo) di empty state untuk langsung mencoba.

### Readout Response
- **Panel instrumen** — status, latensi (ms), dan ukuran payload tampil sebagai readout terkalibrasi.
- **Monaco editor read-only** dengan syntax highlighting untuk JSON, XML, HTML, dan teks.
- **Pretty-print** otomatis untuk JSON dan non-JSON (indentasi XML/HTML ringan).
- **Cari di dalam body** dengan sorot & lompat antar-match.
- **Tab Headers** menampilkan seluruh header response.

### Generator Model
- **Konversi otomatis** — response JSON langsung menjadi model bertipe di panel Model.
- **9 bahasa target** (lihat di bawah).
- **Nama class dibersihkan** dari prefix ordinal quicktype secara otomatis.
- **Multi-sample merge** — kumpulkan beberapa response endpoint yang sama; field yang tak selalu ada jadi opsional.
- **Copy & Download** kode hasil generate.

### Workspace (khusus user login)
- **Folder** untuk mengelompokkan endpoint tersimpan, tersinkron ke cloud (Supabase).
- **Simpan request** ke folder; **header sensitif otomatis di-mask** dengan konfirmasi.
- **Environment per folder** — set variabel yang berbeda untuk tiap workspace.
- **Export folder ke ZIP** — berisi JSON mentah (request & response), model per endpoint, model dari body request, daftar endpoint, dan README cara pakai.

### History
- Setiap eksekusi tercatat: method, URL, status, waktu.
- **Guest:** localStorage (maks 50 entri).
- **User login:** tersinkron ke Supabase, lintas perangkat.
- **Diff** — bandingkan body response satu endpoint dengan eksekusi sebelumnya.
- **Simpan langsung** dari history ke folder.

### Guest vs User Login
- **Guest** bisa langsung bekerja tanpa akun — konsol, konversi, history lokal, semua jalan. Dibatasi kuota request harian (reset otomatis tiap 24 jam).
- **User login** mendapat persistensi: folder & history tersinkron cloud. Login **menambah persistensi, bukan membuka fitur inti**.

## Cara Kerja

```
  ┌─────────────┐   POST /api/proxy    ┌──────────────────┐   HTTP     ┌─────────────┐
  │   Browser   │ ───────────────────► │  Vercel Serverless│ ─────────► │  API tujuan │
  │  (React SPA)│                      │   Proxy (SSRF     │            │  Anda       │
  │             │ ◄─────────────────── │   guarded)        │ ◄───────── │             │
  └──────┬──────┘   response JSON      └──────────────────┘            └─────────────┘
         │
         │ response tidak pernah meninggalkan browser lagi
         ▼
  ┌─────────────────────┐
  │  Web Worker         │  quicktype-core mengonversi JSON → model bertipe
  │  (quicktype-core)   │  di thread terpisah, UI tetap responsif
  └─────────────────────┘
```

1. Anda menyusun request di konsol. Browser mengirimnya ke **proxy serverless** (untuk melewati CORS — nol instalasi ekstensi).
2. Proxy meneruskan ke API tujuan Anda dan mengembalikan response mentah. Proxy dijaga [SSRF guard](#keamanan--privasi).
3. Response ditampilkan, lalu **dikonversi jadi model di Web Worker** — sepenuhnya di browser Anda. Response tidak pernah dikirim balik ke server YoApi untuk konversi.

## Arsitektur

Single-Page Application yang di-deploy ke Vercel.

| Lapisan | Teknologi | Catatan |
|---|---|---|
| UI | React 18 + Vite 6 + TypeScript (strict) | SPA, react-router (`/`, `/login`, `/auth/callback`, `/history`) |
| Styling | Tailwind CSS | Token warna CSS-variable, dark-first dengan override `.light` |
| Editor | Monaco (read-only) | JSON, kode hasil generate |
| Konversi | quicktype-core di Web Worker | Off-main-thread, cap 2 MB |
| Proxy | Vercel Serverless Function (`api/proxy.ts`) | Bypass CORS, SSRF guard, rate limit, region `sin1` |
| Auth & Data | Supabase (Postgres + RLS) | Email/password + Google OAuth; anon key saja di frontend |

**Routing serverless** (`vercel.json`): semua path non-`/api/*` di-rewrite ke `index.html` (SPA fallback); `api/proxy.ts` dibatasi `maxDuration` 30 detik.

## Bahasa Target & Opsi Generator

Model di-generate untuk sembilan bahasa:

**Dart · Kotlin · Swift · TypeScript · Go · Python · Java · C# · Rust**

Opsi khusus per bahasa:

| Bahasa | Opsi |
|---|---|
| **Dart** | Null Safety, Freezed, json_serializable, copyWith, Equatable |
| **Python** | Pydantic `BaseModel` (validasi runtime) vs dataclass |
| **Java** | Anotasi Lombok (`@Data`) |
| **C#** | `System.Text.Json` vs Newtonsoft.Json |
| **Rust** | `#[derive(Debug, Clone)]` |

Beberapa response endpoint yang sama bisa digabung (multi-sample merge) sehingga field yang tak konsisten otomatis jadi opsional/nullable.

## Keamanan & Privasi

Keamanan bukan fitur tambahan — ini prinsip non-negotiable dari produk.

- **Konversi client-side.** Response JSON Anda dikonversi di Web Worker di browser. Server YoApi tidak pernah melihat isi response untuk keperluan konversi.
- **SSRF guard pada proxy.** Sebelum meneruskan request, proxy me-resolve DNS lalu **menolak IP privat/internal** (loopback, link-local, RFC 1918, dst). Ini mencegah proxy dipakai menyerang jaringan internal.
- **Rate limiting** pada proxy (default 60 req/menit per IP).
- **Batas ukuran** — response di-cap 10 MB; konversi di-cap 2 MB.
- **Row Level Security (RLS)** aktif di semua tabel Supabase. Frontend hanya memakai **anon key**; `service_role` tidak pernah ada di klien.
- **Header sensitif di-mask.** Saat menyimpan request ke folder, header seperti `Authorization` otomatis di-mask, dengan konfirmasi eksplisit.
- **Timeout** request proxy 25 detik (di bawah batas Vercel 30 detik).
- **Tanpa native `alert`/`confirm`/`prompt`.** Semua interaksi lewat Modal & Toast — tak ada dialog yang bisa membeku atau disalahgunakan.

## Progressive Web App

YoApi bisa dipasang sebagai aplikasi (installable PWA):

- **Web App Manifest** — nama, ikon (192/512 + maskable), tema dark `#0b0f14`, display `standalone`.
- **Service worker** — app-shell cache untuk instalabilitas + offline dasar. Navigasi memakai strategi network-first dengan fallback shell; **request ke `/api/` selalu network-only** (proxy tidak pernah di-cache); hanya GET yang di-cache.
- **Apple touch icon** + meta tag untuk iOS.

Pasang lewat ikon install di address bar (Chrome/Edge desktop), "Add to Home screen" (Android), atau Share → "Add to Home Screen" (iOS Safari).

## Desain

Dunia visual **"The Instrument Panel"** — YoApi diperlakukan sebagai instrumen presisi, bukan sekadar form.

- **Dark-first.** Dark adalah pengalaman utama dan paling dipoles; light mode tetap tersedia sebagai override daylight.
- **Tidak pernah pure black** `#000`. Casing instrumen warm near-black `#0b0f14`.
- **Satu sinyal ter-iluminasi** — cyan instrumen `#34d6c8`, dipakai hemat hanya untuk state live/selected.
- **JetBrains Mono** untuk setiap nilai terukur (tabular figures), **Inter** untuk prosa.
- **Kontras teks WCAG AA.** Warna teks di atas tombol dipilih per-mode untuk kontras yang lolos AA (token `--on-signal` / `--on-err`).
- **Aksesibilitas** — tombol/toggle keyboard-reachable, icon-only punya `aria-label`, focus ring terlihat, toast `aria-live=polite`.

Seluruh UI dan teks berbahasa Indonesia.

## Batasan

- **Target localhost belum didukung** — proxy tidak bisa menjangkau `localhost` klien (perlu ekstensi browser; direncanakan v1.1).
- Konversi dibatasi payload 2 MB.
- OAuth2 flow (dengan `client_secret`) belum tersedia — memerlukan proxy serverless khusus.

## Stack Teknologi

- **React 18.3** · **Vite 6** · **TypeScript 5.7** (strict)
- **Tailwind CSS 3.4**
- **@monaco-editor/react** — editor kode read-only
- **quicktype-core** — engine konversi JSON→model (di Web Worker)
- **@supabase/supabase-js** — Auth + Postgres + RLS
- **react-router-dom 6**
- **Vercel** — hosting SPA + serverless proxy (region `sin1`)

## Lisensi

Hak cipta © 2026 cahyo40. Seluruh hak dilindungi.
