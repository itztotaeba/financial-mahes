-- =============================================================
-- financial-mahes: Perbaikan skema (jalankan di Supabase SQL Editor)
--
-- Mengatasi error sync cloud:
--   PGRST204: "Could not find the 'note' column of 'transactions'"
--   -> berarti tabel transactions dibuat TIDAK lengkap (kolom note &
--      client_id tidak ada). Script ini Idempotent: aman dijalankan
--      berkali-kali, dan bisa memperbaiki tabel lama maupun membuat
--      tabel baru dari nol.
-- =============================================================

-- 1) Pastikan tabel ada dengan struktur LENGKAP (untuk instalasi baru).
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  amount      numeric(14,2) not null check (amount > 0),
  category    text not null,
  date        date not null default current_date,
  note        text default '',
  client_id   text,                -- id lokal (localStorage) utk dedup saat sync
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);

-- 2) Tambahkan kolom yang mungkin hilang pada tabel lama.
alter table public.transactions add column if not exists note       text default '';
alter table public.transactions add column if not exists client_id  text;
alter table public.transactions add column if not exists updated_at timestamptz default now();
alter table public.transactions add column if not exists created_at timestamptz default now();

-- 3) user_id terisi otomatis dari sesi login (diperlukan utk insert tanpa user_id).
alter table public.transactions alter column user_id set default auth.uid();

-- 4) Index & RLS.
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- 5) (Opsional) Jika ingin mencegah duplikat baris saat push berulang,
--    aktifkan unique index di bawah ini. HANYA jika tidak ada client_id NULL
--    dari data lama yang mengganggu:
-- create unique index if not exists transactions_user_client_uniq
--   on public.transactions (user_id, client_id) where client_id is not null;
