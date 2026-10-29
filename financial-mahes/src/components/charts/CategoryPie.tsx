"use client";

/**
 * Wawasan Perilaku: Pie chart distribusi kategori pengeluaran + legend.
 */
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import type { CategorySlice } from "@/lib/selectors";

export function CategoryPie({ data }: { data: CategorySlice[] }) {
  const top = data.slice(0, 6); // batasi agar tetap mudah dipindai
  const othersValue = data.slice(6).reduce((a, b) => a + b.value, 0);
  const chartData =
    othersValue > 0
      ? [...top, { name: "Lainnya", value: othersValue, color: "#C8ACC0", percent: 0 }]
      : top;

  return (
    <Card className="h-full">
      <div className="mb-2">
        <h2 className="text-base font-bold text-[#151516]">Wawasan Perilaku</h2>
        <p className="text-xs text-black/45">Distribusi pengeluaran per kategori</p>
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
                  <Cell key={i} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [formatIDR(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total di tengah donut */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-black/40">Total</p>
              <p className="max-w-[90px] truncate text-sm font-extrabold text-[#151516]">
                {formatIDR(chartData.reduce((a, b) => a + b.value, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <ul className="w-full space-y-2">
          {chartData.map((slice) => (
            <li key={slice.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-[#151516]/80">{slice.name}</span>
              </span>
              <span className="shrink-0 font-semibold text-[#151516]">
                {slice.percent ? `${slice.percent.toFixed(0)}%` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
