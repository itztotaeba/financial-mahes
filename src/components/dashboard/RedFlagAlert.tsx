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
      <Card className="border-expense/30 bg-expense/[0.07]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-expense text-white shadow-glass">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-expense">Red Flag! Pengeluaran terlalu tinggi</h2>
              <span className="rounded-full bg-expense px-2.5 py-0.5 text-xs font-bold text-white">
                {(summary.burnRatio * 100).toFixed(0)}% dari pemasukan
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/70">
              Bulan ini Anda menghabiskan{" "}
              <b className="text-expense">{formatIDR(summary.monthExpense)}</b> dari pemasukan{" "}
              <b className="text-income">{formatIDR(summary.monthIncome)}</b>. Idealnya pengeluaran
              di bawah 80% agar dana tetap bertumbuh.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-income/30 bg-income/[0.07]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-income text-white shadow-glass">
          <ShieldCheck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-income">Kondisi keuangan sehat</h2>
            <span className="text-xs font-semibold text-muted-ink">
              Rasio bakar bulan ini: {(summary.burnRatio * 100).toFixed(0)}%
            </span>
          </div>
          {/* Progress bar rasio pengeluaran:pemasukan */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-income to-primary transition-all"
              style={{ width: `${Math.max(ratio * 100, 4)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
