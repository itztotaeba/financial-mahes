"use client";

import { useState } from "react";
import { Plus, Edit2, CheckCircle2, AlertTriangle, AlertCircle, TrendingDown } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { formatIDR, formatIDRCompact } from "@/lib/utils";
import { CATEGORY_MAP } from "@/types";
import { useCategoryBudgets } from "@/lib/selectors";
import { BudgetModal } from "./BudgetModal";

interface CategoryBudgetListProps {
  month?: string;
}

export function CategoryBudgetList({ month }: CategoryBudgetListProps) {
  const {
    categories,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
    overallStatus,
    monthLabel,
  } = useCategoryBudgets(month);

  const [modalOpen, setModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string | undefined>(undefined);
  const [targetAmount, setTargetAmount] = useState<number>(0);

  const handleEditCategory = (catKey: string, currentBudget: number) => {
    setTargetCategory(catKey);
    setTargetAmount(currentBudget);
    setModalOpen(true);
  };

  const handleOpenNew = () => {
    setTargetCategory(undefined);
    setTargetAmount(0);
    setModalOpen(true);
  };

  // Status visual color and badge styling
  const getStatusBadge = (status: "safe" | "warning" | "danger", usagePct: number) => {
    if (usagePct === 0) {
      return (
        <Badge className="bg-black/5 text-muted-ink">
          Belum Terpakai
        </Badge>
      );
    }
    if (status === "safe") {
      return (
        <Badge className="bg-income/15 text-income font-bold">
          <CheckCircle2 size={12} className="inline mr-1" />
          Aman (≤70%)
        </Badge>
      );
    }
    if (status === "warning") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 font-bold">
          <AlertTriangle size={12} className="inline mr-1" />
          Mendekati Batas (71–90%)
        </Badge>
      );
    }
    return (
      <Badge className="bg-expense/15 text-expense font-bold">
        <AlertCircle size={12} className="inline mr-1" />
        {usagePct >= 100 ? "Melebihi Anggaran (>100%)" : "Peringatan (>90%)"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Kartu Ringkasan Akumulasi Anggaran Bulanan */}
      <Card className="bg-gradient-to-br from-white/95 to-white/70 shadow-glass border-white/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-black/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-ink">Ringkasan Anggaran Bulanan</h3>
              <Badge className="bg-primary/10 text-primary font-semibold text-xs">
                {monthLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-ink mt-0.5">
              Kontrol pengeluaran per kategori untuk menjaga kesehatan finansial Anda.
            </p>
          </div>

          <Button onClick={handleOpenNew} className="shrink-0 px-4">
            <Plus size={16} /> Atur Anggaran
          </Button>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-2 gap-3 pt-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
              Total Anggaran
            </p>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-ink font-data">
              {formatIDR(totalBudget)}
            </p>
            <p className="text-[10px] text-muted-ink mt-0.5">Batas yang ditetapkan</p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
              Total Terpakai
            </p>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-expense font-data">
              {formatIDR(totalSpent)}
            </p>
            <p className="text-[10px] text-muted-ink mt-0.5">Pengeluaran bulan ini</p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
              Sisa Anggaran
            </p>
            <p
              className={`mt-1 text-base sm:text-lg font-extrabold font-data ${
                totalRemaining < 0 ? "text-expense" : "text-income"
              }`}
            >
              {totalRemaining < 0
                ? `-${formatIDR(Math.abs(totalRemaining))}`
                : formatIDR(totalRemaining)}
            </p>
            <p className="text-[10px] text-muted-ink mt-0.5">
              {totalRemaining < 0 ? "Melebihi pagu" : "Dana masih tersedia"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
                Pemakaian
              </p>
              <span
                className={`text-[11px] font-bold ${
                  overallStatus === "danger"
                    ? "text-expense"
                    : overallStatus === "warning"
                    ? "text-amber-600"
                    : "text-income"
                }`}
              >
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/10">
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
            <p className="text-[10px] text-muted-ink mt-1.5 truncate">
              {overallStatus === "safe"
                ? "Kondisi sangat sehat"
                : overallStatus === "warning"
                ? "Mendekati limit anggaran"
                : "Perlu penghematan segera"}
            </p>
          </div>
        </div>
      </Card>

      {/* Daftar Semua Kategori Beserta Anggaran, Terpakai, Sisa, dan Batang Kemajuan */}
      <Card>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-ink">Daftar Anggaran per Kategori</h3>
            <p className="text-xs text-muted-ink">
              Pantau batas nominal, pemakaian riil, dan sisa per kategori pengeluaran
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-income font-medium">
              <span className="h-2 w-2 rounded-full bg-income inline-block" /> ≤70% Aman
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> 71–90% Waspada
            </span>
            <span className="flex items-center gap-1 text-expense font-medium">
              <span className="h-2 w-2 rounded-full bg-expense inline-block" /> &gt;90% Peringatan
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((item) => {
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.lainnya;
            const Icon = catInfo.icon;
            const hasBudget = item.budgetAmount > 0;
            const isOverBudget = item.spentAmount > item.budgetAmount && hasBudget;

            return (
              <div
                key={item.category}
                className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 p-4 shadow-glass transition hover:border-black/10 hover:bg-white"
              >
                {/* Header Kategori */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white shadow-glass"
                      style={{ backgroundColor: catInfo.color }}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-ink">{item.categoryLabel}</h4>
                        {hasBudget ? (
                          getStatusBadge(item.status, item.usagePercentage)
                        ) : (
                          <Badge className="bg-black/5 text-muted-ink">Belum Ditentukan</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-ink mt-0.5">
                        {hasBudget
                          ? `Batas bulanan: ${formatIDR(item.budgetAmount)}`
                          : "Klik 'Atur Batas' untuk mulai menetapkan pagu anggaran"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-ink">Terpakai / Sisa</div>
                      <div className="text-sm font-bold text-ink">
                        <span className="text-expense font-data">{formatIDR(item.spentAmount)}</span>
                        {hasBudget && (
                          <>
                            <span className="text-muted-ink mx-1">/</span>
                            <span
                              className={`font-data ${
                                isOverBudget ? "text-expense font-extrabold" : "text-income"
                              }`}
                            >
                              {isOverBudget
                                ? `Over ${formatIDR(Math.abs(item.remainingAmount))}`
                                : `Sisa ${formatIDR(item.remainingAmount)}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleEditCategory(item.category, item.budgetAmount)}
                      className="h-8 px-2.5 text-xs shrink-0"
                    >
                      <Edit2 size={13} />
                      <span className="hidden sm:inline">
                        {hasBudget ? "Ubah" : "Atur Batas"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Progress Bar & Persentase */}
                {hasBudget ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-medium text-muted-ink">
                        Persentase Pemakaian
                      </span>
                      <span
                        className="font-data font-bold text-xs"
                        style={{ color: item.statusColor }}
                      >
                        {item.usagePercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(item.usagePercentage, 100)}%`,
                          backgroundColor: item.statusColor,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-black/[0.02] px-3 py-1.5 text-xs text-muted-ink">
                    <span>Pengeluaran tercatat: {formatIDR(item.spentAmount)}</span>
                    <button
                      onClick={() => handleEditCategory(item.category, item.budgetAmount)}
                      className="text-primary font-semibold hover:underline"
                    >
                      + Pasang batas anggaran
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal Edit / Pasang Anggaran */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialCategory={targetCategory}
        initialAmount={targetAmount}
        month={month}
      />
    </div>
  );
}
