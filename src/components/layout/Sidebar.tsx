"use client";

/**
 * Sidebar navigasi (Desktop) + drawer mobile.
 * Item: Dashboard, Transaksi, Laporan, Pengaturan.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Settings, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/store/useFinanceStore";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]",
              active
                ? "bg-income text-white shadow-soft"
                : "border border-transparent text-ink/70 hover:border-line hover:bg-[#FAFAF9] hover:text-ink"
            )}
          >
            <Icon size={18} strokeWidth={2.2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Brand — tagline dibuat lebih "bernyawa", bukan label generik. */
function Brand() {
  return (
    <div className="mb-6 flex items-center gap-3 px-2 pb-6 border-b border-line">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-income to-muted text-white shadow-soft">
        <Wallet size={20} strokeWidth={2.4} />
      </div>
      <div>
        <p className="text-base font-extrabold leading-tight tracking-tight text-ink">Financial Mahes</p>
        <p className="text-xs font-medium text-muted-ink">Uangmu, ada di genggaman.</p>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      {/* top-8 mengikuti padding atas baru agar sidebar ikut "turun" */}
      <div className="glass-card sticky top-8 px-4 pb-6">
        <Brand />
        <NavList />
        <SyncStatus />
      </div>
    </aside>
  );
}

/** Drawer sidebar untuk layar kecil. */
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* overlay — blur tipis khas iOS saat drawer terbuka */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto border-r border-line bg-white p-4 shadow-glass-lg">
        <button
          onClick={onClose}
          className="mb-4 ml-auto grid h-9 w-9 place-items-center rounded-full bg-black/5 text-ink"
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
        <Brand />
        <NavList onNavigate={onClose} />
        <SyncStatus />
      </div>
    </div>
  );
}

/** Indikator status penyimpanan di bagian bawah sidebar.
 *  Catatan UX: saat user sudah login, tidak ada lagi copywriting soal
 *  "tersinkron ke cloud" — auto-sync adalah perilaku default yang tidak
 *  perlu diumumkan. Hanya mode lokal & antrean gagal sync yang ditampilkan. */
function SyncStatus() {
  const userId = useFinanceStore((s) => s.userId);
  const pushPending = useFinanceStore((s) => s.pushPending);

  // Sudah login & semua perubahan tersimpan -> tidak menampilkan apa-apa.
  if (userId && !pushPending) return null;

  return (
    <div className="glass-subtle mt-8 p-3 text-xs">
      <p className="font-semibold text-ink">
        {userId ? "Menunggu sinkronisasi" : "Mode Lokal"}
      </p>
      <p className="mt-0.5 text-muted-ink">
        {userId
          ? "Perubahan menunggu sync — buka Pengaturan untuk retry."
          : "Data tersimpan aman di browser Anda."}
      </p>
    </div>
  );
}
