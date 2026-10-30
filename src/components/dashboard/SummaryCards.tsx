"use client";

/**
 * Kartu Ringkasan: Total Saldo, Total Pemasukan, Total Pengeluaran.
 * Gaya mengikuti kartu hero pada referensi Casha (dark card untuk saldo).
 */
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import type { Summary } from "@/lib/selectors";

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* Total Saldo — kartu gelap sebagai fokus utama */}
      <Card className="border-white/10 bg-ink/90 text-white backdrop-blur-2xl shadow-glass-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/60">Total Saldo</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-md">
            <Wallet size={16} className="text-lilac" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {formatIDR(summary.balance)}
        </p>
        <p className="mt-1 text-xs text-white/40">Akumulasi seluruh transaksi tercatat</p>
      </Card>

      {/* Total Pemasukan */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-ink">Total Pemasukan</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-income/15">
            <TrendingUp size={16} className="text-income" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-income sm:text-3xl">
          {formatIDR(summary.totalIncome)}
        </p>
        <p className="mt-1 text-xs text-muted-ink">
          Bulan ini: <span className="font-semibold text-ink">{formatIDR(summary.monthIncome)}</span>
        </p>
      </Card>

      {/* Total Pengeluaran */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-ink">Total Pengeluaran</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-expense/15">
            <TrendingDown size={16} className="text-expense" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-expense sm:text-3xl">
          {formatIDR(summary.totalExpense)}
        </p>
        <p className="mt-1 text-xs text-muted-ink">
          Bulan ini: <span className="font-semibold text-ink">{formatIDR(summary.monthExpense)}</span>
        </p>
      </Card>
    </div>
  );
}
