import type { Transaction } from "@/types";

/** Kunci penyimpanan lokal. */
const STORAGE_KEY = "financial-mahes:transactions";

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
};

/**
 * Dummy data realistis (Rupiah) yang tersebar dalam 30 hari terakhir,
 * agar dashboard langsung terlihat hidup saat pertama kali dijalankan.
 */
export function generateDummyData(): Transaction[] {
  const today = new Date();
  const iso = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const rows: Array<[number, "income" | "expense", number, string, string]> = [
    [0, "expense", 25000, "makan", "Bubur ayam pagi"],
    [0, "expense", 40000, "transport", "Ojek online ke kantor"],
    [1, "expense", 78000, "makan", "Makan siang di kantin"],
    [1, "expense", 150000, "hiburan", "Nonton bioskop"],
    [2, "income", 2500000, "freelance", "Invoice proyek landing page"],
    [2, "expense", 65000, "belanja", "Kebutuhan dapur"],
    [3, "expense", 35000, "transport", "Bensin motor"],
    [4, "expense", 120000, "tagihan", "Pulsa & kuota internet"],
    [5, "expense", 95000, "makan", "Kopi + pastry bareng teman"],
    [6, "income", 1500000, "investasi", "Dividen reksadana"],
    [6, "expense", 210000, "kesehatan", "Vitamin & suplemen"],
    [7, "expense", 55000, "makan", "Batagor & es teh"],
    [8, "expense", 300000, "hiburan", "Langganan Spotify + Netflix"],
    [9, "expense", 175000, "belanja", "Sabun, shampoo, tisu"],
    [10, "income", 8500000, "gaji", "Gaji bulanan Oktober"],
    [10, "expense", 1500000, "tagihan", "Listrik & air"],
    [11, "expense", 42000, "transport", "Kereta Commuter"],
    [12, "expense", 88000, "makan", "Sate ayam malam"],
    [13, "expense", 250000, "pendidikan", "Buku self-development"],
    [14, "expense", 30000, "makan", "Seblak favorit"],
    [15, "income", 1200000, "freelance", "Desain menu UMKM"],
    [15, "expense", 150000, "hiburan", "Concert mingguan"],
    [16, "expense", 60000, "transport", "Parkir + cuci motor"],
    [17, "expense", 130000, "makan", "Ramen setelah kerja"],
    [18, "expense", 450000, "belanja", "Kemeja kerja baru"],
    [19, "expense", 70000, "kesehatan", "Obat flu"],
    [20, "expense", 35000, "makan", "Sarapan nasi uduk"],
    [21, "income", 500000, "hadiah", "Cashback e-wallet"],
    [21, "expense", 200000, "tagihan", "Cicilan paylater"],
    [22, "expense", 95000, "hiburan", "Game mobile top-up"],
    [23, "expense", 120000, "makan", "Makan malam keluarga"],
    [24, "expense", 48000, "transport", "Taksi pulang malam"],
    [25, "expense", 260000, "belanja", "Skincare bulanan"],
    [26, "expense", 80000, "makan", "Warung tegal siang"],
    [27, "income", 3000000, "freelance", "Maintenance website klien"],
    [27, "expense", 145000, "pendidikan", "Kursus online modul 3"],
    [28, "expense", 52000, "makan", "Bubble tea"],
    [29, "expense", 180000, "tagihan", "Iuran internet RT"],
  ];

  return rows.map(([offset, type, amount, category, note], i) => ({
    id: `dummy-${i}-${Date.now()}`,
    type,
    amount,
    category,
    date: iso(offset),
    note,
    created_at: new Date().toISOString(),
  }));
}
