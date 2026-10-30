"use client";

/**
 * DashboardPage — halaman utama "Fresh Earthy Minimalism".
 * ---------------------------------------------------------------------------
 * Struktur (grid responsif: 1 kolom mobile → 2/3 kolom desktop):
 *  1. Header Section     : ucapan selamat datang + CTA "Catat Transaksi"
 *  2. Summary Cards      : Saldo / Pemasukan / Pengeluaran (motion staggered)
 *  3. Red Flag           : peringatan bila pengeluaran > 80% pemasukan
 *  4. Arus Kas           : AreaChart gradient olive (CashflowArea)
 *  5. Wawasan Perilaku   : donut distribusi kategori palet earthy
 *  6. Transaksi Terakhir : list bersih dengan border tipis #E5E5E0
 *
 * PENTING: file ini HANYA menampilkan data — seluruh logic keuangan
 * (store Zustand, localStorage, sync Supabase, CRUD) tetap seperti semula
 * dan dibaca lewat selector `useDashboardData()` yang sudah ada.
 */
import { motion } from "framer-motion";
import { Plus, ArrowRight, ReceiptText, Sprout } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RedFlagAlert } from "@/components/dashboard/RedFlagAlert";
import { CashflowArea } from "@/components/charts/CashflowArea";
import { CategoryPie } from "@/components/charts/CategoryPie";
import { TransactionItem } from "@/components/transaction/TransactionItem";
import { Card, Button } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboardData } from "@/lib/selectors";
import { useFinanceStore } from "@/store/useFinanceStore";

import { openMobileMenu } from "@/lib/menu";

/** Helper animasi masuk seragam (upbeat tapi halus). */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export default function DashboardPage() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const isEmpty = useFinanceStore((s) => s.transactions.length === 0);
  const email = useFinanceStore((s) => s.email);
  const userId = useFinanceStore((s) => s.userId);
  const { summary, cashflow, categories, recent } = useDashboardData();

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={
          isEmpty
            ? "Waktunya menulis cerita finansialmu — mulai dari satu catatan."
            : "Ringkasan keuangan Anda"
        }
        onMenuClick={openMobileMenu}
      />

      {!hydrated ? (
        <div className="grid min-h-[50vh] place-items-center text-sm text-muted-ink">
          Memuat data lokal…
        </div>
      ) : (
        <div className="space-y-4 pb-20 lg:pb-4 sm:space-y-5">
          {/* ── 1. Header Section: papan sambutan untuk akun yang belum punya catatan ── */}
          {isEmpty && (
            <motion.div {...fadeUp(0)}>
              <Card className="border-income/20 bg-gradient-to-r from-[#F4F6EC] via-[#FBFAF2] to-[#FAF3EC]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
                      {userId
                        ? `Selamat datang kembali, ${email?.split("@")[0]}`
                        : "Selamat datang di Financial Mahes"}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-ink">
                      Setiap rupiah punya cerita. Mulai catat pengeluaran & pemasukan pertamamu hari
                      ini — dalam 30 detik, grafik dan wawasan keuanganmu langsung tumbuh.
                    </p>
                  </div>
                  {/* Tombol primary earthy + hover scale halus (Framer Motion) */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.openTransactionModal?.()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#647637] px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#74864B]"
                  >
                    <Plus size={16} /> Catat Transaksi Pertama
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── 2. Kartu ringkasan (motion staggered di dalam komponen) ── */}
          <SummaryCards summary={summary} />

          {/* ── 3. Indikator red flag ── */}
          <motion.div {...fadeUp(0.1)}>
            <RedFlagAlert summary={summary} />
          </motion.div>

          {/* ── 4 & 5. Grafik arus kas + wawasan perilaku ── */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-5">
            <motion.div className="xl:col-span-3" {...fadeUp(0.16)}>
              <Card className="h-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-ink">Arus Kas</h2>
                    <p className="text-xs text-muted-ink">Tren harian · 30 hari terakhir</p>
                  </div>
                  <span className="rounded-full bg-income/10 px-3 py-1 text-xs font-semibold text-income">
                    Harian
                  </span>
                </div>

                {/* Legenda kecil ala kartu earthy */}
                <div className="mb-3 flex items-center gap-4 text-xs font-medium text-muted-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#647637]" /> Pemasukan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#BB622E]" /> Pengeluaran
                  </span>
                </div>

                {cashflow.every((d) => d.income === 0 && d.expense === 0) ? (
                  /* Empty state chart agar dashboard tidak terlihat "mati" */
                  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-[#FAFAF9] text-center sm:h-72">
                    <Sprout size={28} className="text-muted" />
                    <p className="max-w-[220px] text-sm font-semibold text-ink">
                      Grafikmu akan tumbuh di sini
                    </p>
                    <p className="max-w-[260px] text-xs leading-relaxed text-muted-ink">
                      Setelah transaksi pertama tercatat, tren 30 hari langsung tergambar otomatis.
                    </p>
                  </div>
                ) : (
                  <CashflowArea data={cashflow} />
                )}
              </Card>
            </motion.div>

            <motion.div className="xl:col-span-2" {...fadeUp(0.22)}>
              {categories.length === 0 ? (
                <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
                    <Sprout size={24} />
                  </span>
                  <p className="text-sm font-bold text-ink">Wawasan menanti datamu</p>
                  <p className="max-w-[240px] text-xs leading-relaxed text-muted-ink">
                    Distribusi kategori (Makan, Transport, Tagihan, dll.) muncul begitu pengeluaran
                    pertamamu tercatat.
                  </p>
                </Card>
              ) : (
                <CategoryPie data={categories} />
              )}
            </motion.div>
          </div>

          {/* ── 6. Transaksi terakhir + aksi tambah/edit/hapus ── */}
          <motion.div {...fadeUp(0.28)}>
            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ink">Transaksi Terakhir</h2>
                  <p className="text-xs text-muted-ink">7 aktivitas terbaru</p>
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
                <EmptyState
                  compact
                  icon={<ReceiptText size={26} />}
                  title="Belum ada aktivitas tercatat"
                  description="Catatan kecilmu hari ini adalah data besar untuk keputusan besok. Ayo mulai!"
                  actionLabel="Catat Transaksi Pertama"
                  onAction={() => window.openTransactionModal?.()}
                />
              ) : (
                /* List bersih: pemisah border-b #E5E5E0 sangat tipis */
                <ul>
                  {recent.map((tx, i) => (
                    <li
                      key={tx.id}
                      className={i < recent.length - 1 ? "border-b border-[#E5E5E0]" : ""}
                    >
                      <TransactionItem
                        tx={tx}
                        compact
                        onEdit={(t) => window.openTransactionModal?.(t)}
                        onDelete={(id) => {
                          // Konfirmasi sebelum hapus (memanggil action store deleteTransaction).
                          if (window.confirm("Hapus transaksi ini?")) deleteTransaction(id);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}
