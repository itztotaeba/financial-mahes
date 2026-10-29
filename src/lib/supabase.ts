import type { Transaction } from "@/types";

/** Konfigurasi Supabase dari environment variables client-side. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Apakah env Supabase tersedia? (menentukan fitur cloud bisa dipakai) */
export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Payload untuk upsert satu transaksi ke tabel `transactions`. */
export function toSupabasePayload(t: Transaction) {
  return {
    id: t.id,
    type: t.type,
    amount: Math.round(t.amount),
    category: t.category,
    date: t.date,
    note: t.note ?? "",
  };
}

/** Baris Supabase -> objek Transaction aplikasi. */
export function fromSupabaseRow(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    type: row.type === "income" ? "income" : "expense",
    amount: Number(row.amount) || 0,
    category: String(row.category ?? "lainnya"),
    date: String(row.date ?? ""),
    note: String(row.note ?? ""),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}
