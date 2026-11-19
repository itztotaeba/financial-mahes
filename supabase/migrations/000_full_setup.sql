-- =============================================================================
-- financial-mahes: MASTER SCHEMA LENGKAP (Jalankan Sekali di Supabase SQL Editor)
-- -----------------------------------------------------------------------------
-- Script ini IDEMPOTENT (aman dijalankan berulang kali, tidak akan merusak data).
-- Menyediakan seluruh tabel yang dibutuhkan aplikasi:
--   1. profiles
--   2. transactions
--   3. category_budgets
--   4. savings_goals
-- Lengkap dengan RLS (Row Level Security), default auth.uid(), dan reload PostgREST.
-- =============================================================================

-- 0) Izin dasar schema public
grant usage on schema public to anon, authenticated, service_role;

-- 1) ---------- PROFILES ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;
grant all on table public.profiles to anon, authenticated, service_role;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile saat signup user baru
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) ---------- TRANSACTIONS ----------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type        text not null check (type in ('income', 'expense')),
  amount      numeric(14,2) not null check (amount > 0),
  category    text not null,
  date        date not null default current_date,
  note        text default '',
  client_id   text,                -- id lokal (localStorage) utk dedup saat sync
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);

-- Pastikan kolom-kolom baru tersedia jika tabel sudah ada dari versi lama
alter table public.transactions add column if not exists note       text default '';
alter table public.transactions add column if not exists client_id  text;
alter table public.transactions add column if not exists updated_at timestamptz default now();
alter table public.transactions add column if not exists created_at timestamptz default now();
alter table public.transactions alter column user_id set default auth.uid();

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;
grant all on table public.transactions to anon, authenticated, service_role;

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

-- 3) ---------- CATEGORY BUDGETS (FITUR ANGGARAN) ----------
create table if not exists public.category_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category    text not null,
  amount      numeric(14,2) not null check (amount >= 0),
  month       text, -- format "YYYY-MM" (opsional, null = batas default bulanan)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists category_budgets_user_idx
  on public.category_budgets (user_id, category);

alter table public.category_budgets enable row level security;
grant all on table public.category_budgets to anon, authenticated, service_role;

drop policy if exists "category_budgets_select_own" on public.category_budgets;
create policy "category_budgets_select_own" on public.category_budgets
  for select using (auth.uid() = user_id);

drop policy if exists "category_budgets_insert_own" on public.category_budgets;
create policy "category_budgets_insert_own" on public.category_budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "category_budgets_update_own" on public.category_budgets;
create policy "category_budgets_update_own" on public.category_budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "category_budgets_delete_own" on public.category_budgets;
create policy "category_budgets_delete_own" on public.category_budgets
  for delete using (auth.uid() = user_id);

-- 4) ---------- SAVINGS GOALS (FITUR TABUNGAN) ----------
create table if not exists public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name           text not null,
  target_amount  numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date    date,
  color          text default '#2141E0',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists savings_goals_user_idx
  on public.savings_goals (user_id, created_at desc);

alter table public.savings_goals enable row level security;
grant all on table public.savings_goals to anon, authenticated, service_role;

drop policy if exists "savings_goals_select_own" on public.savings_goals;
create policy "savings_goals_select_own" on public.savings_goals
  for select using (auth.uid() = user_id);

drop policy if exists "savings_goals_insert_own" on public.savings_goals;
create policy "savings_goals_insert_own" on public.savings_goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "savings_goals_update_own" on public.savings_goals;
create policy "savings_goals_update_own" on public.savings_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "savings_goals_delete_own" on public.savings_goals;
create policy "savings_goals_delete_own" on public.savings_goals
  for delete using (auth.uid() = user_id);

-- 5) ---------- REFRESH POSTGREST SCHEMA CACHE ----------
notify pgrst, 'reload schema';
