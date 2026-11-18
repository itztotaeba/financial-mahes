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

/**
 * Batas anggaran bulanan per kategori pengeluaran.
 */
export interface CategoryBudget {
  category: string;
  amount: number; // nominal batas bulanan
  month?: string; // "YYYY-MM" (opsional, jika tidak ada berlaku sebagai standar bulanan)
}

/**
 * Status kalkulasi anggaran suatu kategori pada bulan tertentu.
 */
export interface BudgetStatus {
  category: string;
  categoryLabel: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  /**
   * Indikator warna:
   * - safe: <= 70% (Hijau)
   * - warning: 71-90% (Kuning)
   * - danger: > 90% (Merah)
   */
  status: "safe" | "warning" | "danger";
  statusColor: string; // "#4FB279" | "#F59E0B" | "#D3534C"
  statusLabel: string; // "Aman" | "Mendekati Batas" | "Peringatan" | "Melebihi Anggaran"
  /**
   * Level alert:
   * - soft: 80% - 89.99%
   * - prominent: 90% - 99.99%
   * - over: >= 100%
   */
  alertLevel: "none" | "soft" | "prominent" | "over";
}

/**
 * Data tujuan tabungan (Savings Goal).
 */
export interface SavingsGoal {
  id: string; // UUID
  name: string; // nama tujuan (mis. "Dana Darurat", "Beli Laptop")
  targetAmount: number; // jumlah target
  currentAmount: number; // jumlah yang sudah terkumpul
  targetDate?: string; // tanggal target (opsional, "YYYY-MM-DD")
  color?: string; // hex warna opsional
  created_at?: string;
  updated_at?: string;
}

/**
 * Kemajuan dan estimasi tujuan tabungan.
 */
export interface SavingsGoalProgress {
  goal: SavingsGoal;
  remainingAmount: number;
  progressPercentage: number;
  isCompleted: boolean;
  estimatedCompletionText: string;
}

/**
 * Data perbandingan periode.
 */
export interface PeriodSummary {
  periodKey: string; // "YYYY-MM"
  periodLabel: string; // e.g. "November 2026"
  shortLabel: string; // e.g. "Nov 26"
  income: number;
  expense: number;
  net: number;
}

export interface PeriodComparisonData {
  current: PeriodSummary; // Bulan ini
  prevMonth: PeriodSummary; // Bulan lalu
  sameMonthLastYear: PeriodSummary; // Bulan sama tahun lalu
  // Perubahan Bulan Ini vs Bulan Lalu (MoM)
  momIncomeDiff: number;
  momIncomePct: number;
  momExpenseDiff: number;
  momExpensePct: number;
  // Perubahan Bulan Ini vs Tahun Lalu (YoY)
  yoyIncomeDiff: number;
  yoyIncomePct: number;
  yoyExpenseDiff: number;
  yoyExpensePct: number;
}

