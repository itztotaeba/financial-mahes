import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind secara aman (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format angka menjadi Rupiah: Rp1.250.000 (Intl.NumberFormat id-ID). */
export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format singkat untuk label grafik: Rp1,2 jt / Rp15 rb. */
export function formatIDRCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (Math.abs(value) >= 1_000)
    return `Rp${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return formatIDR(value);
}

/**
 * Parse string tanggal aplikasi menjadi Date dengan TOLERAN:
 * - "YYYY-MM-DD"              -> tengah malam lokal
 * - "YYYY-MM-DDTHH:mm"        -> waktu lokal persis (tanpa pergeseran UTC)
 * - ISO penuh dgn zona ("...Z", "+07:00") -> sesuai zona tsb
 - lainnya -> new Date(isi string). Mengembalikan null bila tidak valid.
 */
export function parseDate(iso: string): Date | null {
  if (!iso || typeof iso !== "string") return null;
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    d = new Date(`${iso}T00:00:00`); // tanpa Z -> zona lokal, aman DST
  } else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(iso) && !/[zZ+]/.test(iso.slice(10))) {
    d = new Date(iso.replace(" ", "T")); // local datetime "YYYY-MM-DDTHH:mm"
  } else {
    d = new Date(iso);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Ambil bagian tanggal "YYYY-MM-DD" dari string manapun yang didukung. */
export function dateOnly(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Format tanggal panjang: "Sen, 27 Okt 2026". */
export function formatDate(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "-";
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format tanggal + jam: "Sen, 27 Okt 2026 · 14.30". */
export function formatDateTime(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(iso)} · ${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** Nilai default input <input type="datetime-local"> untuk "sekarang". */
export function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Tanggal ISO (YYYY-MM-DD) lokal — hindari pergeseran zona waktu UTC. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Tambah offset hari dari sebuah tanggal ISO. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** UUID tanpa dependensi eksternal (aman untuk ID transaksi lokal). */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxxyxxx4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
