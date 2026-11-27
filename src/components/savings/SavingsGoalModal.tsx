"use client";

import { useState, useEffect } from "react";
import { X, Check, Target, Calendar } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { formatIDR } from "@/lib/utils";
import { PrivacyNumber } from "@/components/PrivacyNumber";
import { useFinanceStore } from "@/store/useFinanceStore";
import type { SavingsGoal } from "@/types";

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingsGoal | null;
}

const COLOR_OPTIONS = [
  "#2141E0", // Blue
  "#4FB279", // Green
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#D3534C", // Red
];

export function SavingsGoalModal({
  isOpen,
  onClose,
  goalToEdit,
}: SavingsGoalModalProps) {
  const [name, setName] = useState("");
  const [targetAmountStr, setTargetAmountStr] = useState("");
  const [currentAmountStr, setCurrentAmountStr] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const addSavingsGoal = useFinanceStore((s) => s.addSavingsGoal);
  const updateSavingsGoal = useFinanceStore((s) => s.updateSavingsGoal);

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmountStr(String(goalToEdit.targetAmount));
        setCurrentAmountStr(String(goalToEdit.currentAmount));
        setTargetDate(goalToEdit.targetDate || "");
        setColor(goalToEdit.color || COLOR_OPTIONS[0]);
      } else {
        setName("");
        setTargetAmountStr("");
        setCurrentAmountStr("");
        setTargetDate("");
        setColor(COLOR_OPTIONS[0]);
      }
    }
  }, [isOpen, goalToEdit]);

  if (!isOpen) return null;

  const targetAmount = Math.max(0, parseInt(targetAmountStr.replace(/\D/g, ""), 10) || 0);
  const currentAmount = Math.max(0, parseInt(currentAmountStr.replace(/\D/g, ""), 10) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;

    setSaving(true);
    try {
      if (goalToEdit) {
        await updateSavingsGoal(goalToEdit.id, {
          name: name.trim(),
          targetAmount,
          currentAmount,
          targetDate: targetDate || undefined,
          color,
        });
      } else {
        await addSavingsGoal({
          name: name.trim(),
          targetAmount,
          currentAmount,
          targetDate: targetDate || undefined,
          color,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-glass"
              style={{ backgroundColor: color }}
            >
              <Target size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-ink">
                {goalToEdit ? "Ubah Target Tabungan" : "Buat Target Tabungan Baru"}
              </h3>
              <p className="text-xs text-muted-ink">
                Tentukan impian finansial dan pantau perkiraan pencapaiannya.
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
          {/* Nama Target */}
          <div>
            <Label>Nama Tujuan / Impian</Label>
            <Input
              type="text"
              placeholder="Contoh: Dana Darurat, Liburan Jepang, DP Rumah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Jumlah Target & Terkumpul */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="mb-0">Jumlah Target (Rp)</Label>
                {targetAmount > 0 && (
                  <span className="text-[11px] font-bold text-primary font-data">
                    {<PrivacyNumber value={targetAmount} />}
                  </span>
                )}
              </div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 10.000.000"
                value={targetAmountStr ? Number(targetAmountStr).toLocaleString("id-ID") : ""}
                onChange={(e) => setTargetAmountStr(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="mb-0">Sudah Terkumpul (Rp)</Label>
                {currentAmount > 0 && (
                  <span className="text-[11px] font-bold text-income font-data">
                    {<PrivacyNumber value={currentAmount} />}
                  </span>
                )}
              </div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 2.500.000"
                value={currentAmountStr ? Number(currentAmountStr).toLocaleString("id-ID") : ""}
                onChange={(e) => setCurrentAmountStr(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          {/* Tanggal Target (Opsional) */}
          <div>
            <Label>Tanggal Target Pencapaian (Opsional)</Label>
            <div className="relative">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="pr-10"
              />
              <Calendar
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-ink pointer-events-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-ink">
              Membantu menghitung estimasi tabungan bulanan yang dibutuhkan.
            </p>
          </div>

          {/* Pilihan Warna Kartu */}
          <div>
            <Label>Warna Aksen</Label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview Kalkulasi Awal */}
          {targetAmount > 0 && (
            <div className="rounded-2xl bg-black/[0.03] p-3 text-xs text-ink/80 space-y-1">
              <div className="flex justify-between">
                <span>Sisa yang dibutuhkan:</span>
                <span className="font-bold text-primary font-data">
                  {<PrivacyNumber value={Math.max(0, targetAmount - currentAmount)} />}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Persentase kemajuan:</span>
                <span className="font-bold font-data">
                  {Math.min(100, (currentAmount / targetAmount) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || targetAmount <= 0} className="px-5">
              <Check size={16} />
              {saving ? "Menyimpan…" : goalToEdit ? "Perbarui Target" : "Buat Target"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
