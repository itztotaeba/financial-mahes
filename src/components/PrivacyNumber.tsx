"use client";

/**
 * PrivacyNumber — pembungkus aman untuk SEMUA tampilan angka uang.
 *
 * - Mode normal  -> menampilkan teks terformat yang diberikan (mis. "Rp1.250.000").
 * - Mode privasi -> menampilkan placeholder "Rp •••••" tanpa mengubah data apa pun.
 *
 * Prop `value` menerima number (difomat via formatIDR) atau string yang sudah
 * diformat sebelumnya (misal hasil `.replace()`/prefik "+"/"−").
 *
 * Lebar elemen dijaga lewat `minWidth` agar layout tidak bergeser saat toggle,
 * dan transisi opacity halus memberi efek lembut ketika status berubah.
 */
import { cn, formatIDR } from "@/lib/utils";
import { usePrivacy } from "@/contexts/PrivacyContext";

export function PrivacyNumber({
  value,
  prefix = "Rp",
  className,
}: {
  value: number | string;
  /** Awalan mata uang pada placeholder (default "Rp"). */
  prefix?: string;
  className?: string;
}) {
  const { isPrivacyMode } = usePrivacy();

  const display =
    !isPrivacyMode && typeof value === "number" ? formatIDR(value) : String(value);

  if (isPrivacyMode) {
    return (
      <span
        className={cn("inline-block tabular-nums transition-opacity duration-200", className)}
        style={{ minWidth: `${prefix.length + 6}ch` }}
        aria-label="Angka disembunyikan"
      >
        {prefix} •••••
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block tabular-nums transition-opacity duration-200", className)}
      style={{ minWidth: `${Math.min(display.length, 12)}ch` }}
    >
      {display}
    </span>
  );
}
