-- =============================================================================
-- 004_realtime.sql — Aktifkan Supabase Realtime untuk tabel `transactions`
-- -----------------------------------------------------------------------------
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor.
-- Tanpa ini, perubahan di device A TIDAK akan terdorong real-time ke device B
-- (device B tetap bisa update via pull-on-load saat refresh/fokus tab).
-- =============================================================================

-- 1) Daftarkan tabel ke publication supabase_realtime agar event INSERT/UPDATE/DELETE
--    dipancarkan ke subscriber.
drop table if exists public.transactions_new; -- pembersihan opsional dari eksperimen lama

alter publication supabase_realtime add table public.transactions;

-- 2) Kirim seluruh kolom pada payload UPDATE/DELETE (bukan hanya yang berubah),
--    agar client bisa langsung memakai data event tanpa query tambahan.
alter table public.transactions replica identity full;

-- 3) Pastikan updated_at selalu di-set oleh database (dipakai watermark
--    pull-on-load refreshIfStale). Idempotent: aman dijalankan berulang.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();
