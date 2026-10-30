"use client";

/**
 * CashflowArea — AreaChart 30 hari terakhir bergaya "Fresh Earthy".
 * Dipakai HANYA untuk visual dashboard (murni turunan dari data store,
 * tidak menyentuh logic keuangan apa pun):
 *  - fill gradient olive (#647637 @20% → transparan), stroke #647637
 *  - tanpa grid lines kasar; sumbu berwarna #B4B2A0 dengan font kecil
 */
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatIDR, formatIDRCompact } from "@/lib/utils";
import type { DayPoint } from "@/lib/selectors";

interface CashflowAreaProps {
  /** Data arus kas harian (dinormalisasi ke angka agar bebas undefined). */
  data: DayPoint[];
}

export function CashflowArea({ data }: CashflowAreaProps) {
  // Normalisasi ringan — hanya untuk render chart (bukan mengubah data store).
  const series = data.map((d) => ({
    label: d.label,
    Pemasukan: Number(d.income ?? 0),
    Pengeluaran: Number(d.expense ?? 0),
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            {/* Gradient earthy: hijau olive memudar ke transparan */}
            <linearGradient id="fillIncomeEarthy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#647637" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#647637" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillExpenseEarthy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BB622E" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#BB622E" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Sumbu halus — tanpa axisLine/tickLine, warna soft #B4B2A0 */}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#B4B2A0", fontFamily: "var(--font-data)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v: number) => formatIDRCompact(v)}
            tick={{ fontSize: 11, fill: "#B4B2A0", fontFamily: "var(--font-data)" }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #E5E5E0",
              boxShadow: "0 8px 30px rgba(0,0,0,.08)",
              fontSize: 12,
              fontFamily: "var(--font-ui)",
            }}
            formatter={(value) => [formatIDR(Number(value)), ""]}
            labelStyle={{ color: "#162701", fontWeight: 700 }}
          />

          {/* Dua area bertumpuk visual: pemasukan (olive) & pengeluaran (terracotta) */}
          <Area
            type="monotone"
            dataKey="Pemasukan"
            stroke="#647637"
            strokeWidth={2.5}
            fill="url(#fillIncomeEarthy)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="Pengeluaran"
            stroke="#BB622E"
            strokeWidth={2}
            strokeDasharray="0"
            fill="url(#fillExpenseEarthy)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
