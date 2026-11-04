"use client";

/**
 * Halaman /add — fallback untuk route FAB bottom-tab.
 * Secara normal, FAB pada BottomTabBar membuka GlobalTransactionModal
 * tanpa berpindah halaman. Namun jika user sampai ke sini (deep-link),
 * kita buka modal tambah transaksi secara otomatis dan mengembalikan
 * user ke Dashboard saat modal ditutup.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useFinanceStore } from "@/store/useFinanceStore";

export default function AddPage() {
  const router = useRouter();
  const hydrated = useFinanceStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    // Buka modal global, lalu tinggalkan halaman ini kembali ke dashboard.
    window.openTransactionModal?.();
    const id = window.setTimeout(() => router.replace("/"), 150);
    return () => window.clearTimeout(id);
  }, [hydrated, router]);

  return (
    <div>
      <Header title="Tambah Transaksi" subtitle="Membuka form transaksi…" />
      <p className="text-sm text-muted-ink">
        Mengalihkan kembali ke Dashboard…
      </p>
    </div>
  );
}
