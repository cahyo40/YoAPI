-- YoApi schema — jalankan di Supabase SQL editor.
-- Semua tabel wajib RLS aktif; isolasi antar-user via auth.uid().
--
-- Migrasi (kalau tabel sudah dibuat sebelum T4.4): tambah kolom params —
--   alter table api_requests add column if not exists params jsonb not null default '[]'::jsonb;
-- Migrasi T9.2 (body response untuk diff history):
--   alter table api_histories add column if not exists response_body text;
-- Migrasi T9.3 (env per folder):
--   alter table workspace_folders add column if not exists env jsonb not null default '[]'::jsonb;

-- profiles: data publik user, mirror auth.users.id (bukan password).
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists workspace_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  folder_name text not null,
  env jsonb not null default '[]'::jsonb, -- env vars per folder (T9.3): [{key,value}]
  created_at timestamptz not null default now()
);

create table if not exists api_requests (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references workspace_folders on delete cascade,
  request_name text not null,
  http_method text not null,
  endpoint_url text not null,
  headers jsonb not null default '[]'::jsonb, -- header sensitif sudah di-mask sebelum simpan (T2.6)
  params jsonb not null default '[]'::jsonb,   -- query params (T4.4 persist penuh)
  request_body text,
  created_at timestamptz not null default now()
);

create table if not exists api_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  http_method text not null,
  endpoint_url text not null,
  response_status int not null,
  response_body text, -- body response (T9.2) untuk diff; nullable (entri lama / body besar dilewati)
  executed_at timestamptz not null default now()
);

-- indeks akses per-user (RLS filter + urut terbaru).
create index if not exists idx_folders_user on workspace_folders (user_id, created_at desc);
create index if not exists idx_histories_user on api_histories (user_id, executed_at desc);
create index if not exists idx_requests_folder on api_requests (folder_id, created_at desc);

-- === RLS ===
alter table profiles enable row level security;
alter table workspace_folders enable row level security;
alter table api_requests enable row level security;
alter table api_histories enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own folders" on workspace_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own histories" on api_histories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- api_requests: tak punya user_id sendiri → cek via join ke folder pemiliknya.
create policy "own requests via folder" on api_requests
  for all using (
    exists (select 1 from workspace_folders f
            where f.id = api_requests.folder_id and f.user_id = auth.uid())
  ) with check (
    exists (select 1 from workspace_folders f
            where f.id = api_requests.folder_id and f.user_id = auth.uid())
  );

-- === trigger: auto-insert profile saat user baru daftar ===
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
