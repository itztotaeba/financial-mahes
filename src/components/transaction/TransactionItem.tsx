"use client";

/**
 * Baris transaksi yang dipakai di Dashboard (daftar terakhir) dan halaman Transaksi.
 * Menampilkan ikon kategori (lucide), catatan, tanggal, nominal berwarna + aksi edit/hapus.
 */
import { Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { CATEGORY_MAP } from "@/types";
import { cn, formatIDR, formatDate } from "@/lib/utils";

export function TransactionItem({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}) {
  const cat = CATEGORY_MAP[tx.category] ?? CATEGORY_MAP.lainnya;
  const isIncome = tx.type === "income";

  return (
    <div className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/60">
      {/* Ikon kategori — tile kaca dengan warna kategori */}
      <span
        className="glass-chip !gap-0 grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
        style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
      >
        <cat.icon size={18} strokeWidth={2.2} />
      </span>

      {/* Detail */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{tx.note || cat.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-ink">
          {cat.label} · {formatDate(tx.date)}
        </p>
      </div>

      {/* Nominal */}
      <p
        className={cn(
          "shrink-0 text-sm font-bold tabular-nums",
          isIncome ? "text-income" : "text-expense"
        )}
      >
        {isIncome ? "+" : "−"}
        {formatIDR(tx.amount)}
      </p>

      {/* Aksi */}
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(tx)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-ink hover:bg-primary/10 hover:text-primary"
              aria-label="Edit transaksi"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(tx.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-ink hover:bg-expense/10 hover:text-expense"
              aria-label="Hapus transaksi"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
