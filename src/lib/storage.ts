import type { Transaction, CategoryBudget, SavingsGoal } from "@/types";

/** Kunci penyimpanan lokal. */
const STORAGE_KEY = "financial-mahes:transactions";
const BUDGETS_KEY = "financial-mahes:budgets";
const GOALS_KEY = "financial-mahes:savings-goals";
/** Penanda bahwa kekosongan data adalah pilihan user (bukan pengguna baru),
 *  agar dummy data tidak dimunculkan lagi saat hydrate berikutnya. */
const EMPTY_FLAG_KEY = "financial-mahes:intentionally-empty";
/** Stempel waktu (epoch ms) sinkronisasi cloud terakhir — dipakai untuk
 *  deteksi perubahan antar-device (pull-on-load + Supabase Realtime). */
const SYNC_TS_KEY = "financial-mahes:last-synced-at";

/**
 * Nilai batas anggaran bulanan bawaan (default) saat pertama kali dipakai.
 */
export const DEFAULT_CATEGORY_BUDGETS: CategoryBudget[] = [
  { category: "makan", amount: 1500000 },
  { category: "transport", amount: 600000 },
  { category: "tagihan", amount: 800000 },
  { category: "belanja", amount: 1000000 },
  { category: "hiburan", amount: 500000 },
  { category: "kesehatan", amount: 400000 },
  { category: "pendidikan", amount: 500000 },
  { category: "lainnya", amount: 300000 },
];

/**
 * Contoh tujuan tabungan awal yang menarik & relevan.
 */
export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: "goal-dana-darurat",
    name: "Dana Darurat (3 Bulan)",
    targetAmount: 15000000,
    currentAmount: 6500000,
    targetDate: "2027-06-30",
    color: "#2141E0",
  },
  {
    id: "goal-liburan",
    name: "Liburan Akhir Tahun",
    targetAmount: 5000000,
    currentAmount: 3200000,
    targetDate: "2026-12-25",
    color: "#F59E0B",
  },
];

/**
 * Helper localStorage — seluruh operasi dibungkus try/catch agar aplikasi
 * tetap berjalan pada mode privat / storage penuh.
 */
export const localStorageHelpers = {
  load(): Transaction[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
    } catch {
      return [];
    }
  },

  save(transactions: Transaction[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      /* abaikan error kuota storage */
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  },

  loadBudgets(): CategoryBudget[] {
    if (typeof window === "undefined") return DEFAULT_CATEGORY_BUDGETS;
    try {
      const raw = window.localStorage.getItem(BUDGETS_KEY);
      if (!raw) return DEFAULT_CATEGORY_BUDGETS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CategoryBudget[]) : DEFAULT_CATEGORY_BUDGETS;
    } catch {
      return DEFAULT_CATEGORY_BUDGETS;
    }
  },

  saveBudgets(budgets: CategoryBudget[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    } catch {
      /* noop */
    }
  },

  loadGoals(): SavingsGoal[] {
    if (typeof window === "undefined") return DEFAULT_SAVINGS_GOALS;
    try {
      const raw = window.localStorage.getItem(GOALS_KEY);
      if (!raw) return DEFAULT_SAVINGS_GOALS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavingsGoal[]) : DEFAULT_SAVINGS_GOALS;
    } catch {
      return DEFAULT_SAVINGS_GOALS;
    }
  },

  saveGoals(goals: SavingsGoal[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch {
      /* noop */
    }
  },

  /** Tandai: data kosong adalah keputusan user, jangan munculkan dummy lagi. */
  markIntentionallyEmpty(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(EMPTY_FLAG_KEY, "1");
    } catch {
      /* noop */
    }
  },

  clearIntentionallyEmpty(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(EMPTY_FLAG_KEY);
    } catch {
      /* noop */
    }
  },

  isIntentionallyEmpty(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(EMPTY_FLAG_KEY) === "1";
    } catch {
      return false;
    }
  },

  /** Simpan stempel waktu sync cloud terakhir (dipanggil setelah pull/push sukses). */
  setLastSyncedAt(ts: number): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SYNC_TS_KEY, String(ts));
    } catch {
      /* noop */
    }
  },

  /** Baca stempel waktu sync terakhir; 0 bila belum pernah. */
  getLastSyncedAt(): number {
    if (typeof window === "undefined") return 0;
    try {
      return Number(window.localStorage.getItem(SYNC_TS_KEY)) || 0;
    } catch {
      return 0;
    }
  },
};

