/**
 * Tipe data inti aplikasi Financial Mahes.
 * Digunakan baik untuk penyimpanan lokal (localStorage) maupun Supabase.
 */

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string; // UUID — dibuat lokal, sama dengan primary key di Supabase
  type: TransactionType;
  amount: number; // Nominal dalam Rupiah (positif)
  category: string; // Kunci kategori, lihat CATEGORY_MAP
  date: string; // Format ISO date (YYYY-MM-DD)
  note: string; // Catatan opsional
  created_at?: string;
  updated_at?: string;
}

export interface CategoryInfo {
  label: string;
  emoji: string;
  color: string; // warna hex untuk badge/pie chart
}

/** Katalog kategori bawaan (bisa dikembangkan lewat Pengaturan). */
export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  gaji: { label: "Gaji", emoji: "💼", color: "#4FB279" },
  freelance: { label: "Freelance", emoji: "🧑‍💻", color: "#2141E0" },
  investasi: { label: "Investasi", emoji: "📈", color: "#C8ACC0" },
  hadiah: { label: "Hadiah", emoji: "🎁", color: "#8B5CF6" },
  makan: { label: "Makan & Minum", emoji: "🍜", color: "#F59E0B" },
  transport: { label: "Transportasi", emoji: "🚗", color: "#3B82F6" },
  hiburan: { label: "Hiburan", emoji: "🎬", color: "#EC4899" },
  tagihan: { label: "Tagihan", emoji: "🧾", color: "#D3534C" },
  belanja: { label: "Belanja", emoji: "🛍️", color: "#14B8A6" },
  kesehatan: { label: "Kesehatan", emoji: "💊", color: "#22C55E" },
  pendidikan: { label: "Pendidikan", emoji: "📚", color: "#6366F1" },
  lainnya: { label: "Lainnya", emoji: "📦", color: "#9CA3AF" },
};

export const INCOME_CATEGORIES = ["gaji", "freelance", "investasi", "hadiah", "lainnya"];
export const EXPENSE_CATEGORIES = [
  "makan",
  "transport",
  "hiburan",
  "tagihan",
  "belanja",
  "kesehatan",
  "pendidikan",
  "lainnya",
];
