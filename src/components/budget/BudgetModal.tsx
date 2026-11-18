"use client";

import { useState, useEffect } from "react";
import { X, Check, DollarSign } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import { useFinanceStore } from "@/store/useFinanceStore";
import { CATEGORY_MAP, EXPENSE_CATEGORIES } from "@/types";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialAmount?: number;
  month?: string;
}

const PRESET_AMOUNTS = [250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

export function BudgetModal({
  isOpen,
  onClose,
  initialCategory,
  initialAmount = 0,
  month,
}: BudgetModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || EXPENSE_CATEGORIES[0]
  );
  const [amountStr, setAmountStr] = useState(initialAmount ? String(initialAmount) : "");
  const [saving, setSaving] = useState(false);

  const setCategoryBudget = useFinanceStore((s) => s.setCategoryBudget);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory || EXPENSE_CATEGORIES[0]);
      setAmountStr(initialAmount ? String(initialAmount) : "");
    }
  }, [isOpen, initialCategory, initialAmount]);

  if (!isOpen) return null;

  const numericAmount = Math.max(0, parseInt(amountStr.replace(/\D/g, ""), 10) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setCategoryBudget(selectedCategory, numericAmount, month);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreset = (addon: number) => {
    setAmountStr(String(numericAmount + addon));
  };

  const categoryInfo = CATEGORY_MAP[selectedCategory];
  const Icon = categoryInfo?.icon || DollarSign;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-glass"
              style={{ backgroundColor: categoryInfo?.color || "#2141E0" }}
            >
              <Icon size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-ink">Batas Anggaran Bulanan</h3>
              <p className="text-xs text-muted-ink">
                {month ? `Bulan ${month}` : "Anggaran standar setiap bulan"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-ink hover:bg-black/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Pilih Kategori */}
          <div>
            <Label>Kategori Pengeluaran</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPENSE_CATEGORIES.map((catKey) => {
                const info = CATEGORY_MAP[catKey];
                const CatIcon = info?.icon || DollarSign;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2.5 text-xs font-semibold transition border ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-glass"
                        : "border-black/5 bg-white/60 text-ink/80 hover:bg-white"
                    }`}
                  >
                    <CatIcon size={16} />
                    <span className="truncate max-w-[70px]">{info?.label || catKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nominal Anggaran */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0">Batas Anggaran (Rp)</Label>
              {numericAmount > 0 && (
                <span className="text-xs font-bold text-primary font-data">
                  {formatIDR(numericAmount)}
                </span>
              )}
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 1.500.000"
              value={amountStr ? Number(amountStr).toLocaleString("id-ID") : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setAmountStr(raw);
              }}
              className="text-base font-semibold"
              autoFocus
            />
          </div>

          {/* Quick Preset Chips */}
          <div>
            <span className="block text-[11px] font-medium text-muted-ink mb-1.5">
              Tambah nominal cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddPreset(p)}
                  className="rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs font-medium text-ink hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition"
                >
                  +{formatIDR(p).replace(",00", "")}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr("")}
                className="rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-ink hover:bg-expense/10 hover:text-expense transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving} className="px-5">
              <Check size={16} />
              {saving ? "Menyimpan…" : "Simpan Anggaran"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
