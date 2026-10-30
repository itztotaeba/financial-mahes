"use client";

/**
 * AppShell — kerangka aplikasi yang dibungkus di RootLayout.
 * Tanggung jawab:
 *  1. Memanggil store.hydrate() sekali saat mount (load localStorage + cek sesi Supabase).
 *     Tanpa langkah ini, semua halaman akan terjebak di state "Memuat data lokal…".
 *  2. Menyediakan Sidebar desktop + drawer mobile + modal transaksi global
 *     untuk seluruh halaman (kecuali /login yang tampil fullscreen).
 *  3. Sinkronisasi multi-device:
 *     - Supabase Realtime (postgres_changes): perubahan dari device A langsung
 *       muncul di device B TANPA refresh.
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
   * Langganan Supabase Realtime untuk tabel `transactions`.
   * RLS membatasi payload hanya milik user yang login, sehingga event apa pun
   * yang masuk pasti relevan — tinggal tarik ulang snapshot cloud.
   */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let channel: ReturnType<Awaited<ReturnType<typeof import("@supabase/supabase-js").createClient>>["channel"]> | null =
      null;

    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const sb = createClient(url, key, {
          auth: { persistSession: true, autoRefreshToken: true },
        });
        channel = sb
          .channel(`transactions:${userId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "transactions" },
            () => {
              if (cancelled) return;
              // Perubahan di device A -> tarik snapshot terbaru ke device B.
              void useFinanceStore.getState().pullFromCloud();
            }
          )
          .subscribe();
      } catch {
        /* realtime gagal (offline/proxy) -> tetap aman, fallback pull-on-load */
      }
    })();

    return () => {
      cancelled = true;
      if (channel) {
        import("@supabase/supabase-js")
          .then(({ createClient }) => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (url && key) void createClient(url, key).removeChannel(channel!);
          })
          .catch(() => undefined);
      }
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
