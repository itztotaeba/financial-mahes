"use client";

import Link from "next/link";
import { PieChart, Target, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import { useCategoryBudgets, useSavingsGoalsData } from "@/lib/selectors";

export function BudgetSavingsWidget() {
  const { totalBudget, totalSpent, totalRemaining, overallPercentage, overallStatus, monthLabel } =
    useCategoryBudgets();
  const { totalTarget, totalCollected, totalRemaining: savingsRemaining, overallPercentage: savingsPct, activeCount } =
    useSavingsGoalsData();

  if (totalBudget === 0 && totalTarget === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Widget Anggaran Kategori */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                <PieChart size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Anggaran Kategori</h3>
                <p className="text-[11px] text-muted-ink">{monthLabel}</p>
              </div>
            </div>

            <Badge
              className={
                overallStatus === "danger"
                  ? "bg-expense/15 text-expense font-bold"
                  : overallStatus === "warning"
                  ? "bg-amber-500/15 text-amber-700 font-bold"
                  : "bg-income/15 text-income font-bold"
              }
            >
              {overallPercentage.toFixed(0)}% terpakai
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.02] p-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-ink">Batas Anggaran</p>
              <p className="font-bold text-ink font-data truncate">{formatIDR(totalBudget)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-ink">Terpakai</p>
              <p className="font-bold text-expense font-data truncate">{formatIDR(totalSpent)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-ink">Sisa Pagu</p>
              <p
                className={`font-bold font-data truncate ${
                  totalRemaining < 0 ? "text-expense" : "text-income"
                }`}
              >
                {totalRemaining < 0 ? `-${formatIDR(Math.abs(totalRemaining))}` : formatIDR(totalRemaining)}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallStatus === "danger"
                    ? "bg-expense"
                    : overallStatus === "warning"
                    ? "bg-amber-500"
                    : "bg-income"
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
          <span className="text-xs text-muted-ink">Kontrol batas pengeluaran</span>
          <Link href="/anggaran">
            <Button variant="ghost" className="h-8 px-2.5 text-xs text-primary font-semibold">
              Detail Anggaran <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Widget Target Tabungan */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-income/10 text-income">
                <Target size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Target Tabungan</h3>
                <p className="text-[11px] text-muted-ink">{activeCount} target aktif</p>
              </div>
            </div>

            <Badge className="bg-primary/10 text-primary font-bold">
              {savingsPct.toFixed(0)}% terkumpul
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.02] p-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-ink">Total Terkumpul</p>
              <p className="font-bold text-income font-data truncate">{formatIDR(totalCollected)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-ink">Total Target</p>
              <p className="font-bold text-ink font-data truncate">{formatIDR(totalTarget)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-ink">Sisa Kebutuhan</p>
              <p className="font-bold text-primary font-data truncate">{formatIDR(savingsRemaining)}</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-income transition-all duration-500"
                style={{ width: `${Math.min(savingsPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
          <span className="text-xs text-muted-ink">Wujudkan target impian</span>
          <Link href="/anggaran">
            <Button variant="ghost" className="h-8 px-2.5 text-xs text-primary font-semibold">
              Kelola Tabungan <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
