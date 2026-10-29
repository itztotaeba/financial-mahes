-- =============================================================
-- financial-mahes: Patch sinkronisasi (jalankan SETELAH 001_init.sql)
-- Tanpa patch ini, tombol "Upload ke Supabase" (pushToCloud) akan GAGAL
-- karena kolom user_id NOT NULL tidak terisi oleh aplikasi.
-- =============================================================

-- 1) Default-kan user_id dari sesi yang login (auth.uid()),
--    agar insert/upsert tanpa kolom user_id tetap valid.
alter table public.transactions
  alter column user_id set default auth.uid();

-- 2) Backfill jika ada baris lama tanpa user_id (normalnya tidak ada).
update public.transactions set user_id = auth.uid() where user_id is null;

-- 3) Pastikan policy INSERT juga mengizinkan baris dengan user_id default.
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
