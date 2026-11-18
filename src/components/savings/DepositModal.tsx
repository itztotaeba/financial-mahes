"use client";

import { useState } from "react";
import { X, Check, PiggyBank } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import { useFinanceStore } from "@/store/useFinanceStore";
import type { SavingsGoal } from "@/types";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

const DEPOSIT_PRESETS = [50_000, 100_000, 250_000, 500_000, 1_000_000];

export function DepositModal({ isOpen, onClose, goal }: DepositModalProps) {
  const [amountStr, setAmountStr] = useState("");
  const [saving, setSaving] = useState(false);

  const depositToGoal = useFinanceStore((s) => s.depositToGoal);

  if (!isOpen || !goal) return null;

  const depositAmount = Math.max(0, parseInt(amountStr.replace(/\D/g, ""), 10) || 0);
  const remainingNeeded = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    setSaving(true);
    try {
      await depositToGoal(goal.id, depositAmount);
      setAmountStr("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreset = (val: number) => {
    setAmountStr(String(depositAmount + val));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-glass"
              style={{ backgroundColor: goal.color || "#2141E0" }}
            >
              <PiggyBank size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-ink">Setor ke Tabungan</h3>
              <p className="text-xs text-muted-ink truncate max-w-[200px]">
                Target: {goal.name}
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

        <div className="my-4 rounded-2xl bg-black/[0.03] p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-ink">Target Total:</span>
            <span className="font-semibold font-data">{formatIDR(goal.targetAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Sudah Terkumpul:</span>
            <span className="font-semibold text-income font-data">{formatIDR(goal.currentAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-black/5 pt-1">
            <span className="text-muted-ink">Sisa Dibutuhkan:</span>
            <span className="font-bold text-primary font-data">{formatIDR(remainingNeeded)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0">Nominal Setoran (Rp)</Label>
              {depositAmount > 0 && (
                <span className="text-xs font-bold text-income font-data">
                  +{formatIDR(depositAmount)}
                </span>
              )}
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 500.000"
              value={amountStr ? Number(amountStr).toLocaleString("id-ID") : ""}
              onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ""))}
              className="text-base font-semibold"
              autoFocus
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-medium text-muted-ink mb-1.5">
              Tambah cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEPOSIT_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs font-medium text-ink hover:bg-income/10 hover:border-income/40 hover:text-income transition"
                >
                  +{formatIDR(val).replace(",00", "")}
                </button>
              ))}
              {remainingNeeded > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountStr(String(remainingNeeded))}
                  className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition"
                >
                  Lunasi Target
                </button>
              )}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || depositAmount <= 0} className="px-5">
              <Check size={16} />
              {saving ? "Menyimpan…" : "Tambah Tabungan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
