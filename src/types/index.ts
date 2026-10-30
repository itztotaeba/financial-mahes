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
  date: string; // Tanggal transaksi — format "YYYY-MM-DDTHH:mm" (local datetime)
  note: string; // Catatan opsional
  /** Waktu input (ISO) — dipakai untuk urutan daftar "terbaru diinput". */
  inputted_at?: string;
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
  gaji: { label: "Gaji", icon: Wallet, color: "#647637" },
  freelance: { label: "Freelance", icon: Laptop, color: "#74864B" },
  investasi: { label: "Investasi", icon: TrendingUp, color: "#A8B08A" },
  hadiah: { label: "Hadiah", icon: Gift, color: "#C6B54F" },
  makan: { label: "Makan & Minum", icon: UtensilsCrossed, color: "#BB622E" },
  transport: { label: "Transportasi", icon: Car, color: "#8C9A5B" },
  hiburan: { label: "Hiburan", icon: Clapperboard, color: "#C08A5E" },
  tagihan: { label: "Tagihan", icon: ReceiptText, color: "#A64B2A" },
  belanja: { label: "Belanja", icon: ShoppingBag, color: "#7E8F57" },
  kesehatan: { label: "Kesehatan", icon: Pill, color: "#9AA86E" },
  pendidikan: { label: "Pendidikan", icon: GraduationCap, color: "#8FA37C" },
  lainnya: { label: "Lainnya", icon: Package, color: "#B4B2A0" },
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
