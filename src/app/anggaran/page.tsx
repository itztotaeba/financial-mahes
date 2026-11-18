"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { openMobileMenu } from "@/lib/menu";
import { useFinanceStore } from "@/store/useFinanceStore";
import { BudgetAlerts } from "@/components/budget/BudgetAlerts";
import { CategoryBudgetList } from "@/components/budget/CategoryBudgetList";
import { SavingsGoalsSection } from "@/components/savings/SavingsGoalsSection";
import { PeriodComparison } from "@/components/comparison/PeriodComparison";
import { PieChart, Target, BarChart2, Calendar } from "lucide-react";
import { todayISO, dateOnly } from "@/lib/utils";

type TabKey = "anggaran" | "tabungan" | "perbandingan";

export default function AnggaranPage() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const [activeTab, setActiveTab] = useState<TabKey>("anggaran");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dateOnly(todayISO()).slice(0, 7)
  );

  return (
    <>
      <Header
        title="Anggaran & Kontrol"
        subtitle="Kelola batas anggaran per kategori, target tabungan & perbandingan periode"
        onMenuClick={openMobileMenu}
      />

      {!hydrated ? (
        <div className="grid min-h-[50vh] place-items-center text-sm text-muted-ink">
          Memuat data anggaran…
        </div>
      ) : (
        <div className="space-y-5 pb-20 lg:pb-6">
          {/* Navigasi Tab Fitur */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/60 bg-white/70 p-1.5 shadow-glass backdrop-blur-xl">
              <button
                onClick={() => setActiveTab("anggaran")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "anggaran"
                    ? "bg-primary text-white shadow-glass"
                    : "text-ink/70 hover:bg-black/5 hover:text-ink"
                }`}
              >
                <PieChart size={15} />
                Anggaran Kategori
              </button>

              <button
                onClick={() => setActiveTab("tabungan")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "tabungan"
                    ? "bg-primary text-white shadow-glass"
                    : "text-ink/70 hover:bg-black/5 hover:text-ink"
                }`}
              >
                <Target size={15} />
                Target Tabungan
              </button>

              <button
                onClick={() => setActiveTab("perbandingan")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "perbandingan"
                    ? "bg-primary text-white shadow-glass"
                    : "text-ink/70 hover:bg-black/5 hover:text-ink"
                }`}
              >
                <BarChart2 size={15} />
                Perbandingan Periode
              </button>
            </div>

            {/* Pemilih Bulan (Khusus Tab Anggaran & Perbandingan) */}
            {activeTab !== "tabungan" && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs font-medium text-muted-ink flex items-center gap-1">
                  <Calendar size={13} /> Bulan:
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
            )}
          </div>

          {/* Konten Tab 1: Anggaran per Kategori & Peringatan Pengeluaran */}
          {activeTab === "anggaran" && (
            <div className="space-y-4">
              {/* Peringatan Pengeluaran Melebihi Anggaran (Fitur 2) */}
              <BudgetAlerts month={selectedMonth} />

              {/* Daftar Semua Kategori Beserta Anggaran & Sisa (Fitur 1) */}
              <CategoryBudgetList month={selectedMonth} />
            </div>
          )}

          {/* Konten Tab 2: Tabungan & Target Tujuan (Fitur 3) */}
          {activeTab === "tabungan" && (
            <div className="space-y-4">
              <SavingsGoalsSection />
            </div>
          )}

          {/* Konten Tab 3: Perbandingan Periode (Fitur 4) */}
          {activeTab === "perbandingan" && (
            <div className="space-y-4">
              <PeriodComparison initialMonth={selectedMonth} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
