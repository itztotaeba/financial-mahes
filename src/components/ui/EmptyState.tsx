"use client";

/**
 * EmptyState — komponen presentasional untuk kondisi "belum ada data".
 * Dipakai di Dashboard, Transaksi, dan Laporan agar user baru disambut
 * dengan copywriting onboarding yang hangat, bukan tabel kosong.
 */
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";

interface EmptyStateProps {
  /** Ikon besar di dalam lingkaran aksen. */
  icon: ReactNode;
  title: string;
  description: string;
  /** Opsional: tombol CTA utama (mis. "+ Catat Transaksi Pertama"). */
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8" : "py-14"
      }`}
    >
      {/* Lingkaran dekoratif dengan gradasi lembut palet Casha */}
      <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#647637]/12 via-[#C6B54F]/20 to-[#BB622E]/10 text-3xl ring-1 ring-black/5">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-extrabold tracking-tight text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-ink">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 px-5">
          <Plus size={16} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
