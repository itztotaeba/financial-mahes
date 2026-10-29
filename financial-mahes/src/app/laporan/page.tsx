"use client";

/**
 * Halaman Laporan: tren bulanan (bar chart) + tabel rekap per kategori.
 */
import { useMemo } from "react";
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
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/primitives";
import { useFinanceStore } from "@/store/useFinanceStore";
import { CATEGORY_MAP } from "@/types";
import { formatIDR, formatIDRCompact } from "@/lib/utils";

export default function LaporanPage() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const transactions = useFinanceStore((s) => s.transactions);

  // ---- Rekap per bulan (maks 6 bulan terakhir yang ada datanya) ----
  const monthly = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const key = t.date.slice(0, 7); // YYYY-MM
      map[key] ??= { income: 0, expense: 0 };
      if (t.type === "income") map[key].income += t.amount;
      else map[key].expense += t.amount;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => ({
        label: new Date(`${key}-01T00:00:00`).toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        }),
        Pemasukan: v.income,
        Pengeluaran: v.expense,
      }));
  }, [transactions]);

  // ---- Rekap kategori (seluruh periode) ----
  const byCategory = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    for (const t of transactions) {
      map[t.category] ??= { income: 0, expense: 0, count: 0 };
      if (t.type === "income") map[t.category].income += t.amount;
      else map[t.category].expense += t.amount;
      map[t.category].count++;
    }
    return Object.entries(map)
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.expense + b.income - (a.expense + a.income));
  }, [transactions]);

  const openMenu = () => window.dispatchEvent(new Event("mahes:open-menu"));

  return (
    <>
      <Header title="Laporan" subtitle="Analisa bulanan & perilaku belanja" onMenuClick={openMenu} />

      {!hydrated ? (
        <div className="grid min-h-[50vh] place-items-center text-sm text-black/40">
          Memuat data lokal…
        </div>
      ) : (
        <div className="space-y-4 pb-20 lg:pb-4">
          {/* Tren bulanan */}
          <Card>
            <h2 className="text-base font-bold text-[#151516]">Tren Bulanan</h2>
            <p className="mb-4 text-xs text-black/45">Pemasukan vs pengeluaran per bulan</p>
            <div className="h-64 w-full sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#151516", opacity: 0.6 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatIDRCompact(v)}
                    tick={{ fontSize: 11, fill: "#151516", opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                      fontSize: 12,
                    }}
                    formatter={(value) => formatIDR(Number(value))}
                  />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="Pemasukan" fill="#4FB279" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Pengeluaran" fill="#D3534C" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Tabel rekap kategori */}
          <Card>
            <h2 className="mb-1 text-base font-bold text-[#151516]">Rekap per Kategori</h2>
            <p className="mb-4 text-xs text-black/45">Total nominal sepanjang periode tercatat</p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/45">
                    <th className="py-2.5 pr-3 font-semibold">Kategori</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Transaksi</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Pemasukan</th>
                    <th className="py-2.5 text-right font-semibold">Pengeluaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {byCategory.map((row) => {
                    const info = CATEGORY_MAP[row.key] ?? CATEGORY_MAP.lainnya;
                    return (
                      <tr key={row.key} className="hover:bg-black/[0.02]">
                        <td className="py-3 pr-3">
                          <span className="flex items-center gap-2 font-semibold text-[#151516]">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: info.color }}
                            />
                            {info.emoji} {info.label}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums text-black/60">
                          {row.count}
                        </td>
                        <td className="py-3 pr-3 text-right font-semibold tabular-nums text-[#4FB279]">
                          {row.income > 0 ? formatIDR(row.income) : "—"}
                        </td>
                        <td className="py-3 text-right font-semibold tabular-nums text-[#D3534C]">
                          {row.expense > 0 ? formatIDR(row.expense) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
