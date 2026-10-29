"use client";

/**
 * Halaman Dashboard — grid utama sesuai referensi Casha:
 * [Kartu Ringkasan] → [Red Flag] → [Cashflow 30 hari | Wawasan Kategori] → [Transaksi Terakhir].
 */
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RedFlagAlert } from "@/components/dashboard/RedFlagAlert";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { CategoryPie } from "@/components/charts/CategoryPie";
import { TransactionItem } from "@/components/transaction/TransactionItem";
import { Card, Button } from "@/components/ui/primitives";
import { useDashboardData } from "@/lib/selectors";
import { useFinanceStore } from "@/store/useFinanceStore";

import { openMobileMenu } from "@/lib/menu";

export default function DashboardPage() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const { summary, cashflow, categories, recent } = useDashboardData();

  return (
    <>
      <Header title="Dashboard" subtitle="Ringkasan keuangan Anda" onMenuClick={openMobileMenu} />

      {!hydrated ? (
        <div className="grid min-h-[50vh] place-items-center text-sm text-black/40">
          Memuat data lokal…
        </div>
      ) : (
        <div className="space-y-4 pb-20 lg:pb-4">
          {/* Kartu ringkasan */}
          <SummaryCards summary={summary} />

          {/* Indikator red flag */}
          <RedFlagAlert summary={summary} />

          {/* Grafik + wawasan perilaku */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <CashflowChart data={cashflow} />
            </div>
            <div className="xl:col-span-2">
              <CategoryPie data={categories} />
            </div>
          </div>

          {/* Transaksi terakhir + aksi tambah/edit/hapus */}
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#151516]">Transaksi Terakhir</h2>
                <p className="text-xs text-black/45">7 aktivitas terbaru</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/transaksi">
                  <Button variant="ghost" className="px-3 text-xs">
                    Lihat semua <ArrowRight size={14} />
                  </Button>
                </Link>
                <Button onClick={() => window.openTransactionModal?.()} className="px-3.5">
                  <Plus size={16} />
                  <span className="hidden sm:inline">Tambah</span>
                </Button>
              </div>
            </div>

            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-black/40">
                Belum ada transaksi. Klik “Tambah” untuk mulai mencatat.
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {recent.map((tx) => (
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
