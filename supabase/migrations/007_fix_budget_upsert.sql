-- =============================================================
-- financial-mahes: Perbaikan permanen error 42P10 pada upsert
-- category_budgets (ON CONFLICT user_id,category,month).
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempotent: aman dijalankan berkali-kali.
-- =============================================================

-- 1) Normalisasi: NULL month dianggap '' supaya satu kunci unik konsisten.
update public.category_budgets set month = '' where month is null;
alter table only public.category_budgets alter column month set default '';
alter table only public.category_budgets alter column month set not null;

-- 2) Bersihkan baris duplikat (pertahankan yang paling baru diperbarui),
--    agar pembuatan unique index tidak gagal karena data lama.
delete from public.category_budgets a
  using public.category_budgets b
  where a.user_id = b.user_id
    and a.category = b.category
    and coalesce(a.month, '') = coalesce(b.month, '')
    and (
      b.updated_at > a.updated_at
      or (b.updated_at = a.updated_at and b.id > a.id)
    );

-- 3) Konstrain unik yang DIDOKUMENTASIKAN — inilah yang dicari oleh
--    PostgREST saat client mengirim `upsert(..., { onConflict: "user_id,category,month" })`.
--    (Unique INDEX biasa dari migration 006 kadang tidak terdeteksi
--     sebagai constraint matching -> error 42P10.)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'category_budgets_user_cat_month_key'
      and conrelid = 'public.category_budgets'::regclass
  ) then
    alter table public.category_budgets
      add constraint category_budgets_user_cat_month_key
      unique (user_id, category, coalesce(month, ''));
  end if;
end $$;

-- Cadangan: tetap buat unique index expression versi 006 juga.
create unique index if not exists category_budgets_user_cat_month_uniq
  on public.category_budgets (user_id, category, coalesce(month, ''));

-- 4) Segarkan schema cache PostgREST agar constraint langsung dikenali.
notify pgrst, 'reload schema';
