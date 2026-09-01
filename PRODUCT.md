# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pengembang software — Full-stack & Flutter developer, tim QA automation, mahasiswa/pemula. Situasi: sedang mengintegrasikan REST API ke aplikasi (khususnya Flutter/Dart), butuh cepat memeriksa response endpoint lalu menempel model bertipe ketat ke kode. Dipakai berulang tiap hari sebagai tool kerja. Dua tingkat: Guest (tanpa login, client-side) dan Authenticated User (folder & history tersinkron cloud).

## Product Purpose

Platform testing API berbasis web (mirip Postman) yang mengeksekusi HTTP request via proxy serverless (bypass CORS, nol instalasi) lalu mengonversi respons JSON otomatis menjadi model bertipe ketat multi-bahasa (Dart, Kotlin, Swift, TypeScript). Memecahkan lambatnya pembuatan data model manual dan kesalahan pengetikan nama variabel saat integrasi API. Sukses = waktu "punya endpoint" → "model siap tempel" < 30 detik (vs ~3–5 menit manual).

## Positioning

Bukan sekadar HTTP client dan bukan sekadar JSON→code generator — YoApi menyatukan keduanya: kirim request, dan model bertipe langsung ter-generate tanpa langkah copy-paste ke tool terpisah. Konversi 100% client-side (Web Worker), response tak pernah dikirim ke server YoApi. Nama class dibersihkan otomatis dari prefix ordinal quicktype; toggle Dart (Null Safety, Freezed, json_serializable, copyWith, Equatable) menyesuaikan gaya proyek.

## Operating Context

- Alur inti: pilih method → isi URL → Send → response tampil → JSON auto-convert jadi model. Dipakai dalam sesi kerja panjang, banyak endpoint berturut-turut.
- Authenticated: kumpulkan endpoint ke folder, simpan (header sensitif otomatis di-mask), export folder jadi zip (JSON mentah + model + index endpoint + README, request & response).
- History menyimpan method/url/status tiap eksekusi (guest: localStorage max 50; authed: Cloud Database). History akan dipindah ke halaman sendiri (`/history`).
- Fitur pendukung: env vars `{{key}}` (localStorage), auth helper (bearer/basic/apikey), import cURL, share link (state di URL, tanpa DB), starter examples di empty state.
- Deploy Vercel (region sin1), proxy serverless dengan SSRF guard.

## Capabilities and Constraints

- Stack: React 18 + Vite 6 + TypeScript strict SPA; Tailwind (token warna CSS-variable, dark mode via `.dark`); react-router (`/`, `/login`, `/auth/callback`, + `/history` baru). Monaco editor read-only untuk JSON & kode. quicktype-core di Web Worker.
- Cloud Database & Auth: Auth (email/password + Google OAuth), Postgres + RLS di semua tabel. Anon key saja di frontend; service_role tak pernah.
- Batas ukuran konversi 2 MB (cap payload 10 MB). Target localhost belum didukung (perlu ekstensi, v1.1).
- Non-negotiable (docs/RULES.md): SSRF guard cek private-IP setelah resolusi DNS; RLS aktif; validasi trust boundary; konversi client-side; mask header sensitif + consent; tanpa native alert/confirm/prompt (pakai Modal/Toast).

## Brand Commitments

Nama: **YoApi**. UI & seluruh teks berbahasa Indonesia. Tak pernah pakai pure black `#000`. Aksen saturasi rendah dipakai hemat. Preferensi sesi ini: gaya elegant & modern (bukan kuno/tua), kepadatan lega (airy), **dark-first** (dark jadi pengalaman utama & paling dipoles, light tetap ada).

## Evidence on Hand

Produk pra-rilis — belum ada metrik baseline, testimoni, atau angka pelanggan; jangan difabrikasi. Endpoint contoh nyata dipakai di empty state (JSONPlaceholder, GitHub API, PokeAPI, dog.ceo). Dokumen sumber: docs/PRD.md, docs/TECH_SPEC.md, docs/RULES.md, docs/DESIGN.md.

## Product Principles

1. Dari endpoint ke model dalam satu tarikan napas — hilangkan setiap langkah copy-paste manual.
2. Privasi by default — response & konversi tak pernah meninggalkan browser user.
3. Kegagalan tak boleh senyap — tiap error tampil (toast), tiap trust boundary divalidasi.
4. Familiar dulu, baru ekspresif — ini tool kerja; keterbacaan kode & scanability menang atas dekorasi.
5. Guest bisa langsung kerja; login hanya menambah persistensi, bukan membuka fitur inti.

## Accessibility & Inclusion

Kontras teks WCAG AA. Semua tombol/toggle keyboard-reachable, icon-only punya `aria-label`, focus ring terlihat, toast `aria-live=polite`.
