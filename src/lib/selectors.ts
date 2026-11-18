"use client";

/**
 * Selector turunan untuk dashboard, anggaran, tabungan & perbandingan periode — dihitung dengan useMemo agar efisien.
 */
import { useMemo } from "react";
import { useFinanceStore, sortKeyOf } from "@/store/useFinanceStore";
import type {
  Transaction,
  BudgetStatus,
  SavingsGoalProgress,
  PeriodSummary,
  PeriodComparisonData,
} from "@/types";
import { CATEGORY_MAP, EXPENSE_CATEGORIES } from "@/types";
import { todayISO, addDaysISO, dateOnly, formatIDR } from "@/lib/utils";

export interface Summary {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  monthIncome: number;
  monthExpense: number;
  /** Rasio pengeluaran terhadap pemasukan bulan ini (0..n). */
  burnRatio: number;
  isRedFlag: boolean; // pengeluaran > 80% pemasukan bulanan
}

export interface DayPoint {
  date: string; // YYYY-MM-DD
  label: string; // "27/10"
  income: number;
  expense: number;
  net: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
  percent: number;
}

function monthPrefix(iso: string) {
  return dateOnly(iso).slice(0, 7); // YYYY-MM (toleran "YYYY-MM-DDTHH:mm")
}

export function useDashboardData() {
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    const today = todayISO();
    const thisMonth = monthPrefix(today);

    // ---- Ringkasan ----
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    for (const t of transactions) {
      if (t.type === "income") {
        totalIncome += t.amount;
        if (monthPrefix(t.date) === thisMonth) monthIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (monthPrefix(t.date) === thisMonth) monthExpense += t.amount;
      }
    }
    const burnRatio = monthIncome > 0 ? monthExpense / monthIncome : monthExpense > 0 ? 1 : 0;
    const summary: Summary = {
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      monthIncome,
      monthExpense,
      burnRatio,
      isRedFlag: monthIncome > 0 && burnRatio > 0.8,
    };

    // ---- Tren cashflow 30 hari terakhir ----
    const byDay: Record<string, DayPoint> = {};
    for (let i = 29; i >= 0; i--) {
      const d = addDaysISO(today, -i);
      byDay[d] = {
        date: d,
        label: `${d.slice(8, 10)}/${d.slice(5, 7)}`,
        income: 0,
        expense: 0,
        net: 0,
      };
    }
    for (const t of transactions) {
      const point = byDay[dateOnly(t.date)];
      if (!point) continue;
      if (t.type === "income") point.income += t.amount;
      else point.expense += t.amount;
    }
    const cashflow = Object.values(byDay).map((p) => ({ ...p, net: p.income - p.expense }));

    // ---- Distribusi kategori pengeluaran ----
    const catTotals: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount;
    }
    const catSum = Object.values(catTotals).reduce((a, b) => a + b, 0);
    const categories: CategorySlice[] = Object.entries(catTotals)
      .map(([key, value]) => ({
        name: CATEGORY_MAP[key]?.label ?? key,
        value,
        color: CATEGORY_MAP[key]?.color ?? "#9CA3AF",
        percent: catSum > 0 ? (value / catSum) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // ---- Transaksi terbaru ----
    // Urutan mengikuti WAKTU TRANSAKSI (tanggal + jam yang diinput user),
    // konsisten dengan sortedByInput di store.
    const recent: Transaction[] = [...transactions]
      .sort((a, b) => sortKeyOf(b) - sortKeyOf(a))
      .slice(0, 7);

    return { summary, cashflow, categories, recent, transactions };
  }, [transactions]);
}

export interface CategoryBudgetData {
  month: string;
  monthLabel: string;
  categories: BudgetStatus[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  overallStatus: "safe" | "warning" | "danger";
  alerts: BudgetStatus[];
}

/**
 * Selector untuk Anggaran per Kategori (Fitur 1 & 2):
 * Menghitung pemakaian, sisa, persentase, status warna (Hijau, Kuning, Merah),
 * dan level peringatan (Soft 80%, Prominent 90%, Over 100%).
 */
export function useCategoryBudgets(selectedMonth?: string): CategoryBudgetData {
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);

  return useMemo(() => {
    const month = selectedMonth || dateOnly(todayISO()).slice(0, 7);
    const monthDate = new Date(`${month}-01T00:00:00`);
    const monthLabel = !Number.isNaN(monthDate.getTime())
      ? monthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
      : month;

    // Hitung pengeluaran per kategori di bulan ini
    const spentByCat: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const tMonth = dateOnly(t.date).slice(0, 7);
      if (tMonth === month) {
        spentByCat[t.category] = (spentByCat[t.category] ?? 0) + t.amount;
      }
    }

    // Pemetaan anggaran per kategori (prioritaskan anggaran spesifik bulan ini, fallback ke default/global)
    const budgetByCat: Record<string, number> = {};
    for (const b of budgets) {
      if (!b.month) {
        budgetByCat[b.category] = b.amount;
      }
    }
    for (const b of budgets) {
      if (b.month === month) {
        budgetByCat[b.category] = b.amount;
      }
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const categories: BudgetStatus[] = EXPENSE_CATEGORIES.map((catKey) => {
      const budgetAmount = budgetByCat[catKey] ?? 0;
      const spentAmount = spentByCat[catKey] ?? 0;
      const remainingAmount = budgetAmount - spentAmount;
      const usagePercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      // Status warna indikator:
      // - Hijau (<= 70% terpakai — aman)
      // - Kuning (71–90% — mendekati batas)
      // - Merah (> 90% atau melebihi anggaran — peringatan)
      let status: "safe" | "warning" | "danger" = "safe";
      let statusColor = "#4FB279";
      let statusLabel = "Aman";

      if (budgetAmount > 0) {
        if (usagePercentage > 90) {
          status = "danger";
          statusColor = "#D3534C";
          statusLabel = usagePercentage >= 100 ? "Melebihi Anggaran" : "Peringatan";
        } else if (usagePercentage > 70) {
          status = "warning";
          statusColor = "#F59E0B";
          statusLabel = "Mendekati Batas";
        }
      }

      // Level alert untuk peringatan:
      // - soft: 80% s/d 89.9%
      // - prominent: 90% s/d 99.9%
      // - over: >= 100%
      let alertLevel: "none" | "soft" | "prominent" | "over" = "none";
      if (budgetAmount > 0) {
        if (usagePercentage >= 100) alertLevel = "over";
        else if (usagePercentage >= 90) alertLevel = "prominent";
        else if (usagePercentage >= 80) alertLevel = "soft";
      }

      totalBudget += budgetAmount;
      totalSpent += spentAmount;

      return {
        category: catKey,
        categoryLabel: CATEGORY_MAP[catKey]?.label ?? catKey,
        budgetAmount,
        spentAmount,
        remainingAmount,
        usagePercentage,
        status,
        statusColor,
        statusLabel,
        alertLevel,
      };
    });

    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const overallStatus: "safe" | "warning" | "danger" =
      overallPercentage > 90 ? "danger" : overallPercentage > 70 ? "warning" : "safe";

    // Daftar peringatan aktif yang butuh perhatian (level soft, prominent, over), diurutkan dari % tertinggi
    const alerts = categories
      .filter((c) => c.alertLevel !== "none")
      .sort((a, b) => b.usagePercentage - a.usagePercentage);

    return {
      month,
      monthLabel,
      categories,
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      overallStatus,
      alerts,
    };
  }, [transactions, budgets, selectedMonth]);
}

export interface SavingsSummaryData {
  goals: SavingsGoalProgress[];
  totalTarget: number;
  totalCollected: number;
  totalRemaining: number;
  overallPercentage: number;
  activeCount: number;
  completedCount: number;
}

/**
 * Selector untuk Tabungan & Target Tujuan (Fitur 3):
 * Menghitung sisa kebutuhan, persentase kemajuan, estimasi perkiraan waktu,
 * dan ringkasan target tabungan aktif.
 */
export function useSavingsGoalsData(): SavingsSummaryData {
  const savingsGoals = useFinanceStore((s) => s.savingsGoals);
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    const today = dateOnly(todayISO());

    // Hitung rata-rata net cashflow bulanan dari transaksi yang tercatat
    const monthlyNet: Record<string, { inc: number; exp: number }> = {};
    for (const t of transactions) {
      const m = dateOnly(t.date).slice(0, 7);
      monthlyNet[m] ??= { inc: 0, exp: 0 };
      if (t.type === "income") monthlyNet[m].inc += t.amount;
      else monthlyNet[m].exp += t.amount;
    }
    const recentMonths = Object.values(monthlyNet);
    let avgMonthlySavings = 0;
    if (recentMonths.length > 0) {
      const sumNet = recentMonths.reduce((acc, v) => acc + (v.inc - v.exp), 0);
      avgMonthlySavings = Math.max(0, Math.round(sumNet / recentMonths.length));
    }

    let totalTarget = 0;
    let totalCollected = 0;
    let activeCount = 0;
    let completedCount = 0;

    const goals: SavingsGoalProgress[] = savingsGoals.map((g) => {
      totalTarget += g.targetAmount;
      totalCollected += g.currentAmount;
      const isCompleted = g.currentAmount >= g.targetAmount;
      if (isCompleted) completedCount++;
      else activeCount++;

      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const progressPercentage =
        g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;

      let estimatedCompletionText = "";
      if (isCompleted) {
        estimatedCompletionText = "🎉 Target telah tercapai!";
      } else if (g.targetDate) {
        const todayDate = new Date(`${today}T00:00:00`);
        const targetDate = new Date(`${g.targetDate}T00:00:00`);
        const diffMs = targetDate.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          estimatedCompletionText = `⚠️ Melewati batas target (${Math.abs(diffDays)} hari lalu)`;
        } else if (diffDays === 0) {
          estimatedCompletionText = "Batas target adalah hari ini!";
        } else if (diffDays <= 30) {
          const reqDaily = Math.ceil(remainingAmount / diffDays);
          estimatedCompletionText = `Sisa ${diffDays} hari (perlu ~${formatIDR(reqDaily)}/hari)`;
        } else {
          const monthsLeft = diffDays / 30.4;
          const reqMonthly = Math.ceil(remainingAmount / monthsLeft);
          estimatedCompletionText = `Sisa ${diffDays} hari (~${Math.ceil(monthsLeft)} bln, perlu ~${formatIDR(reqMonthly)}/bln)`;
        }
      } else if (avgMonthlySavings > 0) {
        const monthsNeeded = Math.ceil(remainingAmount / avgMonthlySavings);
        estimatedCompletionText = `Perkiraan ~${monthsNeeded} bln lagi (laju tabungan ~${formatIDR(avgMonthlySavings)}/bln)`;
      } else {
        estimatedCompletionText = "Tetapkan tanggal target atau mulai menabung";
      }

      return {
        goal: g,
        remainingAmount,
        progressPercentage,
        isCompleted,
        estimatedCompletionText,
      };
    });

    const totalRemaining = Math.max(0, totalTarget - totalCollected);
    const overallPercentage = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;

    return {
      goals,
      totalTarget,
      totalCollected,
      totalRemaining,
      overallPercentage,
      activeCount,
      completedCount,
    };
  }, [savingsGoals, transactions]);
}

/**
 * Selector untuk Perbandingan Periode (Fitur 4):
 * Membandingkan Bulan Ini vs Bulan Lalu (MoM) vs Bulan Sama Tahun Lalu (YoY).
 */
export function usePeriodComparison(selectedMonth?: string): PeriodComparisonData {
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    const curMonthKey = selectedMonth || dateOnly(todayISO()).slice(0, 7);
    const [yStr, mStr] = curMonthKey.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);

    // Bulan lalu
    let prevYear = y;
    let prevMonthNum = m - 1;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYear = y - 1;
    }
    const prevMonthKey = `${prevYear}-${String(prevMonthNum).padStart(2, "0")}`;

    // Bulan yang sama di tahun lalu (YoY)
    const sameMonthLastYearKey = `${y - 1}-${String(m).padStart(2, "0")}`;

    const makeSummary = (key: string): PeriodSummary => {
      let income = 0;
      let expense = 0;
      for (const t of transactions) {
        if (dateOnly(t.date).slice(0, 7) === key) {
          if (t.type === "income") income += t.amount;
          else expense += t.amount;
        }
      }
      const d = new Date(`${key}-01T00:00:00`);
      const periodLabel = !Number.isNaN(d.getTime())
        ? d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
        : key;
      const shortLabel = !Number.isNaN(d.getTime())
        ? d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
        : key;
      return {
        periodKey: key,
        periodLabel,
        shortLabel,
        income,
        expense,
        net: income - expense,
      };
    };

    const current = makeSummary(curMonthKey);
    const prevMonth = makeSummary(prevMonthKey);
    const sameMonthLastYear = makeSummary(sameMonthLastYearKey);

    // MoM Differences & Pct
    const momIncomeDiff = current.income - prevMonth.income;
    const momIncomePct =
      prevMonth.income > 0
        ? (momIncomeDiff / prevMonth.income) * 100
        : current.income > 0
        ? 100
        : 0;

    const momExpenseDiff = current.expense - prevMonth.expense;
    const momExpensePct =
      prevMonth.expense > 0
        ? (momExpenseDiff / prevMonth.expense) * 100
        : current.expense > 0
        ? 100
        : 0;

    // YoY Differences & Pct
    const yoyIncomeDiff = current.income - sameMonthLastYear.income;
    const yoyIncomePct =
      sameMonthLastYear.income > 0
        ? (yoyIncomeDiff / sameMonthLastYear.income) * 100
        : current.income > 0
        ? 100
        : 0;

    const yoyExpenseDiff = current.expense - sameMonthLastYear.expense;
    const yoyExpensePct =
      sameMonthLastYear.expense > 0
        ? (yoyExpenseDiff / sameMonthLastYear.expense) * 100
        : current.expense > 0
        ? 100
        : 0;

    return {
      current,
      prevMonth,
      sameMonthLastYear,
      momIncomeDiff,
      momIncomePct,
      momExpenseDiff,
      momExpensePct,
      yoyIncomeDiff,
      yoyIncomePct,
      yoyExpenseDiff,
      yoyExpensePct,
    };
  }, [transactions, selectedMonth]);
}

