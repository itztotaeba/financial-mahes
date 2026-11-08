"use client";

import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, Button, Input, Label, Badge } from "@/components/ui/primitives";
import { Transaction } from "@/types";
import { formatIDR, todayISO, dateOnly } from "@/lib/utils";
import { exportFinancialReportToXLSX, filterTransactionsByDate } from "@/lib/exportExcel";

interface ExportExcelCardProps {
  transactions: Transaction[];
  userEmail?: string | null;
  onSuccess?: (msg: string) => void;
}

type PeriodOption = "all" | "this_month" | "last_month" | "this_year" | "custom";

export function ExportExcelCard({ transactions, userEmail, onSuccess }: ExportExcelCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Hitung rentang tanggal berdasarkan pilihan periode
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    const pad = (n: number) => String(n).padStart(2, "0");

    if (selectedPeriod === "this_month") {
      const start = `${year}-${pad(month + 1)}-01`;
      // hari terakhir bulan ini
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
      const label = `Bulan Ini (${today.toLocaleDateString("id-ID", { month: "long", year: "numeric" })})`;
      return { startDate: start, endDate: end, periodLabel: label };
    }

    if (selectedPeriod === "last_month") {
      const prevDate = new Date(year, month - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth();
      const start = `${prevYear}-${pad(prevMonth + 1)}-01`;
      const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      const end = `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDay)}`;
      const label = `Bulan Lalu (${prevDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })})`;
      return { startDate: start, endDate: end, periodLabel: label };
    }

    if (selectedPeriod === "this_year") {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const label = `Tahun Berjalan (${year})`;
      return { startDate: start, endDate: end, periodLabel: label };
    }

    if (selectedPeriod === "custom") {
      const label =
        customStart && customEnd
          ? `Periode ${customStart} s/d ${customEnd}`
          : customStart
          ? `Mulai ${customStart}`
          : customEnd
          ? `Hingga ${customEnd}`
          : "Periode Khusus";
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
        periodLabel: label,
      };
    }

    // Default: "all"
    return {
      startDate: undefined,
      endDate: undefined,
      periodLabel: "Semua Riwayat Transaksi",
    };
  }, [selectedPeriod, customStart, customEnd]);

  // Transaksi yang tersaring sesuai periode
  const filtered = useMemo(() => {
    return filterTransactionsByDate(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  // Ringkasan nominal
  const summary = useMemo(() => {
    const inc = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      count: filtered.length,
    };
  }, [filtered]);

  // Eksekusi Export ke Excel
  const handleExport = async () => {
    if (filtered.length === 0) return;

    try {
      setIsExporting(true);
      setExportSuccess(false);

      const dateStr = todayISO();
      const filenameSuffix =
        selectedPeriod === "this_month"
          ? `Bulan_Ini_${dateStr.slice(0, 7)}`
          : selectedPeriod === "last_month"
          ? "Bulan_Lalu"
          : selectedPeriod === "this_year"
          ? `Tahun_${new Date().getFullYear()}`
          : selectedPeriod === "custom" && startDate && endDate
          ? `${startDate}_sd_${endDate}`
          : dateStr;

      const filename = `Financial_Mahes_Laporan_${filenameSuffix}.xlsx`;

      await exportFinancialReportToXLSX(transactions, {
        startDate,
        endDate,
        periodLabel,
        userEmail,
        filename,
      });

      setExportSuccess(true);
      onSuccess?.(`Laporan "${filename}" berhasil diunduh!`);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error("Gagal mengekspor file Excel:", err);
      alert("Terjadi kendala saat menyusun file Excel. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-white/95 via-white/85 to-emerald-50/30">
      <div className="flex items-start gap-3">
        {/* Ikon Header */}
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20">
          <FileSpreadsheet size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-ink">Ekspor Laporan Excel (.xlsx)</h2>
            <Badge className="bg-emerald-500/10 text-emerald-700 font-medium border border-emerald-500/20">
              <Sparkles size={11} className="mr-0.5 inline text-emerald-600" /> Format Rapi & Berwarna
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-ink">
            Unduh laporan keuangan berstandar profesional lengkap dengan{" "}
            <b className="text-ink font-semibold">Ringkasan Eksekutif</b>, KPI card, rekap bulanan, analisa kategori, serta{" "}
            <b className="text-ink font-semibold">Buku Besar Transaksi</b> dengan AutoFilter & formula otomatis.
          </p>

          {/* Pemilihan Periode */}
          <div className="mt-4 space-y-2">
            <Label className="text-[11px] font-semibold text-muted-ink flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" /> Pilih Periode Laporan:
            </Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {[
                { key: "all", label: "Semua Waktu" },
                { key: "this_month", label: "Bulan Ini" },
                { key: "last_month", label: "Bulan Lalu" },
                { key: "this_year", label: "Tahun Ini" },
                { key: "custom", label: "Kustom" },
              ].map((p) => {
                const isActive = selectedPeriod === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedPeriod(p.key as PeriodOption)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-ink text-white shadow-sm ring-1 ring-black/10"
                        : "bg-black/[0.04] text-muted-ink hover:bg-black/[0.08] hover:text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Input Tanggal Kustom bila dipilih */}
            {selectedPeriod === "custom" && (
              <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-2xl bg-black/[0.02] p-3 sm:grid-cols-2 border border-black/5">
                <div>
                  <Label className="text-[10px]">Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="text-xs py-1.5"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="text-xs py-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kotak Ringkasan Data yang Akan Diekspor */}
          <div className="mt-4 rounded-2xl border border-black/5 bg-black/[0.02] p-3 text-xs">
            <div className="flex items-center justify-between border-b border-black/5 pb-2 text-muted-ink">
              <span className="font-medium">Cakupan Data Terpilih</span>
              <span className="font-data font-semibold text-ink">
                {summary.count} transaksi ({periodLabel})
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center sm:text-left">
              <div className="rounded-xl bg-income/10 p-2 border border-income/15">
                <p className="text-[10px] font-semibold text-income uppercase tracking-wider">Pemasukan</p>
                <p className="font-data mt-0.5 text-xs font-bold text-income truncate">
                  {formatIDR(summary.income)}
                </p>
              </div>

              <div className="rounded-xl bg-expense/10 p-2 border border-expense/15">
                <p className="text-[10px] font-semibold text-expense uppercase tracking-wider">Pengeluaran</p>
                <p className="font-data mt-0.5 text-xs font-bold text-expense truncate">
                  {formatIDR(summary.expense)}
                </p>
              </div>

              <div className="rounded-xl bg-primary/10 p-2 border border-primary/15">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Saldo Bersih</p>
                <p className="font-data mt-0.5 text-xs font-bold text-primary truncate">
                  {formatIDR(summary.net)}
                </p>
              </div>
            </div>
          </div>

          {/* Fitur lembar kerja yang disertakan */}
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-ink">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-800">
              ✓ Multi-sheet (Ringkasan + Transaksi)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-800">
              ✓ AutoFilter & Freeze Header
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-800">
              ✓ Formula Otomatis (SUM & Net)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-800">
              ✓ Format Rupiah Akuntansi
            </span>
          </div>

          {/* Tombol Ekspor */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleExport}
              disabled={isExporting || summary.count === 0}
              className="bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isExporting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Menyiapkan File Excel…
                </>
              ) : (
                <>
                  <Download size={15} /> Unduh Laporan Excel (.xlsx)
                </>
              )}
            </Button>

            {summary.count === 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-ink">
                <AlertCircle size={13} className="text-amber-500" /> Belum ada transaksi untuk periode ini.
              </span>
            )}

            {exportSuccess && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 animate-in fade-in">
                <CheckCircle2 size={15} className="text-emerald-600" /> File Excel berhasil diunduh!
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
