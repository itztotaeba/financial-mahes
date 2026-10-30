"use client";

/**
 * Halaman Transaksi: daftar penuh + pencarian + filter tipe/kategori.
 */
import { useMemo, useState } from "react";
import { Plus, Search, PenLine } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { openMobileMenu } from "@/lib/menu";
import { Card, Button, Input } from "@/components/ui/primitives";
import { TransactionItem } from "@/components/transaction/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFinanceStore } from "@/store/useFinanceStore";
import { CATEGORY_MAP } from "@/types";
import { cn, formatIDR } from "@/lib/utils";

type TypeFilter = "all" | "income" | "expense";

export default function TransaksiPage() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const transactions = useFinanceStore((s) => s.transactions);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Daftar kategori yang benar-benar dipakai user (untuk dropdown filter).
  const usedCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))),
    [transactions]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .filter((t) => {
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
        if (q) {
          const cat = CATEGORY_MAP[t.category]?.label ?? "";
          if (!`${t.note} ${cat}`.toLowerCase().includes(q)) return false;
        }
        return true;
      });
  }, [transactions, query, typeFilter, categoryFilter]);

  // Ringkasan hasil filter — membantu scanning cepat.
  const filteredTotals = useMemo(() => {
    let income = 0,
      expense = 0;
    for (const t of filtered) t.type === "income" ? (income += t.amount) : (expense += t.amount);
    return { income, expense };
  }, [filtered]);


  return (
    <>
      <Header title="Transaksi" subtitle="Kelola seluruh catatan keuangan" onMenuClick={openMobileMenu} />

      {!hydrated ? (
        <div className="grid min-h-[50vh] place-items-center text-sm text-muted-ink">
          Memuat data lokal…
        </div>
      ) : (
        <div className="space-y-4 pb-20 lg:pb-4">
          {/* Toolbar: pencarian + filter */}
          <Card className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-ink"
                />
                <Input
                  placeholder="Cari catatan atau kategori…"
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => window.openTransactionModal?.()}>
                <Plus size={16} /> Tambah Transaksi
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter tipe */}
              {(
                [
                  ["all", "Semua"],
                  ["income", "Pemasukan"],
                  ["expense", "Pengeluaran"],
                ] as [TypeFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                    typeFilter === value
                      ? value === "income"
                        ? "bg-income text-white"
                        : value === "expense"
                          ? "bg-expense text-white"
                          : "bg-primary text-white"
                      : "bg-white/60 text-ink/55 hover:bg-white/90"
                  )}
                >
                  {label}
                </button>
              ))}

              {/* Filter kategori */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-pill ml-auto rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink/70 outline-none focus:border-primary/50"
              >
                <option value="all">Semua kategori</option>
                {usedCategories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_MAP[c]?.label ?? c}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-ink">
              Menampilkan <b className="font-data">{filtered.length}</b> transaksi · Pemasukan{" "}
              <b className="font-data text-income">{formatIDR(filteredTotals.income)}</b> · Pengeluaran{" "}
              <b className="font-data text-expense">{formatIDR(filteredTotals.expense)}</b>
            </p>
          </Card>

          {/* Daftar transaksi */}
          <Card>
            {filtered.length === 0 ? (
              transactions.length === 0 ? (
                // User benar-benar baru: sambut dengan onboarding.
                <EmptyState
                  icon={<PenLine size={26} />}
                  title="Halaman masih kosong"
                  description="Mulai tulis ceritamu hari ini. Satu catatan pengeluaran atau pemasukan sudah cukup untuk menghidupkan dashboard-mu."
                  actionLabel="Tambah Transaksi"
                  onAction={() => window.openTransactionModal?.()}
                />
              ) : (
                // Ada data, tapi tidak cocok dengan filter aktif.
                <p className="py-12 text-center text-sm text-muted-ink">
                  Tidak ada transaksi yang cocok dengan filter.
                </p>
              )
            ) : (
              <ul className="divide-y divide-black/5">
                {filtered.map((tx) => (
                  <li key={tx.id}>
                    <TransactionItem
                      tx={tx}
                      onEdit={(t) => window.openTransactionModal?.(t)}
                      onDelete={(id) => {
                        if (confirm("Hapus transaksi ini?")) deleteTransaction(id);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
