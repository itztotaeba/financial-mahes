import type { Transaction } from "@/types";

/** Konfigurasi Supabase dari environment variables client-side. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Apakah env Supabase tersedia? (menentukan fitur cloud bisa dipakai) */
export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Payload untuk insert/upsert satu transaksi ke tabel `transactions`.
 * PENTING: `id` lokal TIDAK ikut dikirim — id dummy lokal (mis. "dummy-3-…")
 * bukan UUID valid, sehingga PostgREST akan gagal meng-cast ke kolom `id uuid`
 * dan menolak seluruh baris (error 400). Biarkan database yang membuat UUID.
 *
 * Catatan tipe: kolom DB `date` bertipe `date` (Postgres menolak nilai
 * datetime penuh), jadi kita KIRIM tanggalnya saja; jam/menit dititipkan di
 * kolom `note` dengan penanda tak kasat mata `⟦HH:mm⟧` yang dibersihkan saat
 * dibaca (`fromSupabaseRow`) lalu digabungkan kembali ke `date` lokal.
 * Dengan begini tidak perlu migrasi skema apa pun.
 */

/** Penanda internal untuk menit jam pada note cloud. */
const TIME_MARK = "\u27e6"; // ⟦HH:mm⟧
const INPUT_MARK = "\u27e8"; // ⟨epochMs⟩

export function toSupabasePayload(t: Transaction) {
  const d = parseDateLocalish(t.date);
  let note = t.note ?? "";
  if (d && hasTimePart(t.date)) {
    const pad = (n: number) => String(n).padStart(2, "0");
    note += `${TIME_MARK}${pad(d.getHours())}:${pad(d.getMinutes())}\u27e9`;
  }
  // Titipkan waktu input (epoch ms) di note cloud supaya urutan daftar
  // "terbaru diinput" tetap konsisten setelah tarik-ulang dari cloud —
  // payload ini tidak memuat created_at/inputted_at, jadi tanpa penanda ini
  // hasil pull kehilangan jejak waktu input aslinya.
  const inputMs = Date.parse(t.inputted_at ?? t.created_at ?? "");
  if (!Number.isNaN(inputMs)) {
    note += `${INPUT_MARK}${inputMs}\u27e9`;
  }
  return {
    type: t.type,
    amount: Math.round(t.amount),
    category: t.category,
    date: extractDatePart(t.date), // selalu "YYYY-MM-DD" -> aman utk kolom `date`
    note,
    client_id: t.id, // dedup: id lokal disimpan di kolom text `client_id`
  };
}

/** Ambil "YYYY-MM-DD" dari format manapun yang dipakai aplikasi. */
function extractDatePart(s: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s ?? "");
  return m ? m[1] : (s ?? "").slice(0, 10);
}

/** Apakah string memuat bagian jam ("...THH:mm")? */
function hasTimePart(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s ?? "");
}

/** Parse value lokal tanpa Z sebagai waktu lokal (bukan UTC). */
function parseDateLocalish(s: string): Date | null {
  if (!s) return null;
  const d = hasTimePart(s) && !/[zZ]/.test(s) ? new Date(s.replace(" ", "T")) : new Date(`${extractDatePart(s)}T${hasTimePart(s) ? s.slice(11, 16) : "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Apakah sebuah string adalah UUID valid (v4 atau lainnya)? */
export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Baris Supabase -> objek Transaction aplikasi. */
export function fromSupabaseRow(row: Record<string, unknown>): Transaction {
  // note cloud mungkin memuat penanda internal:
  //   "⟦HH:mm⟧"  -> jam transaksi (kolom DB hanya menyimpan tanggal)
  //   "⟨epoch⟩"  -> waktu input asli (untuk urutan daftar yang stabil)
  const rawNote = String(row.note ?? "");
  const timeMatch = /\u27e6(\d{2}):(\d{2})\u27e9/.exec(rawNote);
  const inputMatch = /\u27e8(\d{10,14})\u27e9/.exec(rawNote);
  const note = rawNote.replace(/ ?\u27e6\d{2}:\d{2}\u27e9/g, "").replace(/ ?\u27e8\d{10,14}\u27e9/g, "").trim();

  // Rekonstruksi datetime lokal "YYYY-MM-DDTHH:mm".
  let date = String(row.date ?? "").slice(0, 10);
  if (timeMatch) date += `T${timeMatch[1]}:${timeMatch[2]}`;

  // Waktu input: prioritas penanda di note (waktu input asli saat dibuat),
  // fallback created_at kolom DB (untuk baris yang dibuat via device lain).
  const inputtedIso = inputMatch
    ? new Date(Number(inputMatch[1])).toISOString()
    : row.created_at
      ? String(row.created_at)
      : undefined;

  return {
    id: String(row.id),
    type: row.type === "income" ? "income" : "expense",
    amount: Number(row.amount) || 0,
    category: String(row.category ?? "lainnya"),
    date,
    note,
    inputted_at: inputtedIso,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}
