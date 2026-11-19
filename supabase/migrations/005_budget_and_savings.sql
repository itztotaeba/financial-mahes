-- =============================================================
-- financial-mahes: Skema Anggaran per Kategori & Target Tabungan
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempotent: aman dijalankan berkali-kali.
-- =============================================================

grant usage on schema public to anon, authenticated, service_role;

-- Pastikan tabel transactions ada sebelum diberi grant
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type        text not null check (type in ('income', 'expense')),
  amount      numeric(14,2) not null check (amount > 0),
  category    text not null,
  date        date not null default current_date,
  note        text default '',
  client_id   text,
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);

alter table public.transactions enable row level security;
grant all on table public.transactions to anon, authenticated, service_role;

-- ---------- CATEGORY BUDGETS ----------
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

-- ---------- SAVINGS GOALS ----------
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

-- Segarkan schema cache PostgREST agar API Supabase langsung mengenali tabel
notify pgrst, 'reload schema';
