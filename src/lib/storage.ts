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
/** Penanda bahwa budgets sudah pernah di-pull dari cloud (bukan nilai default). */
const BUDGETS_SYNCED_KEY = "financial-mahes:budgets-synced";

/**
 * Nilai batas anggaran bulanan bawaan — TIDAK DIPAKAI LAGI sebagai seed.
 * Mode lokal (user belum login) kini mulai KOSONG total; data hanya masuk
 * ketika user login dan menarik snapshot dari cloud. Konstanta ini hanya
 * dipertahankan untuk keperluan migrasi: mengenali cache sisa versi lama
 * agar bisa dibersihkan (lihat `localStorageHelpers.clearAll()`).
 */
export const LEGACY_DEFAULT_CATEGORY_BUDGETS: CategoryBudget[] = [
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
    // Mode lokal murni: TIDAK ada seed/default — mulai tanpa data apapun.
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(BUDGETS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CategoryBudget[]) : [];
    } catch {
      return [];
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
    // Mode lokal murni: TIDAK ada seed/default — mulai tanpa data apapun.
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(GOALS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavingsGoal[]) : [];
    } catch {
      return [];
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

  /** Tandai bahwa budgets sudah di-pull dari cloud (bukan nilai default lokal). */
  setBudgetsSynced(synced: boolean): void {
    if (typeof window === "undefined") return;
    try {
      if (synced) window.localStorage.setItem(BUDGETS_SYNCED_KEY, "1");
      else window.localStorage.removeItem(BUDGETS_SYNCED_KEY);
    } catch {
      /* noop */
    }
  },

  /** Apakah budgets sudah pernah di-sinkronkan dari cloud? */
  isBudgetsSynced(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(BUDGETS_SYNCED_KEY) === "1";
    } catch {
      return false;
    }
  },

  /**
   * Hapus SEMUA data aplikasi dari localStorage (transaksi, anggaran, target
   * tabungan, beserta seluruh flag/penanda sync). Dipanggil saat logout agar
   * data user sebelumnya tidak tertinggal di perangkat, dan saat hydrate
   * untuk membersihkan cache dummy milik versi lama.
   */
  clearAll(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(BUDGETS_KEY);
      window.localStorage.removeItem(GOALS_KEY);
      window.localStorage.removeItem(EMPTY_FLAG_KEY);
      window.localStorage.removeItem(SYNC_TS_KEY);
      window.localStorage.removeItem(BUDGETS_SYNCED_KEY);
    } catch {
      /* noop */
    }
  },
};

