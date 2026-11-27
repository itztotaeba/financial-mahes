"use client";

import { useState } from "react";
import {
  Target,
  Plus,
  PiggyBank,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { formatIDR, formatDate } from "@/lib/utils";
import { PrivacyNumber } from "@/components/PrivacyNumber";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useSavingsGoalsData } from "@/lib/selectors";
import type { SavingsGoal } from "@/types";
import { SavingsGoalModal } from "./SavingsGoalModal";
import { DepositModal } from "./DepositModal";

export function SavingsGoalsSection() {
  const {
    goals,
    totalTarget,
    totalCollected,
    totalRemaining,
    overallPercentage,
    activeCount,
    completedCount,
  } = useSavingsGoalsData();

  const deleteSavingsGoal = useFinanceStore((s) => s.deleteSavingsGoal);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus target tabungan "${name}"? Data target akan dihapus.`)) {
      await deleteSavingsGoal(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ringkasan Semua Target Tabungan yang Aktif */}
      <Card className="bg-gradient-to-br from-white/95 to-white/70 shadow-glass border-white/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-black/5 pb-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-glass">
              <PiggyBank size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink">Tabungan & Target Tujuan</h3>
                <Badge className="bg-income/15 text-income font-bold text-xs">
                  {activeCount} Aktif · {completedCount} Selesai
                </Badge>
              </div>
              <p className="text-xs text-muted-ink mt-0.5">
                Wujudkan impian finansial dengan rencana menabung terukur dan estimasi waktu.
              </p>
            </div>
          </div>

          <Button onClick={handleCreate} className="shrink-0 px-4">
            <Plus size={16} /> Buat Target Baru
          </Button>
        </div>

        {/* 4 Metrik Ringkasan Target Tabungan */}
        <div className="grid grid-cols-2 gap-3 pt-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
              Total Target Impian
            </p>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-ink font-data">
              {<PrivacyNumber value={totalTarget} />}
            </p>
            <p className="text-[10px] text-muted-ink mt-0.5">{goals.length} target terdaftar</p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
              Total Terkumpul
            </p>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-income font-data">
              {<PrivacyNumber value={totalCollected} />}
            </p>
            <p className="text-[10px] text-muted-ink mt-0.5">Dana yang sudah disisihkan</p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
              Sisa yang Dibutuhkan
            </p>
            <p className="mt-1 text-base sm:text-lg font-extrabold text-primary font-data">
              {<PrivacyNumber value={totalRemaining} />}
            </p>
            <p className="text-[10px] text-muted-ink mt-0.5">Untuk mencapai 100% target</p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-ink">
                Rata-rata Kemajuan
              </p>
              <span className="text-[11px] font-bold text-primary">
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-income transition-all duration-500"
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-ink mt-1.5 truncate">
              {totalRemaining === 0 && totalTarget > 0
                ? "Semua target telah tercapai!"
                : `${activeCount} target sedang berjalan`}
            </p>
          </div>
        </div>
      </Card>

      {/* List Target Tabungan */}
      {goals.length === 0 ? (
        <Card className="text-center py-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Target size={24} />
          </div>
          <h4 className="text-base font-bold text-ink">Belum ada target tabungan</h4>
          <p className="text-xs text-muted-ink max-w-sm mx-auto mt-1 mb-4">
            Mulai rencanakan target keuangan Anda hari ini — dana darurat, liburan, pembelian gadget, atau impian lainnya.
          </p>
          <Button onClick={handleCreate} className="px-4">
            <Plus size={16} /> Buat Target Tabungan Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map(({ goal, remainingAmount, progressPercentage, isCompleted, estimatedCompletionText }) => {
            const themeColor = goal.color || "#2141E0";
            return (
              <div
                key={goal.id}
                className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/80 p-5 shadow-glass transition hover:bg-white hover:border-black/10 flex flex-col justify-between"
              >
                <div>
                  {/* Header Kartu */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white shadow-glass"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Target size={20} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-ink truncate max-w-[180px] sm:max-w-[240px]">
                            {goal.name}
                          </h4>
                          {isCompleted ? (
                            <Badge className="bg-income text-white font-bold text-[10px]">
                              <CheckCircle2 size={11} className="inline mr-0.5" /> Tercapai
                            </Badge>
                          ) : (
                            <Badge className="bg-black/5 text-muted-ink text-[10px]">
                              Aktif
                            </Badge>
                          )}
                        </div>
                        {goal.targetDate && (
                          <p className="flex items-center gap-1 text-[11px] text-muted-ink mt-0.5">
                            <Calendar size={12} /> Target: {formatDate(goal.targetDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-ink hover:bg-black/5 hover:text-ink transition"
                        title="Ubah Target"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id, goal.name)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-ink hover:bg-expense/10 hover:text-expense transition"
                        title="Hapus Target"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Nominal & Sisa Kebutuhan */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.02] p-3 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-ink">Terkumpul</p>
                      <p className="font-bold text-income font-data truncate">
                        {<PrivacyNumber value={goal.currentAmount} />}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-ink">Target</p>
                      <p className="font-bold text-ink font-data truncate">
                        {<PrivacyNumber value={goal.targetAmount} />}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-ink">Sisa Dibutuhkan</p>
                      <p className="font-bold text-primary font-data truncate">
                        {<PrivacyNumber value={remainingAmount} />}
                      </p>
                    </div>
                  </div>

                  {/* Batang Kemajuan Visual */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[11px] font-semibold text-muted-ink">
                        Kemajuan Tabungan
                      </span>
                      <span className="font-data font-extrabold text-sm" style={{ color: themeColor }}>
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-all duration-700 shadow-sm"
                        style={{
                          width: `${Math.min(progressPercentage, 100)}%`,
                          backgroundColor: isCompleted ? "#4FB279" : themeColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Estimasi Perkiraan Waktu Pencapaian */}
                  <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-ink/80">
                    <Clock size={14} className="shrink-0 text-muted-ink" />
                    <span className="truncate">
                      <b>Estimasi:</b> {estimatedCompletionText}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Setor / Tambah Tabungan */}
                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs text-muted-ink">
                    {isCompleted ? "🎉 Sudah lunas" : "Mau nabung hari ini?"}
                  </span>
                  <Button
                    onClick={() => setDepositGoal(goal)}
                    className="h-8 px-3.5 text-xs font-semibold"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus size={13} /> Setor Tabungan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat / Edit Target Tabungan */}
      <SavingsGoalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        goalToEdit={editingGoal}
      />

      {/* Modal Setor Tabungan */}
      <DepositModal
        isOpen={Boolean(depositGoal)}
        onClose={() => setDepositGoal(null)}
        goal={depositGoal}
      />
    </div>
  );
}
