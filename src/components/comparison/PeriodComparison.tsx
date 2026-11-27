"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart2,
  Table as TableIcon,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, Badge } from "@/components/ui/primitives";
import { formatIDR, formatIDRCompact, todayISO, dateOnly } from "@/lib/utils";
import { usePeriodComparison } from "@/lib/selectors";
import { PrivacyNumber } from "@/components/PrivacyNumber";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface PeriodComparisonProps {
  initialMonth?: string;
}

export function PeriodComparison({ initialMonth }: PeriodComparisonProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || dateOnly(todayISO()).slice(0, 7)
  );

  const { isPrivacyMode } = usePrivacy();
  const data = usePeriodComparison(selectedMonth);
  const {
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
  } = data;

  // Chart data 3 periode (urut kronologis: Tahun Lalu -> Bulan Lalu -> Bulan Ini)
  const chartData = [
    {
      period: sameMonthLastYear.shortLabel,
      fullLabel: sameMonthLastYear.periodLabel,
      Pemasukan: sameMonthLastYear.income,
      Pengeluaran: sameMonthLastYear.expense,
      "Arus Bersih": sameMonthLastYear.net,
    },
    {
      period: prevMonth.shortLabel,
      fullLabel: prevMonth.periodLabel,
      Pemasukan: prevMonth.income,
      Pengeluaran: prevMonth.expense,
      "Arus Bersih": prevMonth.net,
    },
    {
      period: current.shortLabel,
      fullLabel: current.periodLabel,
      Pemasukan: current.income,
      Pengeluaran: current.expense,
      "Arus Bersih": current.net,
    },
  ];

  // Helper formatting badge perubahan
  // Kebutuhan: "Tandai kenaikan pengeluaran dengan warna merah dan penurunan/penghematan dengan warna hijau"
  const renderExpenseChangeBadge = (diff: number, pct: number) => {
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted-ink">
          <Minus size={11} /> 0%
        </span>
      );
    }
    // Pengeluaran naik -> MERAH (pemborosan)
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-expense/15 px-2 py-0.5 text-xs font-bold text-expense">
          <ArrowUpRight size={13} />
          +{isPrivacyMode ? "•••••" : formatIDR(diff)} (+{pct.toFixed(1)}%)
        </span>
      );
    }
    // Pengeluaran turun -> HIJAU (penghematan)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-income/15 px-2 py-0.5 text-xs font-bold text-income">
        <ArrowDownRight size={13} />
        {isPrivacyMode ? "•••••" : formatIDR(diff)} ({pct.toFixed(1)}%)
      </span>
    );
  };

  const renderIncomeChangeBadge = (diff: number, pct: number) => {
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted-ink">
          <Minus size={11} /> 0%
        </span>
      );
    }
    // Pemasukan naik -> HIJAU
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-income/15 px-2 py-0.5 text-xs font-bold text-income">
          <ArrowUpRight size={13} />
          +{isPrivacyMode ? "•••••" : formatIDR(diff)} (+{pct.toFixed(1)}%)
        </span>
      );
    }
    // Pemasukan turun -> MERAH
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-expense/15 px-2 py-0.5 text-xs font-bold text-expense">
        <ArrowDownRight size={13} />
        {isPrivacyMode ? "•••••" : formatIDR(diff)} ({pct.toFixed(1)}%)
      </span>
    );
  };

  const renderNetChangeBadge = (currentNet: number, pastNet: number) => {
    const diff = currentNet - pastNet;
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted-ink">
          <Minus size={11} /> 0%
        </span>
      );
    }
    const pct = pastNet !== 0 ? (diff / Math.abs(pastNet)) * 100 : diff > 0 ? 100 : -100;
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-income/15 px-2 py-0.5 text-xs font-bold text-income">
          <ArrowUpRight size={13} />
          +{isPrivacyMode ? "•••••" : formatIDR(diff)} (+{pct.toFixed(1)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-expense/15 px-2 py-0.5 text-xs font-bold text-expense">
        <ArrowDownRight size={13} />
        {isPrivacyMode ? "•••••" : formatIDR(diff)} ({pct.toFixed(1)}%)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Month Selector */}
      <Card className="bg-gradient-to-br from-white/95 to-white/70 shadow-glass border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-ink">Perbandingan Periode</h3>
              <Badge className="bg-primary/10 text-primary font-bold text-xs">
                MoM & YoY
              </Badge>
            </div>
            <p className="text-xs text-muted-ink mt-0.5">
              Bandingkan performa keuangan bulan ini dengan bulan lalu dan tahun lalu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-ink flex items-center gap-1">
              <Calendar size={13} /> Periode Basis:
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) setSelectedMonth(e.target.value);
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>

        {/* 3 Kartu Sorotan Periode */}
        <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
          {/* Bulan Ini */}
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                Bulan Ini
              </span>
              <span className="text-[11px] font-semibold text-muted-ink">
                {current.periodLabel}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-ink">Pemasukan:</span>
                <span className="font-bold text-income font-data">
                  {<PrivacyNumber value={current.income} />}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-ink">Pengeluaran:</span>
                <span className="font-bold text-expense font-data">
                  {<PrivacyNumber value={current.expense} />}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-black/5 pt-1">
                <span className="font-semibold text-ink">Arus Bersih:</span>
                <span
                  className={`font-extrabold font-data ${
                    current.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {<PrivacyNumber value={current.net} />}
                </span>
              </div>
            </div>
          </div>

          {/* Bulan Lalu */}
          <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wide">
                Bulan Lalu
              </span>
              <span className="text-[11px] font-semibold text-muted-ink">
                {prevMonth.periodLabel}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-ink">Pemasukan:</span>
                <span className="font-bold text-income font-data">
                  {<PrivacyNumber value={prevMonth.income} />}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-ink">Pengeluaran:</span>
                <span className="font-bold text-expense font-data">
                  {<PrivacyNumber value={prevMonth.expense} />}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-black/5 pt-1">
                <span className="font-semibold text-ink">Arus Bersih:</span>
                <span
                  className={`font-extrabold font-data ${
                    prevMonth.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {<PrivacyNumber value={prevMonth.net} />}
                </span>
              </div>
            </div>
          </div>

          {/* Bulan Sama Tahun Lalu */}
          <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wide">
                Bulan Sama Tahun Lalu
              </span>
              <span className="text-[11px] font-semibold text-muted-ink">
                {sameMonthLastYear.periodLabel}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-ink">Pemasukan:</span>
                <span className="font-bold text-income font-data">
                  {<PrivacyNumber value={sameMonthLastYear.income} />}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-ink">Pengeluaran:</span>
                <span className="font-bold text-expense font-data">
                  {<PrivacyNumber value={sameMonthLastYear.expense} />}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-black/5 pt-1">
                <span className="font-semibold text-ink">Arus Bersih:</span>
                <span
                  className={`font-extrabold font-data ${
                    sameMonthLastYear.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {<PrivacyNumber value={sameMonthLastYear.net} />}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grafik Perbandingan Periode */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <BarChart2 size={16} />
            </span>
            <div>
              <h4 className="text-base font-bold text-ink">Grafik Perbandingan Periode</h4>
              <p className="text-xs text-muted-ink">
                Visualisasi komparasi Pemasukan, Pengeluaran, dan Arus Bersih antar periode
              </p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 12, left: -4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#00000010" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: "#151516", opacity: 0.7, fontFamily: "var(--font-data)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => (isPrivacyMode ? "•••" : formatIDRCompact(v))}
                tick={{ fontSize: 11, fill: "#151516", opacity: 0.5, fontFamily: "var(--font-data)" }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.7)",
                  backgroundColor: "rgba(255,255,255,0.92)",
                  boxShadow: "0 10px 25px rgba(0,0,0,.1)",
                  fontSize: 12,
                  backdropFilter: "blur(12px)",
                }}
                formatter={(value) => (isPrivacyMode ? "Rp •••••" : formatIDR(Number(value)))}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.fullLabel || ""
                }
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Pemasukan" fill="#4FB279" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Pengeluaran" fill="#D3534C" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Arus Bersih" fill="#2141E0" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabel Ringkasan Perbandingan */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-lilac/30 text-ink">
              <TableIcon size={16} />
            </span>
            <div>
              <h4 className="text-base font-bold text-ink">Tabel Ringkasan Perbandingan</h4>
              <p className="text-xs text-muted-ink">
                Detail nominal dan persentase perubahan (hijau = hemat/naik, merah = boros/turun)
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-muted-ink">
                <th className="py-3 pr-3 font-semibold">Metrik Finansial</th>
                <th className="py-3 pr-3 text-right font-semibold">
                  Bulan Ini ({current.shortLabel})
                </th>
                <th className="py-3 pr-3 text-right font-semibold">
                  Bulan Lalu ({prevMonth.shortLabel})
                </th>
                <th className="py-3 pr-3 text-right font-semibold">
                  Perubahan MoM
                </th>
                <th className="py-3 pr-3 text-right font-semibold">
                  Tahun Lalu ({sameMonthLastYear.shortLabel})
                </th>
                <th className="py-3 text-right font-semibold">
                  Perubahan YoY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {/* Pemasukan */}
              <tr className="hover:bg-black/[0.02]">
                <td className="py-3.5 pr-3 font-semibold text-ink flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-income" />
                  Total Pemasukan
                </td>
                <td className="py-3.5 pr-3 text-right font-bold font-data text-income">
                  {<PrivacyNumber value={current.income} />}
                </td>
                <td className="py-3.5 pr-3 text-right font-medium font-data text-muted-ink">
                  {<PrivacyNumber value={prevMonth.income} />}
                </td>
                <td className="py-3.5 pr-3 text-right">
                  {renderIncomeChangeBadge(momIncomeDiff, momIncomePct)}
                </td>
                <td className="py-3.5 pr-3 text-right font-medium font-data text-muted-ink">
                  {<PrivacyNumber value={sameMonthLastYear.income} />}
                </td>
                <td className="py-3.5 text-right">
                  {renderIncomeChangeBadge(yoyIncomeDiff, yoyIncomePct)}
                </td>
              </tr>

              {/* Pengeluaran */}
              <tr className="hover:bg-black/[0.02]">
                <td className="py-3.5 pr-3 font-semibold text-ink flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-expense" />
                  Total Pengeluaran
                </td>
                <td className="py-3.5 pr-3 text-right font-bold font-data text-expense">
                  {<PrivacyNumber value={current.expense} />}
                </td>
                <td className="py-3.5 pr-3 text-right font-medium font-data text-muted-ink">
                  {<PrivacyNumber value={prevMonth.expense} />}
                </td>
                <td className="py-3.5 pr-3 text-right">
                  {renderExpenseChangeBadge(momExpenseDiff, momExpensePct)}
                </td>
                <td className="py-3.5 pr-3 text-right font-medium font-data text-muted-ink">
                  {<PrivacyNumber value={sameMonthLastYear.expense} />}
                </td>
                <td className="py-3.5 text-right">
                  {renderExpenseChangeBadge(yoyExpenseDiff, yoyExpensePct)}
                </td>
              </tr>

              {/* Arus Bersih (Net) */}
              <tr className="hover:bg-black/[0.02] bg-black/[0.01]">
                <td className="py-3.5 pr-3 font-bold text-ink flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Arus Kas Bersih (Tabungan)
                </td>
                <td
                  className={`py-3.5 pr-3 text-right font-extrabold font-data ${
                    current.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {<PrivacyNumber value={current.net} />}
                </td>
                <td className="py-3.5 pr-3 text-right font-medium font-data text-muted-ink">
                  {<PrivacyNumber value={prevMonth.net} />}
                </td>
                <td className="py-3.5 pr-3 text-right">
                  {renderNetChangeBadge(current.net, prevMonth.net)}
                </td>
                <td className="py-3.5 pr-3 text-right font-medium font-data text-muted-ink">
                  {<PrivacyNumber value={sameMonthLastYear.net} />}
                </td>
                <td className="py-3.5 text-right">
                  {renderNetChangeBadge(current.net, sameMonthLastYear.net)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
