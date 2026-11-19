-- =============================================================
-- financial-mahes: Perbaikan permanen error 42P10 pada upsert
-- category_budgets (ON CONFLICT user_id,category,month).
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Idempotent: aman dijalankan berkali-kali.
--
-- CATATAN PENTING:
--   * Postgres TIDAK mendukung ekspresi seperti coalesce(month,'')
--     di dalam "ADD CONSTRAINT ... UNIQUE (...)". Sintaks itu gagal
--     dengan error 42601. Constraint unik hanya boleh memakai nama
--     kolom biasa.
--   * Karena itu langkah 1 menormalkan NULL -> '' dan membuat kolom
--     month NOT NULL dengan default ''. Setelah itu constraint unik
--     sederhana (user_id, category, month) sudah cukup dan cocok
--     dengan onConflict: "user_id,category,month" dari client.
-- =============================================================

-- 1) Normalisasi: NULL month dianggap '' supaya satu kunci unik konsisten.
update public.category_budgets set month = '' where month is null;
alter table only public.category_budgets alter column month set default '';
alter table only public.category_budgets alter column month set not null;

-- 2) Bersihkan baris duplikat (pertahankan yang paling baru diperbarui),
--    agar pembuatan unique constraint tidak gagal karena data lama.
delete from public.category_budgets a
  using public.category_budgets b
  where a.user_id = b.user_id
    and a.category = b.category
    and a.month = b.month
    and (
      b.updated_at > a.updated_at
      or (b.updated_at = a.updated_at and b.id > a.id)
    );

-- 3) Konstrain unik plain-column -- inilah yang dicari PostgREST saat
--    client mengirim `upsert(..., { onConflict: "user_id,category,month" })`.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'category_budgets_user_cat_month_key'
      and conrelid = 'public.category_budgets'::regclass
  ) then
    alter table public.category_budgets
      add constraint category_budgets_user_cat_month_key
      unique (user_id, category, month);
  end if;
end $$;

-- 4) Rapikan indeks expression lama dari migration 006 yang memakai
--    coalesce(month,''). Indeks itu tidak dipakai oleh ON CONFLICT dan
--    bisa membingungkan; hapus bila masih ada (constraint di atas sudah
--    menyediakan unique index versi plain-column).
drop index if exists public.category_budgets_user_cat_month_uniq;

-- 5) Segarkan schema cache PostgREST agar constraint langsung dikenali.
notify pgrst, 'reload schema';
