import type { Transaction } from "@/types";

/** Kunci penyimpanan lokal. */
const STORAGE_KEY = "financial-mahes:transactions";
/** Penanda bahwa kekosongan data adalah pilihan user (bukan pengguna baru),
 *  agar dummy data tidak dimunculkan lagi saat hydrate berikutnya. */
const EMPTY_FLAG_KEY = "financial-mahes:intentionally-empty";
/** Stempel waktu (epoch ms) sinkronisasi cloud terakhir — dipakai untuk
 *  deteksi perubahan antar-device (pull-on-load + Supabase Realtime). */
const SYNC_TS_KEY = "financial-mahes:last-synced-at";

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
