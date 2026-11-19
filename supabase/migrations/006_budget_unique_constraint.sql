-- =============================================================
-- financial-mahes: Unique constraint untuk category_budgets
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempotent: aman dijalankan berkali-kali.
-- =============================================================

-- Tambahkan unique index agar upsert (user_id, category, month) bisa bekerja.
-- Gunakan COALESCE agar NULL month diperlakukan sama dengan '' (satu default per kategori per user).
create unique index if not exists category_budgets_user_cat_month_uniq
  on public.category_budgets (user_id, category, coalesce(month, ''));

-- Segarkan schema cache PostgREST
notify pgrst, 'reload schema';
