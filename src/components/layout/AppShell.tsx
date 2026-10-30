"use client";

/**
 * AppShell — kerangka aplikasi yang dibungkus di RootLayout.
 * Tanggung jawab:
 *  1. Memanggil store.hydrate() sekali saat mount (load localStorage + cek sesi Supabase).
 *     Tanpa langkah ini, semua halaman akan terjebak di state "Memuat data lokal…".
 *  2. Menyediakan Sidebar desktop + drawer mobile + modal transaksi global
 *     untuk seluruh halaman (kecuali /login yang tampil fullscreen).
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileSidebar } from "./Sidebar";
import { GlobalTransactionModal } from "@/components/transaction/GlobalTransactionModal";
import { useFinanceStore } from "@/store/useFinanceStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrate = useFinanceStore((s) => s.hydrate);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrasi store dari localStorage — hanya sekali per sesi browser.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Drawer mobile menutup otomatis saat berpindah halaman.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Halaman dapat membuka drawer via event global "mahes:open-menu" (lihat lib/menu.ts).
  useEffect(() => {
    const onOpenMenu = () => setMobileOpen(true);
    window.addEventListener("mahes:open-menu", onOpenMenu);
    return () => window.removeEventListener("mahes:open-menu", onOpenMenu);
  }, []);

  // Halaman login punya tampilan sendiri (tanpa sidebar/modal).
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DesktopSidebar />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {/* Modal global tambah/edit transaksi — dipanggil via window.openTransactionModal */}
      <GlobalTransactionModal />
    </div>
  );
}
