import ExcelJS from "exceljs";
import { Transaction, CATEGORY_MAP } from "@/types";
import { dateOnly, parseDate } from "./utils";

export interface ExportExcelOptions {
  periodLabel?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  userEmail?: string | null;
  filename?: string;
}

/**
 * Palet warna tema Financial Mahes untuk styling lembar kerja Excel
 */
const COLORS = {
  headerBg: "0F172A", // Dark Slate 900
  headerText: "FFFFFF",
  subHeaderBg: "1E293B", // Slate 800
  accentBlue: "2563EB", // Blue 600
  accentBlueBg: "EFF6FF", // Blue 50
  incomeGreen: "059669", // Emerald 600
  incomeBg: "ECFDF5", // Emerald 50
  expenseRed: "DC2626", // Red 600
  expenseBg: "FEF2F2", // Red 50
  zebraRowBg: "F8FAFC", // Slate 50
  borderLight: "E2E8F0", // Slate 200
  borderMedium: "94A3B8", // Slate 400
  textDark: "1E293B", // Slate 800
  textMuted: "64748B", // Slate 500
};

/** Format akuntansi Rupiah standar Excel */
const CURRENCY_FORMAT = '"Rp"#,##0;("Rp"#,##0);"-"';
const PERCENT_FORMAT = "0.0%";
const NUMBER_FORMAT = "#,##0";

/**
 * Filter transaksi berdasarkan rentang tanggal bila disediakan.
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): Transaction[] {
  if (!startDate && !endDate) return transactions;

  return transactions.filter((t) => {
    const d = dateOnly(t.date);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
}

/**
 * Buat dan unduh file Excel (.xlsx) dengan tata letak profesional & elegan
 */
export async function exportFinancialReportToXLSX(
  allTransactions: Transaction[],
  options: ExportExcelOptions = {}
): Promise<void> {
  const { startDate, endDate, userEmail } = options;

  // Filter transaksi berdasarkan rentang tanggal
  const transactions = filterTransactionsByDate(allTransactions, startDate, endDate)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Hitung metrik agregat
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) : 0;

  // Inisialisasi Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Financial Mahes";
  workbook.lastModifiedBy = userEmail || "Financial Mahes App";
  workbook.created = new Date();
  workbook.modified = new Date();

  // =========================================================================
  // SHEET 1: RINGKASAN EKSEKUTIF (DASHBOARD)
  // =========================================================================
  const wsSummary = workbook.addWorksheet("Ringkasan Eksekutif", {
    properties: { tabColor: { argb: "FF2563EB" } },
    views: [{ showGridLines: true }],
  });

  // Atur lebar kolom Ringkasan
  wsSummary.columns = [
    { width: 4 },  // A - Padding
    { width: 22 }, // B - Metrik / Kategori / Bulan
    { width: 18 }, // C - Pemasukan
    { width: 18 }, // D - Pengeluaran
    { width: 20 }, // E - Arus Kas Bersih / Nominal
    { width: 16 }, // F - Rasio / Persentase
    { width: 16 }, // G - Keterangan / Status
    { width: 4 },  // H - Padding
  ];

  // Header Banner Aplikasi (Merged B2:G3)
  wsSummary.mergeCells("B2:G3");
  const bannerCell = wsSummary.getCell("B2");
  bannerCell.value = "FINANCIAL MAHES  •  LAPORAN KEUANGAN";
  bannerCell.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  bannerCell.alignment = { horizontal: "center", vertical: "middle" };
  bannerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${COLORS.headerBg}` },
  };

  // Subtitle (B4:G4)
  wsSummary.mergeCells("B4:G4");
  const subtitleCell = wsSummary.getCell("B4");
  const periodText = options.periodLabel
    ? options.periodLabel
    : startDate && endDate
    ? `Periode: ${startDate} s/d ${endDate}`
    : "Periode: Semua Riwayat Transaksi";
  subtitleCell.value = `${periodText}  |  Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  subtitleCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: `FF${COLORS.textMuted}` } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Status Akun / Pengguna (B5:G5)
  wsSummary.mergeCells("B5:G5");
  const userCell = wsSummary.getCell("B5");
  userCell.value = `Akun: ${userEmail || "Penyimpanan Perangkat Lokal"}  •  Total Transaksi Tercatat: ${transactions.length}`;
  userCell.font = { name: "Segoe UI", size: 9, color: { argb: `FF${COLORS.textMuted}` } };
  userCell.alignment = { horizontal: "center", vertical: "middle" };

  // --- KPI CARDS (B7:G9) ---
  // Card 1: TOTAL PEMASUKAN (B7:C8)
  wsSummary.mergeCells("B7:C7");
  const kpiIncLabel = wsSummary.getCell("B7");
  kpiIncLabel.value = "TOTAL PEMASUKAN";
  kpiIncLabel.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: `FF${COLORS.incomeGreen}` } };
  kpiIncLabel.alignment = { horizontal: "center", vertical: "middle" };
  kpiIncLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.incomeBg}` } };

  wsSummary.mergeCells("B8:C8");
  const kpiIncVal = wsSummary.getCell("B8");
  kpiIncVal.value = totalIncome;
  kpiIncVal.numFmt = CURRENCY_FORMAT;
  kpiIncVal.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: `FF${COLORS.incomeGreen}` } };
  kpiIncVal.alignment = { horizontal: "center", vertical: "middle" };
  kpiIncVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.incomeBg}` } };

  // Card 2: TOTAL PENGELUARAN (D7:E8)
  wsSummary.mergeCells("D7:E7");
  const kpiExpLabel = wsSummary.getCell("D7");
  kpiExpLabel.value = "TOTAL PENGELUARAN";
  kpiExpLabel.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: `FF${COLORS.expenseRed}` } };
  kpiExpLabel.alignment = { horizontal: "center", vertical: "middle" };
  kpiExpLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.expenseBg}` } };

  wsSummary.mergeCells("D8:E8");
  const kpiExpVal = wsSummary.getCell("D8");
  kpiExpVal.value = totalExpense;
  kpiExpVal.numFmt = CURRENCY_FORMAT;
  kpiExpVal.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: `FF${COLORS.expenseRed}` } };
  kpiExpVal.alignment = { horizontal: "center", vertical: "middle" };
  kpiExpVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.expenseBg}` } };

  // Card 3: SALDO BERSIH (F7:G8)
  wsSummary.mergeCells("F7:G7");
  const kpiNetLabel = wsSummary.getCell("F7");
  kpiNetLabel.value = "SALDO BERSIH (NET CASHFLOW)";
  kpiNetLabel.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: `FF${COLORS.accentBlue}` } };
  kpiNetLabel.alignment = { horizontal: "center", vertical: "middle" };
  kpiNetLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.accentBlueBg}` } };

  wsSummary.mergeCells("F8:G8");
  const kpiNetVal = wsSummary.getCell("F8");
  kpiNetVal.value = netSavings;
  kpiNetVal.numFmt = CURRENCY_FORMAT;
  kpiNetVal.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: `FF${COLORS.accentBlue}` } };
  kpiNetVal.alignment = { horizontal: "center", vertical: "middle" };
  kpiNetVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.accentBlueBg}` } };

  // Border untuk KPI Cards
  ["B7", "C7", "B8", "C8"].forEach((pos) => {
    wsSummary.getCell(pos).border = {
      top: { style: "thin", color: { argb: "FFA7F3D0" } },
      left: { style: "thin", color: { argb: "FFA7F3D0" } },
      bottom: { style: "thin", color: { argb: "FFA7F3D0" } },
      right: { style: "thin", color: { argb: "FFA7F3D0" } },
    };
  });
  ["D7", "E7", "D8", "E8"].forEach((pos) => {
    wsSummary.getCell(pos).border = {
      top: { style: "thin", color: { argb: "FFFECACA" } },
      left: { style: "thin", color: { argb: "FFFECACA" } },
      bottom: { style: "thin", color: { argb: "FFFECACA" } },
      right: { style: "thin", color: { argb: "FFFECACA" } },
    };
  });
  ["F7", "G7", "F8", "G8"].forEach((pos) => {
    wsSummary.getCell(pos).border = {
      top: { style: "thin", color: { argb: "FFBFDBFE" } },
      left: { style: "thin", color: { argb: "FFBFDBFE" } },
      bottom: { style: "thin", color: { argb: "FFBFDBFE" } },
      right: { style: "thin", color: { argb: "FFBFDBFE" } },
    };
  });

  // Rasio Tabungan Info Banner (B9:G9)
  wsSummary.mergeCells("B9:G9");
  const savingCell = wsSummary.getCell("B9");
  const savingPctText = (savingsRate * 100).toFixed(1);
  savingCell.value = `Rasio Tabungan (Savings Rate): ${savingPctText}%  •  Kondisi Arus Kas: ${
    netSavings >= 0 ? "Surplus (Sehat)" : "Defisit (Perlu Penghematan)"
  }`;
  savingCell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: `FF${COLORS.textDark}` } };
  savingCell.alignment = { horizontal: "center", vertical: "middle" };
  savingCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  savingCell.border = {
    top: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
    bottom: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
  };

  // --- SECTION: REKAP BULANAN ---
  let currentRow = 11;
  wsSummary.mergeCells(`B${currentRow}:G${currentRow}`);
  const secMonthly = wsSummary.getCell(`B${currentRow}`);
  secMonthly.value = "1. REKAPITULASI ARUS KAS BULANAN";
  secMonthly.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: `FF${COLORS.headerBg}` } };
  secMonthly.alignment = { horizontal: "left", vertical: "middle" };
  currentRow++;

  // Header Rekap Bulanan
  const monthlyHeaders = ["Bulan", "Pemasukan", "Pengeluaran", "Arus Kas Bersih", "Rasio Tabungan", "Status"];
  const monthlyCols = ["B", "C", "D", "E", "F", "G"];
  const mHeaderRow = wsSummary.getRow(currentRow);
  mHeaderRow.height = 24;

  monthlyHeaders.forEach((text, idx) => {
    const cell = wsSummary.getCell(`${monthlyCols[idx]}${currentRow}`);
    cell.value = text;
    cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.headerText}` } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.subHeaderBg}` } };
    cell.alignment = {
      horizontal: idx === 0 ? "left" : idx === 5 ? "center" : "right",
      vertical: "middle",
    };
    cell.border = {
      top: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
      bottom: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
    };
  });
  currentRow++;

  // Hitung data bulanan
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  for (const t of transactions) {
    const key = dateOnly(t.date).slice(0, 7); // YYYY-MM
    monthlyMap[key] ??= { income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[key].income += t.amount;
    else monthlyMap[key].expense += t.amount;
  }

  const sortedMonths = Object.keys(monthlyMap).sort();
  const mStartRow = currentRow;

  if (sortedMonths.length === 0) {
    wsSummary.mergeCells(`B${currentRow}:G${currentRow}`);
    const emptyCell = wsSummary.getCell(`B${currentRow}`);
    emptyCell.value = "Belum ada transaksi dalam periode ini.";
    emptyCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: `FF${COLORS.textMuted}` } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    currentRow++;
  } else {
    sortedMonths.forEach((mKey, idx) => {
      const v = monthlyMap[mKey];
      const row = wsSummary.getRow(currentRow);
      row.height = 20;

      // Label Bulan
      const dateObj = new Date(`${mKey}-01T00:00:00`);
      const monthLabel = !Number.isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
        : mKey;

      const cellB = wsSummary.getCell(`B${currentRow}`);
      cellB.value = monthLabel;
      cellB.alignment = { horizontal: "left", vertical: "middle" };

      const cellC = wsSummary.getCell(`C${currentRow}`);
      cellC.value = v.income;
      cellC.numFmt = CURRENCY_FORMAT;
      cellC.alignment = { horizontal: "right", vertical: "middle" };

      const cellD = wsSummary.getCell(`D${currentRow}`);
      cellD.value = v.expense;
      cellD.numFmt = CURRENCY_FORMAT;
      cellD.alignment = { horizontal: "right", vertical: "middle" };

      // Formula Bersih: C - D
      const cellE = wsSummary.getCell(`E${currentRow}`);
      cellE.value = { formula: `C${currentRow}-D${currentRow}` };
      cellE.numFmt = CURRENCY_FORMAT;
      cellE.alignment = { horizontal: "right", vertical: "middle" };
      cellE.font = {
        name: "Segoe UI",
        size: 9.5,
        bold: true,
        color: { argb: v.income >= v.expense ? `FF${COLORS.incomeGreen}` : `FF${COLORS.expenseRed}` },
      };

      // Formula Rasio Tabungan: (C - D) / C
      const cellF = wsSummary.getCell(`F${currentRow}`);
      cellF.value = { formula: `IF(C${currentRow}>0, (C${currentRow}-D${currentRow})/C${currentRow}, 0)` };
      cellF.numFmt = PERCENT_FORMAT;
      cellF.alignment = { horizontal: "right", vertical: "middle" };

      // Status
      const cellG = wsSummary.getCell(`G${currentRow}`);
      cellG.value = { formula: `IF(E${currentRow}>=0, "SURPLUS", "DEFISIT")` };
      cellG.alignment = { horizontal: "center", vertical: "middle" };
      cellG.font = {
        name: "Segoe UI",
        size: 9,
        bold: true,
        color: { argb: v.income >= v.expense ? `FF${COLORS.incomeGreen}` : `FF${COLORS.expenseRed}` },
      };

      // Styling Zebra & Border
      const isEven = idx % 2 === 1;
      monthlyCols.forEach((col) => {
        const c = wsSummary.getCell(`${col}${currentRow}`);
        c.font = c.font || { name: "Segoe UI", size: 9.5 };
        if (isEven) {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.zebraRowBg}` } };
        }
        c.border = {
          bottom: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
          left: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
          right: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
        };
      });

      currentRow++;
    });

    // Total Row Rekap Bulanan
    const mEndRow = currentRow - 1;
    const totRow = wsSummary.getRow(currentRow);
    totRow.height = 22;

    const cellTotLabel = wsSummary.getCell(`B${currentRow}`);
    cellTotLabel.value = "TOTAL KESELURUHAN";
    cellTotLabel.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.textDark}` } };
    cellTotLabel.alignment = { horizontal: "left", vertical: "middle" };

    const cellTotInc = wsSummary.getCell(`C${currentRow}`);
    cellTotInc.value = { formula: `SUM(C${mStartRow}:C${mEndRow})` };
    cellTotInc.numFmt = CURRENCY_FORMAT;
    cellTotInc.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.incomeGreen}` } };
    cellTotInc.alignment = { horizontal: "right", vertical: "middle" };

    const cellTotExp = wsSummary.getCell(`D${currentRow}`);
    cellTotExp.value = { formula: `SUM(D${mStartRow}:D${mEndRow})` };
    cellTotExp.numFmt = CURRENCY_FORMAT;
    cellTotExp.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.expenseRed}` } };
    cellTotExp.alignment = { horizontal: "right", vertical: "middle" };

    const cellTotNet = wsSummary.getCell(`E${currentRow}`);
    cellTotNet.value = { formula: `C${currentRow}-D${currentRow}` };
    cellTotNet.numFmt = CURRENCY_FORMAT;
    cellTotNet.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.accentBlue}` } };
    cellTotNet.alignment = { horizontal: "right", vertical: "middle" };

    const cellTotRatio = wsSummary.getCell(`F${currentRow}`);
    cellTotRatio.value = { formula: `IF(C${currentRow}>0, (C${currentRow}-D${currentRow})/C${currentRow}, 0)` };
    cellTotRatio.numFmt = PERCENT_FORMAT;
    cellTotRatio.font = { name: "Segoe UI", size: 9.5, bold: true };
    cellTotRatio.alignment = { horizontal: "right", vertical: "middle" };

    const cellTotStatus = wsSummary.getCell(`G${currentRow}`);
    cellTotStatus.value = { formula: `IF(E${currentRow}>=0, "SURPLUS", "DEFISIT")` };
    cellTotStatus.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.accentBlue}` } };
    cellTotStatus.alignment = { horizontal: "center", vertical: "middle" };

    monthlyCols.forEach((col) => {
      const c = wsSummary.getCell(`${col}${currentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      c.border = {
        top: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
        bottom: { style: "double", color: { argb: `FF${COLORS.headerBg}` } },
      };
    });
    currentRow++;
  }

  // --- SECTION: REKAP KATEGORI ---
  currentRow += 2;
  wsSummary.mergeCells(`B${currentRow}:G${currentRow}`);
  const secCategory = wsSummary.getCell(`B${currentRow}`);
  secCategory.value = "2. REKAPITULASI MENURUT KATEGORI";
  secCategory.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: `FF${COLORS.headerBg}` } };
  secCategory.alignment = { horizontal: "left", vertical: "middle" };
  currentRow++;

  // Header Rekap Kategori
  const catHeaders = ["Kategori", "Tipe", "Jml Transaksi", "Pemasukan", "Pengeluaran", "Kontribusi (%)"];
  const catHeaderRow = wsSummary.getRow(currentRow);
  catHeaderRow.height = 24;

  catHeaders.forEach((text, idx) => {
    const cell = wsSummary.getCell(`${monthlyCols[idx]}${currentRow}`);
    cell.value = text;
    cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.headerText}` } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.subHeaderBg}` } };
    cell.alignment = {
      horizontal: idx <= 1 ? "left" : idx === 2 ? "center" : "right",
      vertical: "middle",
    };
    cell.border = {
      top: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
      bottom: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
    };
  });
  currentRow++;

  // Agregasi kategori
  const catMap: Record<string, { income: number; expense: number; count: number; type: string }> = {};
  for (const t of transactions) {
    catMap[t.category] ??= { income: 0, expense: 0, count: 0, type: t.type };
    if (t.type === "income") catMap[t.category].income += t.amount;
    else catMap[t.category].expense += t.amount;
    catMap[t.category].count++;
  }

  const sortedCategories = Object.entries(catMap).sort(
    ([, a], [, b]) => b.expense + b.income - (a.expense + a.income)
  );

  const catStartRow = currentRow;

  if (sortedCategories.length === 0) {
    wsSummary.mergeCells(`B${currentRow}:G${currentRow}`);
    const emptyCell = wsSummary.getCell(`B${currentRow}`);
    emptyCell.value = "Belum ada transaksi kategori.";
    emptyCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: `FF${COLORS.textMuted}` } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    currentRow++;
  } else {
    sortedCategories.forEach(([catKey, data], idx) => {
      const row = wsSummary.getRow(currentRow);
      row.height = 20;

      const catInfo = CATEGORY_MAP[catKey];
      const catLabel = catInfo?.label || catKey;
      const isExpense = data.expense > 0;

      const cellB = wsSummary.getCell(`B${currentRow}`);
      cellB.value = catLabel;
      cellB.alignment = { horizontal: "left", vertical: "middle" };

      const cellC = wsSummary.getCell(`C${currentRow}`);
      cellC.value = isExpense ? "Pengeluaran" : "Pemasukan";
      cellC.alignment = { horizontal: "left", vertical: "middle" };
      cellC.font = {
        name: "Segoe UI",
        size: 9,
        color: { argb: isExpense ? `FF${COLORS.expenseRed}` : `FF${COLORS.incomeGreen}` },
      };

      const cellD = wsSummary.getCell(`D${currentRow}`);
      cellD.value = data.count;
      cellD.numFmt = NUMBER_FORMAT;
      cellD.alignment = { horizontal: "center", vertical: "middle" };

      const cellE = wsSummary.getCell(`E${currentRow}`);
      cellE.value = data.income > 0 ? data.income : 0;
      cellE.numFmt = CURRENCY_FORMAT;
      cellE.alignment = { horizontal: "right", vertical: "middle" };

      const cellF = wsSummary.getCell(`F${currentRow}`);
      cellF.value = data.expense > 0 ? data.expense : 0;
      cellF.numFmt = CURRENCY_FORMAT;
      cellF.alignment = { horizontal: "right", vertical: "middle" };

      // Kontribusi % terhadap total jenisnya
      const totalDenominator = isExpense ? totalExpense : totalIncome;
      const ratio = totalDenominator > 0 ? ((isExpense ? data.expense : data.income) / totalDenominator) : 0;
      const cellG = wsSummary.getCell(`G${currentRow}`);
      cellG.value = ratio;
      cellG.numFmt = PERCENT_FORMAT;
      cellG.alignment = { horizontal: "right", vertical: "middle" };

      const isEven = idx % 2 === 1;
      monthlyCols.forEach((col) => {
        const c = wsSummary.getCell(`${col}${currentRow}`);
        c.font = c.font || { name: "Segoe UI", size: 9.5 };
        if (isEven) {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.zebraRowBg}` } };
        }
        c.border = {
          bottom: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
          left: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
          right: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
        };
      });

      currentRow++;
    });

    // Total Row Rekap Kategori
    const catEndRow = currentRow - 1;
    const catTotRow = wsSummary.getRow(currentRow);
    catTotRow.height = 22;

    const cellTotLabel = wsSummary.getCell(`B${currentRow}`);
    cellTotLabel.value = "TOTAL KATEGORI";
    cellTotLabel.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.textDark}` } };
    cellTotLabel.alignment = { horizontal: "left", vertical: "middle" };

    const cellTotType = wsSummary.getCell(`C${currentRow}`);
    cellTotType.value = "-";
    cellTotType.alignment = { horizontal: "center", vertical: "middle" };

    const cellTotCount = wsSummary.getCell(`D${currentRow}`);
    cellTotCount.value = { formula: `SUM(D${catStartRow}:D${catEndRow})` };
    cellTotCount.numFmt = NUMBER_FORMAT;
    cellTotCount.font = { name: "Segoe UI", size: 9.5, bold: true };
    cellTotCount.alignment = { horizontal: "center", vertical: "middle" };

    const cellTotInc = wsSummary.getCell(`E${currentRow}`);
    cellTotInc.value = { formula: `SUM(E${catStartRow}:E${catEndRow})` };
    cellTotInc.numFmt = CURRENCY_FORMAT;
    cellTotInc.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.incomeGreen}` } };
    cellTotInc.alignment = { horizontal: "right", vertical: "middle" };

    const cellTotExp = wsSummary.getCell(`F${currentRow}`);
    cellTotExp.value = { formula: `SUM(F${catStartRow}:F${catEndRow})` };
    cellTotExp.numFmt = CURRENCY_FORMAT;
    cellTotExp.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.expenseRed}` } };
    cellTotExp.alignment = { horizontal: "right", vertical: "middle" };

    const cellTotPct = wsSummary.getCell(`G${currentRow}`);
    cellTotPct.value = "100.0%";
    cellTotPct.font = { name: "Segoe UI", size: 9.5, bold: true };
    cellTotPct.alignment = { horizontal: "right", vertical: "middle" };

    monthlyCols.forEach((col) => {
      const c = wsSummary.getCell(`${col}${currentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      c.border = {
        top: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
        bottom: { style: "double", color: { argb: `FF${COLORS.headerBg}` } },
      };
    });
  }

  // =========================================================================
  // SHEET 2: DAFTAR TRANSAKSI LENGKAP (LEDGER)
  // =========================================================================
  const wsTx = workbook.addWorksheet("Semua Transaksi", {
    properties: { tabColor: { argb: "FF059669" } },
    views: [
      {
        state: "frozen",
        xSplit: 0,
        ySplit: 5, // Freeze header baris 5
        showGridLines: true,
      },
    ],
  });

  // Konfigurasi kolom
  wsTx.columns = [
    { key: "no", width: 6 },            // A: No
    { key: "date", width: 14 },          // B: Tanggal
    { key: "time", width: 10 },          // C: Jam
    { key: "type", width: 15 },          // D: Tipe
    { key: "category", width: 22 },      // E: Kategori
    { key: "note", width: 34 },          // F: Catatan
    { key: "income", width: 19 },        // G: Pemasukan
    { key: "expense", width: 19 },       // H: Pengeluaran
    { key: "net", width: 20 },           // I: Arus Kas Bersih
  ];

  // Header Banner Sheet Transaksi
  wsTx.mergeCells("A2:I3");
  const txBanner = wsTx.getCell("A2");
  txBanner.value = "BUKU BESAR TRANSAKSI KEUANGAN";
  txBanner.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  txBanner.alignment = { horizontal: "center", vertical: "middle" };
  txBanner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.headerBg}` } };

  // Subtitle transaksi
  wsTx.mergeCells("A4:I4");
  const txSub = wsTx.getCell("A4");
  txSub.value = `${periodText}  •  Total Data: ${transactions.length} Transaksi  •  Filter & urutkan melalui judul kolom di bawah ini`;
  txSub.font = { name: "Segoe UI", size: 8.5, italic: true, color: { argb: `FF${COLORS.textMuted}` } };
  txSub.alignment = { horizontal: "center", vertical: "middle" };

  // Header Baris 5
  const txHeaderRow = wsTx.getRow(5);
  txHeaderRow.height = 26;
  const txHeaders = [
    "No.",
    "Tanggal",
    "Jam",
    "Tipe",
    "Kategori",
    "Catatan / Keterangan",
    "Pemasukan (Rp)",
    "Pengeluaran (Rp)",
    "Arus Kas Bersih (Rp)",
  ];
  const txCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

  txHeaders.forEach((text, idx) => {
    const cell = wsTx.getCell(`${txCols[idx]}5`);
    cell.value = text;
    cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.subHeaderBg}` } };
    cell.alignment = {
      horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 3 ? "center" : idx <= 5 ? "left" : "right",
      vertical: "middle",
    };
    cell.border = {
      top: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
      bottom: { style: "medium", color: { argb: `FF${COLORS.headerBg}` } },
    };
  });

  // Aktifkan Excel AutoFilter pada header tabel baris 5
  wsTx.autoFilter = "A5:I5";

  let txCurrentRow = 6;
  const txStartRow = 6;

  if (transactions.length === 0) {
    wsTx.mergeCells(`A${txCurrentRow}:I${txCurrentRow}`);
    const emptyCell = wsTx.getCell(`A${txCurrentRow}`);
    emptyCell.value = "Tidak ada transaksi yang tercatat.";
    emptyCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: `FF${COLORS.textMuted}` } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    txCurrentRow++;
  } else {
    transactions.forEach((t, idx) => {
      const row = wsTx.getRow(txCurrentRow);
      row.height = 20;

      const dateObj = parseDate(t.date);
      const dateFormatted = dateObj
        ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(
            dateObj.getDate()
          ).padStart(2, "0")}`
        : dateOnly(t.date);

      const timeFormatted = dateObj
        ? `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`
        : "-";

      const catInfo = CATEGORY_MAP[t.category];
      const catLabel = catInfo?.label || t.category;
      const isIncome = t.type === "income";

      // A: No
      const cellA = wsTx.getCell(`A${txCurrentRow}`);
      cellA.value = idx + 1;
      cellA.alignment = { horizontal: "center", vertical: "middle" };

      // B: Tanggal
      const cellB = wsTx.getCell(`B${txCurrentRow}`);
      cellB.value = dateFormatted;
      cellB.alignment = { horizontal: "center", vertical: "middle" };

      // C: Jam
      const cellC = wsTx.getCell(`C${txCurrentRow}`);
      cellC.value = timeFormatted;
      cellC.alignment = { horizontal: "center", vertical: "middle" };

      // D: Tipe (Badge)
      const cellD = wsTx.getCell(`D${txCurrentRow}`);
      cellD.value = isIncome ? "Pemasukan" : "Pengeluaran";
      cellD.alignment = { horizontal: "center", vertical: "middle" };
      cellD.font = {
        name: "Segoe UI",
        size: 9,
        bold: true,
        color: { argb: isIncome ? `FF${COLORS.incomeGreen}` : `FF${COLORS.expenseRed}` },
      };

      // E: Kategori
      const cellE = wsTx.getCell(`E${txCurrentRow}`);
      cellE.value = catLabel;
      cellE.alignment = { horizontal: "left", vertical: "middle" };

      // F: Catatan
      const cellF = wsTx.getCell(`F${txCurrentRow}`);
      cellF.value = t.note || "—";
      cellF.alignment = { horizontal: "left", vertical: "middle" };
      cellF.font = {
        name: "Segoe UI",
        size: 9,
        italic: !t.note,
        color: { argb: t.note ? `FF${COLORS.textDark}` : `FF${COLORS.textMuted}` },
      };

      // G: Pemasukan (Rp)
      const cellG = wsTx.getCell(`G${txCurrentRow}`);
      cellG.value = isIncome ? t.amount : 0;
      cellG.numFmt = CURRENCY_FORMAT;
      cellG.alignment = { horizontal: "right", vertical: "middle" };
      if (isIncome) {
        cellG.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.incomeGreen}` } };
      }

      // H: Pengeluaran (Rp)
      const cellH = wsTx.getCell(`H${txCurrentRow}`);
      cellH.value = !isIncome ? t.amount : 0;
      cellH.numFmt = CURRENCY_FORMAT;
      cellH.alignment = { horizontal: "right", vertical: "middle" };
      if (!isIncome) {
        cellH.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: `FF${COLORS.expenseRed}` } };
      }

      // I: Arus Kas Bersih (Formula G - H)
      const cellI = wsTx.getCell(`I${txCurrentRow}`);
      cellI.value = { formula: `G${txCurrentRow}-H${txCurrentRow}` };
      cellI.numFmt = CURRENCY_FORMAT;
      cellI.alignment = { horizontal: "right", vertical: "middle" };
      cellI.font = {
        name: "Segoe UI",
        size: 9.5,
        bold: true,
        color: { argb: isIncome ? `FF${COLORS.incomeGreen}` : `FF${COLORS.expenseRed}` },
      };

      // Alternating row styling & border
      const isEven = idx % 2 === 1;
      txCols.forEach((col) => {
        const c = wsTx.getCell(`${col}${txCurrentRow}`);
        c.font = c.font || { name: "Segoe UI", size: 9 };
        if (isEven) {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.zebraRowBg}` } };
        }
        c.border = {
          bottom: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
          left: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
          right: { style: "thin", color: { argb: `FF${COLORS.borderLight}` } },
        };
      });

      txCurrentRow++;
    });

    // Summary Total Row di Bawah Transaksi
    const txEndRow = txCurrentRow - 1;
    const txTotRow = wsTx.getRow(txCurrentRow);
    txTotRow.height = 24;

    wsTx.mergeCells(`A${txCurrentRow}:F${txCurrentRow}`);
    const totLabel = wsTx.getCell(`A${txCurrentRow}`);
    totLabel.value = "TOTAL KESELURUHAN";
    totLabel.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: `FF${COLORS.textDark}` } };
    totLabel.alignment = { horizontal: "right", vertical: "middle" };

    const totInc = wsTx.getCell(`G${txCurrentRow}`);
    totInc.value = { formula: `SUM(G${txStartRow}:G${txEndRow})` };
    totInc.numFmt = CURRENCY_FORMAT;
    totInc.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: `FF${COLORS.incomeGreen}` } };
    totInc.alignment = { horizontal: "right", vertical: "middle" };

    const totExp = wsTx.getCell(`H${txCurrentRow}`);
    totExp.value = { formula: `SUM(H${txStartRow}:H${txEndRow})` };
    totExp.numFmt = CURRENCY_FORMAT;
    totExp.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: `FF${COLORS.expenseRed}` } };
    totExp.alignment = { horizontal: "right", vertical: "middle" };

    const totNet = wsTx.getCell(`I${txCurrentRow}`);
    totNet.value = { formula: `G${txCurrentRow}-H${txCurrentRow}` };
    totNet.numFmt = CURRENCY_FORMAT;
    totNet.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: `FF${COLORS.accentBlue}` } };
    totNet.alignment = { horizontal: "right", vertical: "middle" };

    txCols.forEach((col) => {
      const c = wsTx.getCell(`${col}${txCurrentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      c.border = {
        top: { style: "thin", color: { argb: `FF${COLORS.borderMedium}` } },
        bottom: { style: "double", color: { argb: `FF${COLORS.headerBg}` } },
      };
    });
  }

  // Generate buffer Excel dan picu download di browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const nowStr = new Date().toISOString().slice(0, 10);
  const defaultFilename = options.filename || `Financial_Mahes_Laporan_${nowStr}.xlsx`;

  // Download via native browser anchor
  if (typeof window !== "undefined") {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = defaultFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
