"use client";

/**
 * Modal form Tambah/Edit transaksi.
 * Field: tipe, nominal, kategori (dinamis sesuai tipe), tanggal, catatan.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Transaction, TransactionType } from "@/types";
import { CATEGORY_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/types";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Button, Input, Label } from "@/components/ui/primitives";
import { cn, nowLocalInput } from "@/lib/utils";

/** Normalisasi nilai tanggal lama ("YYYY-MM-DD") utk input datetime-local. */
function toDatetimeLocal(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`;
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) return value.slice(0, 16).replace(" ", "T");
  return nowLocalInput(); // nilai tak dikenal -> pakai sekarang (hindari "Invalid date")
}

interface Props {
  open: boolean;
  /** Jika null → mode tambah; jika terisi → mode edit. */
  editing: Transaction | null;
  onClose: () => void;
}

export function TransactionModal({ open, editing, onClose }: Props) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("makan");
  const [date, setDate] = useState(nowLocalInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset / isi form setiap kali modal dibuka.
  useEffect(() => {
    if (!open) return;
    setError("");
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(toDatetimeLocal(editing.date));
      setNote(editing.note);
    } else {
      setType("expense");
      setAmount("");
      setCategory("makan");
      setDate(nowLocalInput());
      setNote("");
    }
  }, [open, editing]);

  if (!open) return null;

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  /** Saat berganti tipe, pastikan kategori valid untuk tipe tersebut. */
  const switchType = (t: TransactionType) => {
    setType(t);
    const valid = t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!valid.includes(category)) setCategory(valid[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(/[^\d]/g, ""));
    if (!value || value <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }
    // Validasi datetime — cegah nilai kosong/tak valid tersimpan ("Invalid date").
    let finalDate = date ? date.slice(0, 16).replace(" ", "T") : "";
    if (!finalDate || Number.isNaN(new Date(finalDate).getTime())) {
      finalDate = nowLocalInput();
    }
    setSaving(true);
    const payload = { type, amount: value, category, date: finalDate, note: note.trim() };
    if (editing) await updateTransaction(editing.id, payload);
    else await addTransaction(payload);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      {/* overlay — gelap + blur khas iOS sheet */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" onClick={onClose} aria-hidden />

      {/* Sheet liquid glass: bening di mobile (sheet), mengambang di desktop */}
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-white p-6 shadow-soft-lg thin-scrollbar sm:rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink hover:bg-[#FAFAF9]"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-extrabold text-ink">
          {editing ? "Edit Transaksi" : "Tambah Transaksi"}
        </h2>
        <p className="mb-5 mt-0.5 text-xs text-muted-ink">
          Data tersimpan otomatis {useFinanceStore.getState().userId ? "ke cloud & lokal" : "secara lokal"}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle tipe */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F7F7F5] p-1.5 border border-line">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-bold transition-all",
                  type === t
                    ? t === "income"
                      ? "bg-income text-white shadow"
                      : "bg-expense text-white shadow"
                    : "text-muted-ink hover:text-black"
                )}
              >
                {t === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          {/* Nominal */}
          <div>
            <Label>Nominal (Rupiah)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-ink">
                Rp
              </span>
              <Input
                inputMode="numeric"
                placeholder="0"
                className="font-data pl-9 font-semibold tabular-nums"
                value={amount ? Number(amount.replace(/[^\d]/g, "")).toLocaleString("id-ID") : ""}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>

          {/* Kategori */}
          <div>
            <Label>Kategori</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const info = CATEGORY_MAP[c];
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97]",
                      active
                        ? "border-transparent text-white shadow-soft"
                        : "border-line bg-white text-ink/60 hover:bg-[#FAFAF9]"
                    )}
                    style={active ? { backgroundColor: info.color } : undefined}
                  >
                    <info.icon size={14} strokeWidth={2.2} style={{ color: active ? "#fff" : info.color }} />
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tanggal + Waktu + Catatan */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Tanggal &amp; Waktu</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Catatan</Label>
              <Input
                placeholder="cth: Makan siang"
                maxLength={80}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-expense">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Tambah Transaksi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
