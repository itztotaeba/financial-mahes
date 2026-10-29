"use client";

/**
 * Grafik Cashflow 30 hari terakhir (recharts): batang pemasukan vs pengeluaran.
 */
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
import { Card } from "@/components/ui/primitives";
import { formatIDR, formatIDRCompact } from "@/lib/utils";
import type { DayPoint } from "@/lib/selectors";

export function CashflowChart({ data }: { data: DayPoint[] }) {
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#151516]">Arus Kas</h2>
          <p className="text-xs text-black/45">Tren harian · 30 hari terakhir</p>
        </div>
        <span className="rounded-full bg-[#2141E0]/10 px-3 py-1 text-xs font-semibold text-[#2141E0]">
          Harian
        </span>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#00000010" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#151516", opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v: number) => formatIDRCompact(v)}
              tick={{ fontSize: 11, fill: "#151516", opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ fill: "#2141E008" }}
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                formatIDR(value),
                name === "income" ? "Pemasukan" : "Pengeluaran",
              ]}
              labelFormatter={(label: string) => `Tanggal ${label}`}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs font-medium text-[#151516]">
                  {value === "income" ? "Pemasukan" : "Pengeluaran"}
                </span>
              )}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="income" fill="#4FB279" radius={[4, 4, 0, 0]} maxBarSize={10} />
            <Bar dataKey="expense" fill="#D3534C" radius={[4, 4, 0, 0]} maxBarSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
