"use client";

/**
 * Wawasan Perilaku: Pie chart distribusi kategori pengeluaran + legend.
 */
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import type { CategorySlice } from "@/lib/selectors";

export function CategoryPie({ data }: { data: CategorySlice[] }) {
  /** Palet earthy untuk slice donut (urutan prioritas). */
  const EARTHY = ["#647637", "#C6B54F", "#BB622E", "#74864B"];

  const top = data.slice(0, 6); // batasi agar tetap mudah dipindai
  const othersValue = data.slice(6).reduce((a, b) => a + b.value, 0);
  const chartData =
    othersValue > 0
      ? [...top, { name: "Lainnya", value: othersValue, color: "#B4B2A0", percent: 0 }]
      : top;

  return (
    <Card className="h-full">
      <div className="mb-2">
        <h2 className="text-base font-bold text-ink">Wawasan Perilaku</h2>
        <p className="text-xs text-muted-ink">Distribusi pengeluaran per kategori</p>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((slice, i) => (
                  /* Slice memakai palet earthy berurutan agar konsisten */
                  <Cell key={i} fill={EARTHY[i % EARTHY.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                  fontSize: 12,
                }}
                formatter={(value, name) => [formatIDR(Number(value)), String(name)]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total di tengah donut */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-ink">Total</p>
              <p className="font-data max-w-[90px] truncate text-sm font-extrabold text-ink">
                {formatIDR(chartData.reduce((a, b) => a + b.value, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <ul className="w-full space-y-2">
          {chartData.map((slice, i) => (
            <li key={slice.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: EARTHY[i % EARTHY.length] }}
                />
                <span className="truncate text-ink/80">{slice.name}</span>
              </span>
              <span className="font-data shrink-0 font-semibold text-ink">
                {slice.percent ? `${slice.percent.toFixed(0)}%` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
