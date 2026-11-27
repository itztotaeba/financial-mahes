"use client";

/**
 * PrivacyToggle — tombol 👁️ (tampil) / 🙈 (sembunyi) di header untuk
 * menyembunyikan/menampilkan seluruh angka uang. Gaya mengikuti tombol ikon
 * bulat yang sudah ada di Header (kaca minimalis, active:scale-95, transisi halus).
 *
 * Tombol baru dirender setelah preferensi localStorage terbaca (`ready`)
 * supaya ikon tidak berkedip saat halaman dimuat dalam mode privasi.
 */
import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/lib/utils";

export function PrivacyToggle({ className }: { className?: string }) {
  const { isPrivacyMode, ready, togglePrivacyMode } = usePrivacy();

  if (!ready) {
    // Placeholder seukuran tombol — mencegah layout shift saat preferensi dibaca.
    return <span className="h-9 w-9 shrink-0" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={togglePrivacyMode}
      aria-pressed={isPrivacyMode}
      title={isPrivacyMode ? "Tampilkan angka" : "Sembunyikan angka"}
      aria-label={isPrivacyMode ? "Tampilkan angka" : "Sembunyikan angka"}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-200 active:scale-95",
        isPrivacyMode
          ? "border-primary/40 bg-primary/15 text-primary shadow-glass"
          : "border-white/60 bg-white/70 text-ink shadow-glass hover:bg-white",
        className
      )}
    >
      {/* Transisi halus pergantian status (emoji 👁️ tampil / 🙈 sembunyi) */}
      <span
        key={String(isPrivacyMode)}
        className="animate-privacy-toggle grid place-items-center text-base leading-none"
        aria-hidden
      >
        {isPrivacyMode ? "🙈" : "👁️"}
      </span>
    </button>
  );
}
