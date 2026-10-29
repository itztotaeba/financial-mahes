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
      <Card className="border-0 bg-[#151516] text-white ring-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/60">Total Saldo</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
            <Wallet size={16} className="text-[#C8ACC0]" />
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
          <p className="text-sm font-medium text-black/50">Total Pemasukan</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#4FB279]/15">
            <TrendingUp size={16} className="text-[#4FB279]" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-[#4FB279] sm:text-3xl">
          {formatIDR(summary.totalIncome)}
        </p>
        <p className="mt-1 text-xs text-black/40">
          Bulan ini: <span className="font-semibold text-[#151516]">{formatIDR(summary.monthIncome)}</span>
        </p>
      </Card>

      {/* Total Pengeluaran */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-black/50">Total Pengeluaran</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#D3534C]/15">
            <TrendingDown size={16} className="text-[#D3534C]" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-[#D3534C] sm:text-3xl">
          {formatIDR(summary.totalExpense)}
        </p>
        <p className="mt-1 text-xs text-black/40">
          Bulan ini: <span className="font-semibold text-[#151516]">{formatIDR(summary.monthExpense)}</span>
        </p>
      </Card>
    </div>
  );
}
