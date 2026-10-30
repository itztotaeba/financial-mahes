"use client";

/**
 * Baris transaksi yang dipakai di Dashboard (daftar terakhir) dan halaman Transaksi.
 * Menampilkan ikon kategori (lucide), catatan, tanggal, nominal berwarna + aksi edit/hapus.
 */
import { Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { CATEGORY_MAP } from "@/types";
import { cn, formatIDR, formatDateTime, formatDate } from "@/lib/utils";

export function TransactionItem({
  tx,
  onEdit,
  onDelete,
  /**
   * compact = true  → gaya list dashboard "Fresh Earthy":
   *                   nama kategori + catatan, tanggal pendek ("24 Okt 2026"),
   *                   trash kecil hanya saat hover (desktop).
   * compact = false → gaya halaman Transaksi (default, tidak berubah):
   *                   catatan/nama, kategori · tanggal+jam, aksi selalu tampil di mobile.
   */
  compact = false,
}: {
  tx: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  const cat = CATEGORY_MAP[tx.category] ?? CATEGORY_MAP.lainnya;
  const isIncome = tx.type === "income";

  return (
    <div className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-[#FAFAF9]">
      {/* Ikon kategori — tile kaca dengan warna kategori */}
      <span
        className="glass-chip !gap-0 grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
        style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
      >
        <cat.icon size={18} strokeWidth={2.2} />
      </span>

      {/* Detail — compact (dashboard): Nama Kategori + catatan, tanggal pendek.
          default (halaman Transaksi): catatan/nama, kategori · tanggal+jam. */}
      <div className="min-w-0 flex-1">
        {compact ? (
          <>
            <p className="truncate text-sm font-semibold text-ink">{cat.label}</p>
            <p className="mt-0.5 truncate text-xs text-muted-ink">
              {tx.note ? `${tx.note} · ` : ""}
              <span className="font-data tabular-nums">{formatDate(tx.date)}</span>
            </p>
          </>
        ) : (
          <>
            <p className="truncate text-sm font-semibold text-ink">{tx.note || cat.label}</p>
            <p className="mt-0.5 truncate text-xs text-muted-ink">
              {cat.label} · <span className="font-data tabular-nums">{formatDateTime(tx.date)}</span>
            </p>
          </>
        )}
      </div>

      {/* Nominal (hijau income / oranye expense — palet earthy) */}
      <p
        className={cn(
          "font-data shrink-0 text-sm font-bold tabular-nums",
          isIncome ? "text-income" : "text-expense"
        )}
      >
        {isIncome ? "+" : "−"}
        {formatIDR(tx.amount)}
      </p>

      {/* Aksi:
          - compact (dashboard): trash kecil MUNCUL SAAT HOVER saja (desktop);
            di mobile tetap selalu tampil agar bisa disentuh tanpa long-press.
          - default (halaman Transaksi): edit+hapus selalu tampil di mobile,
            hover-reveal di desktop (perilaku lama, tidak berubah). */}
      {(onEdit || onDelete) && (
        <div
          className={cn(
            "flex shrink-0 gap-1 transition-opacity",
            compact
              ? "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          )}
        >
          {onEdit && (
            <button
              onClick={() => onEdit(tx)}
              className={cn(
                "grid place-items-center rounded-xl text-muted-ink transition-colors hover:bg-income/10 hover:text-income active:scale-95",
                compact ? "h-8 w-8" : "h-9 w-9"
              )}
              aria-label="Edit transaksi"
            >
              <Pencil size={compact ? 13 : 15} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(tx.id)}
              className={cn(
                "grid place-items-center rounded-xl text-muted-ink transition-colors hover:bg-expense/10 hover:text-expense active:scale-95",
                compact ? "h-8 w-8" : "h-9 w-9"
              )}
              aria-label="Hapus transaksi"
            >
              <Trash2 size={compact ? 13 : 15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
