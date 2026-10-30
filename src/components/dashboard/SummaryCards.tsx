"use client";

/**
 * Kartu Ringkasan: Total Saldo, Total Pemasukan, Total Pengeluaran.
 * Gaya "Fresh Earthy Minimalism": kartu putih radius besar + shadow tipis,
 * hero saldo hijau gelap (deep forest). Animasi masuk staggered via
 * Framer Motion (opacity + y) untuk kesan upbeat yang halus.
 */
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import type { Summary } from "@/lib/selectors";

/** Varian animasi masuk — delay kecil bertingkat (staggered) per kartu. */
const cardMotion = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* Total Saldo — hero "deep forest" sebagai fokus utama */}
      <motion.div {...cardMotion(0)}>
        <div className="glass-dark p-5 text-white sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">Total Saldo</p>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
              <Wallet size={16} className="text-accent" />
            </span>
          </div>
          <p className="font-data mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {formatIDR(summary.balance)}
          </p>
          <p className="mt-1 text-xs text-white/50">Akumulasi seluruh transaksi tercatat</p>
        </div>
      </motion.div>

      {/* Total Pemasukan */}
      <motion.div {...cardMotion(0.08)}>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-ink">Total Pemasukan</p>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-income/10">
              <TrendingUp size={16} className="text-income" />
            </span>
          </div>
          <p className="font-data mt-3 text-2xl font-extrabold tracking-tight text-income sm:text-3xl">
            {formatIDR(summary.totalIncome)}
          </p>
          <p className="mt-1 text-xs text-muted-ink">
            Bulan ini: <span className="font-data font-semibold text-ink">{formatIDR(summary.monthIncome)}</span>
          </p>
        </Card>
      </motion.div>

      {/* Total Pengeluaran */}
      <motion.div {...cardMotion(0.16)}>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-ink">Total Pengeluaran</p>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-expense/10">
              <TrendingDown size={16} className="text-expense" />
            </span>
          </div>
          <p className="font-data mt-3 text-2xl font-extrabold tracking-tight text-expense sm:text-3xl">
            {formatIDR(summary.totalExpense)}
          </p>
          <p className="mt-1 text-xs text-muted-ink">
            Bulan ini: <span className="font-data font-semibold text-ink">{formatIDR(summary.monthExpense)}</span>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
