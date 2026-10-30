"use client";

/**
 * Selector turunan untuk dashboard — dihitung dengan useMemo agar efisien.
 */
import { useMemo } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import type { Transaction } from "@/types";
import { CATEGORY_MAP } from "@/types";
import { todayISO, addDaysISO, dateOnly } from "@/lib/utils";

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
    // Urutkan berdasarkan WAKTU INPUT terbaru (inputted_at -> created_at -> date).
    const inputKey = (t: Transaction) =>
      Date.parse(t.inputted_at ?? t.created_at ?? "") ||
      (dateOnly(t.date) ? new Date(`${dateOnly(t.date)}T${(t.date.match(/T(\d{2}:\d{2})/) ?? ["", "00:00"])[1]}:00`).getTime() : 0);
    const recent: Transaction[] = [...transactions]
      .sort((a, b) => inputKey(b) - inputKey(a))
      .slice(0, 7);

    return { summary, cashflow, categories, recent, transactions };
  }, [transactions]);
}
