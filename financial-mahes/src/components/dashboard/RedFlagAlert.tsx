"use client";

/**
 * Indikator "Red Flag" keuangan: alert bila pengeluaran > 80% pemasukan bulanan.
 * Bila aman, tampilkan progress bar sehat.
 */
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import type { Summary } from "@/lib/selectors";

export function RedFlagAlert({ summary }: { summary: Summary }) {
  const ratio = Math.min(summary.burnRatio, 1); // cap visual 100%

  if (summary.isRedFlag) {
    return (
      <Card className="border border-[#D3534C]/30 bg-[#D3534C]/[0.06]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D3534C] text-white">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#D3534C]">Red Flag! Pengeluaran terlalu tinggi</h2>
              <span className="rounded-full bg-[#D3534C] px-2.5 py-0.5 text-xs font-bold text-white">
                {(summary.burnRatio * 100).toFixed(0)}% dari pemasukan
              </span>
            </div>
            <p className="mt-1 text-sm text-[#151516]/70">
              Bulan ini Anda menghabiskan{" "}
              <b className="text-[#D3534C]">{formatIDR(summary.monthExpense)}</b> dari pemasukan{" "}
              <b className="text-[#4FB279]">{formatIDR(summary.monthIncome)}</b>. Idealnya pengeluaran
              di bawah 80% agar dana tetap bertumbuh.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-[#4FB279]/30 bg-[#4FB279]/[0.06]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#4FB279] text-white">
          <ShieldCheck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#4FB279]">Kondisi keuangan sehat</h2>
            <span className="text-xs font-semibold text-black/50">
              Rasio bakar bulan ini: {(summary.burnRatio * 100).toFixed(0)}%
            </span>
          </div>
          {/* Progress bar rasio pengeluaran:pemasukan */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4FB279] to-[#2141E0] transition-all"
              style={{ width: `${Math.max(ratio * 100, 4)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
