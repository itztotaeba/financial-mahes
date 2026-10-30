"use client";

/**
 * AppShell — kerangka aplikasi yang dibungkus di RootLayout.
 * Tanggung jawab:
 *  1. Memanggil store.hydrate() sekali saat mount (load localStorage + cek sesi Supabase).
 *     Tanpa langkah ini, semua halaman akan terjebak di state "Memuat data lokal…".
 *  2. Menyediakan Sidebar desktop + drawer mobile + modal transaksi global
 *     untuk seluruh halaman (kecuali /login yang tampil fullscreen).
 *  3. Sinkronisasi multi-device (tanpa websocket — REST polling ringan):
 *     - Polling watermark tiap 20 detik: perubahan device A muncul di device B
 *       tanpa refresh manual.
 *     - BroadcastChannel: tab lain di perangkat yang sama ikut ter-update.
 *     - Fokus tab / visibilitychange: pull-on-load saat user kembali ke tab.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileSidebar } from "./Sidebar";
import { GlobalTransactionModal } from "@/components/transaction/GlobalTransactionModal";
import { useFinanceStore } from "@/store/useFinanceStore";

/** Nama kanal broadcast antar-tab pada perangkat yang sama. */
const BC_CHANNEL = "financial-mahes-sync";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrate = useFinanceStore((s) => s.hydrate);
  const userId = useFinanceStore((s) => s.userId);
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

  /**
   * Sinkronisasi multi-device REALTIME — TANPA membuka koneksi wss://.
   * ---------------------------------------------------------------------
   * Keputusan teknis (Senior Frontend Engineer):
   * Supabase Realtime berbasis websocket sering gagal di jaringan tertentu
   * (proxy, firewall, sebagian ISP) dan meninggalkan error merah di console:
   *   "WebSocket connection to 'wss://.../realtime/v1/websocket' failed"
   * Karena aplikasi sudah punya jalur sinkron ringan berbasis REST (HTTPS),
   * kita TIDAK memakai channel realtime sama sekali. Sebagai gantinya:
   *   - Polling `refreshIfStale()` tiap 20 detik saat tab aktif & online.
   *     Fungsi ini hanya mengirim 2 query ringan (head-count + updated_at
   *     terbaru) dan menarik data penuh HANYA bila watermark cloud berubah.
   *   - Refresh otomatis saat user kembali ke tab (focus/visibilitychange).
   *   - BroadcastChannel untuk tab lain di perangkat yang sama (lihat effect
   *     berikutnya).
   * Hasilnya: device B melihat perubahan device A dalam <=20 detik tanpa
   * refresh manual, dan console bersih dari error websocket.
   */
  useEffect(() => {
    if (!userId) return; // hanya untuk user yang login (data cloud)
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          void useFinanceStore.getState().refreshIfStale();
        }
      }, 20_000); // 20 detik — hemat kuota, tetap terasa real-time
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Tarik segera saat login/mount, lalu nyalakan polling.
    void useFinanceStore.getState().refreshIfStale();
    startPolling();

    // Jeda polling saat tab tersembunyi (hemat baterai/CPU), lanjut saat aktif.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void useFinanceStore.getState().refreshIfStale();
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);

  /**
   * Sinkron antar-tab (perangkat yang sama) + pull-on-focus:
   * - BroadcastChannel: setiap CRUD local men-notify tab lain untuk re-pull.
   * - focus/visibilitychange: panggil refreshIfStale (hemat — hanya pull bila
   *   watermark cloud ternyata lebih baru).
   */
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BC_CHANNEL);
      bc.onmessage = (e: MessageEvent) => {
        if (e.data?.type === "cloud-changed" && useFinanceStore.getState().userId) {
          void useFinanceStore.getState().pullFromCloud();
        }
      };
    } catch {
      /* BroadcastChannel tidak didukung -> skip */
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void useFinanceStore.getState().refreshIfStale();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      bc?.close();
    };
  }, []);

  // Halaman login punya tampilan sendiri (tanpa sidebar/modal).
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen text-ink">
      {/* Padding atas lebih lega (pt-8 sm:pt-10) — judul tidak lagi mepet
          ke tepi atas browser; ruang bawah ekstra untuk FAB mobile. */}
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 pb-24 pt-8 sm:px-6 sm:pt-10 lg:gap-9 lg:px-10 lg:pb-8 xl:pt-12">
        <DesktopSidebar />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {/* Modal global tambah/edit transaksi — dipanggil via window.openTransactionModal */}
      <GlobalTransactionModal />
    </div>
  );
}
