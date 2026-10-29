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
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-[#2141E0] text-white shadow-md shadow-[#2141E0]/25"
                : "text-[#151516]/70 hover:bg-black/5 hover:text-[#151516]"
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

function Brand() {
  return (
    <div className="mb-8 flex items-center gap-3 px-2">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2141E0] text-white">
        <Wallet size={20} />
      </div>
      <div>
        <p className="text-base font-extrabold leading-tight text-[#151516]">Financial Mahes</p>
        <p className="text-xs text-black/40">Tracker keuangan pribadi</p>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-6 px-4 pb-6">
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
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-[#F6F6F6] p-4 shadow-2xl">
        <button
          onClick={onClose}
          className="mb-4 ml-auto grid h-9 w-9 place-items-center rounded-full bg-black/5 text-[#151516]"
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

/** Indikator status sinkronisasi di bagian bawah sidebar. */
function SyncStatus() {
  const userId = useFinanceStore((s) => s.userId);
  const pushPending = useFinanceStore((s) => s.pushPending);
  return (
    <div className="mt-8 rounded-xl bg-white p-3 text-xs ring-1 ring-black/5">
      <p className="font-semibold text-[#151516]">
        {userId ? "☁️ Terhubung ke Cloud" : "💾 Mode Lokal"}
      </p>
      <p className="mt-0.5 text-black/45">
        {userId
          ? pushPending
            ? "Perubahan menunggu sync — buka Pengaturan untuk retry."
            : "Data lokal & cloud tersinkron."
          : "Data tersimpan aman di browser Anda."}
      </p>
    </div>
  );
}
