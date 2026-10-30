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

import {
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
  UtensilsCrossed,
  Car,
  Clapperboard,
  ReceiptText,
  ShoppingBag,
  Pill,
  GraduationCap,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface CategoryInfo {
  label: string;
  icon: LucideIcon; // ikon lucide-react pengganti emoji
  color: string; // warna hex untuk badge/pie chart
}

/** Katalog kategori bawaan (bisa dikembangkan lewat Pengaturan). */
export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  gaji: { label: "Gaji", icon: Wallet, color: "#4FB279" },
  freelance: { label: "Freelance", icon: Laptop, color: "#2141E0" },
  investasi: { label: "Investasi", icon: TrendingUp, color: "#C8ACC0" },
  hadiah: { label: "Hadiah", icon: Gift, color: "#8B5CF6" },
  makan: { label: "Makan & Minum", icon: UtensilsCrossed, color: "#F59E0B" },
  transport: { label: "Transportasi", icon: Car, color: "#3B82F6" },
  hiburan: { label: "Hiburan", icon: Clapperboard, color: "#EC4899" },
  tagihan: { label: "Tagihan", icon: ReceiptText, color: "#D3534C" },
  belanja: { label: "Belanja", icon: ShoppingBag, color: "#14B8A6" },
  kesehatan: { label: "Kesehatan", icon: Pill, color: "#22C55E" },
  pendidikan: { label: "Pendidikan", icon: GraduationCap, color: "#6366F1" },
  lainnya: { label: "Lainnya", icon: Package, color: "#9CA3AF" },
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
