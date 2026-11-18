"use client";

import Link from "next/link";
import { AlertTriangle, AlertCircle, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import type { BudgetStatus } from "@/types";
import { useCategoryBudgets } from "@/lib/selectors";

interface BudgetAlertsProps {
  /** Jika true, tampilkan versi ringkas (mis. untuk dashboard utama) */
  compact?: boolean;
  /** Batas jumlah item yang ditampilkan di dashboard */
  limit?: number;
  /** Bulan spesifik "YYYY-MM", jika kosong pakai bulan ini */
  month?: string;
}

export function BudgetAlerts({ compact = false, limit, month }: BudgetAlertsProps) {
  const { alerts, totalBudget } = useCategoryBudgets(month);

  if (totalBudget === 0) {
    return null; // Belum ada anggaran yang diatur
  }

  // Jika tidak ada alert yang aktif (semua kategori < 80%)
  if (alerts.length === 0) {
    if (compact) return null; // Di dashboard, jika aman tidak perlu mengganggu
    return (
      <Card className="border-income/30 bg-income/[0.06]">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-income text-white shadow-glass">
            <CheckCircle2 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-income">Semua Anggaran Terkendali</h3>
            <p className="text-xs text-muted-ink">
              Seluruh kategori pengeluaran Anda masih berada di bawah 80% dari batas anggaran bulanan.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  return (
    <div className="space-y-3">
      {displayAlerts.map((item) => {
        // 1. Peringatan Melebihi Anggaran (>= 100%)
        if (item.alertLevel === "over") {
          const overAmount = item.spentAmount - item.budgetAmount;
          return (
            <Card
              key={item.category}
              className="border-expense/40 bg-gradient-to-r from-expense/[0.12] to-expense/[0.04] p-4 shadow-glass transition-all"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-expense text-white shadow-glass animate-pulse">
                    <ShieldAlert size={20} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-expense">
                        🚨 Melebihi Anggaran
                      </span>
                      <Badge className="bg-expense text-white font-bold">
                        {item.usagePercentage.toFixed(0)}% terpakai
                      </Badge>
                    </div>
                    <h4 className="mt-0.5 text-base font-bold text-ink">
                      Kategori <span className="text-expense">{item.categoryLabel}</span> Melampaui Batas!
                    </h4>
                    <p className="mt-1 text-xs text-ink/80 leading-relaxed">
                      Pengeluaran sudah mencapai{" "}
                      <b className="font-data text-expense">{formatIDR(item.spentAmount)}</b> dari batas{" "}
                      <b className="font-data text-ink">{formatIDR(item.budgetAmount)}</b>. Melebihi anggaran sebesar{" "}
                      <b className="font-data text-expense">+{formatIDR(overAmount)}</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link href="/anggaran">
                    <Button variant="danger" className="px-3 py-1.5 text-xs">
                      Atur Anggaran <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Batang kemajuan visual 100%+ */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-expense w-full" />
              </div>
            </Card>
          );
        }

        // 2. Peringatan Menonjol (90% - 99.9%)
        if (item.alertLevel === "prominent") {
          return (
            <Card
              key={item.category}
              className="border-amber-500/40 bg-gradient-to-r from-amber-500/[0.12] to-amber-500/[0.04] p-4 shadow-glass transition-all"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-glass">
                    <AlertCircle size={20} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                        ⚡ Waspada (90%+)
                      </span>
                      <Badge className="bg-amber-500 text-white font-bold">
                        {item.usagePercentage.toFixed(0)}% terpakai
                      </Badge>
                    </div>
                    <h4 className="mt-0.5 text-base font-bold text-ink">
                      Kategori <span className="text-amber-600">{item.categoryLabel}</span> Hampir Habis!
                    </h4>
                    <p className="mt-1 text-xs text-ink/80 leading-relaxed">
                      Pengeluaran mencapai{" "}
                      <b className="font-data text-amber-700">{formatIDR(item.spentAmount)}</b> dari batas{" "}
                      <b className="font-data text-ink">{formatIDR(item.budgetAmount)}</b>. Sisa anggaran hanya{" "}
                      <b className="font-data text-ink font-semibold">{formatIDR(item.remainingAmount)}</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link href="/anggaran">
                    <Button variant="outline" className="px-3 py-1.5 text-xs text-amber-800 border-amber-300">
                      Cek Detail <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Batang kemajuan visual 90-99% */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(item.usagePercentage, 100)}%` }}
                />
              </div>
            </Card>
          );
        }

        // 3. Peringatan Lembut (80% - 89.9%)
        return (
          <Card
            key={item.category}
            className="border-yellow-400/40 bg-yellow-500/[0.07] p-3.5 shadow-glass transition-all"
          >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-yellow-500 text-white shadow-glass">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-yellow-700">
                      Perhatian (80%)
                    </span>
                    <Badge className="bg-yellow-500/20 text-yellow-800 font-semibold text-[11px]">
                      {item.usagePercentage.toFixed(0)}% terpakai
                    </Badge>
                  </div>
                  <p className="text-xs text-ink/80 mt-0.5">
                    Kategori <b>{item.categoryLabel}</b> terpakai{" "}
                    <span className="font-data font-semibold text-yellow-700">{formatIDR(item.spentAmount)}</span> dari{" "}
                    <span className="font-data">{formatIDR(item.budgetAmount)}</span> (sisa{" "}
                    <span className="font-data font-medium">{formatIDR(item.remainingAmount)}</span>).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link href="/anggaran">
                  <span className="text-xs font-semibold text-yellow-700 hover:underline flex items-center gap-1">
                    Kelola <ArrowRight size={12} />
                  </span>
                </Link>
              </div>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${Math.min(item.usagePercentage, 100)}%` }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
