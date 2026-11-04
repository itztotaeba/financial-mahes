"use client";

/**
 * BottomTabBar — navigasi bawah modern khusus MOBILE (md:hidden).
 * Menggantikan hamburger + drawer sidebar pada layar kecil.
 *
 * Struktur (5 item horizontal):
 *   Home | Transaksi | [FAB Tambah] | Analisis | Akun
 *
 * Catatan routing:
 *   Aplikasi ini memakai route nyata: "/", "/transaksi", "/laporan",
 *   "/pengaturan". FAB memanggil modal transaksi global (perilaku yang
 *   sudah ada di seluruh aplikasi — lihat GlobalTransactionModal) dan
 *   tetap memakai href "/add" agar sesuai kontrak navigasi; halaman
 *   /add menjadi fallback deep-link langsung.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Plus, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

/** Empat tab standar — slot tengah dipakai oleh FAB. */
const LEFT_TABS: TabItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/transaksi", icon: Receipt, label: "Transaksi" },
];

const RIGHT_TABS: TabItem[] = [
  { href: "/laporan", icon: BarChart3, label: "Analisis" },
  { href: "/pengaturan", icon: User, label: "Akun" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  // "/" hanya aktif saat persis di dashboard; sisanya prefix-match.
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function TabButton({ item }: { item: TabItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200",
        active ? "text-blue-600" : "text-gray-400 active:text-gray-600"
      )}
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.4 : 2}
        className={cn("transition-all duration-200", active && "scale-110")}
      />
      <span
        className={cn(
          "text-[10px] font-semibold leading-tight transition-all duration-200",
          active && "scale-110 text-blue-600"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

/** FAB tengah — tombol aksi utama "Tambah Transaksi". */
function CenterFab() {
  const openModal = () => {
    // Modal global sudah tersedia di semua halaman via AppShell.
    window.openTransactionModal?.();
  };

  return (
    <div className="relative flex flex-1 justify-center">
      {/* Penyangga tinggi agar bar tidak naik saat FAB overlap ke atas */}
      <span className="h-12" aria-hidden />
      <Link
        href="/add"
        onClick={openModal}
        aria-label="Tambah transaksi"
        className={cn(
          "absolute -top-6 grid h-14 w-14 place-items-center rounded-full",
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
          "shadow-lg shadow-blue-500/30 ring-4 ring-white",
          "transition-all duration-200 hover:brightness-110 active:scale-95"
        )}
      >
        <Plus size={26} strokeWidth={2.6} />
      </Link>
      <span className="absolute bottom-1 text-[10px] font-semibold leading-none text-gray-400">
        Tambah
      </span>
    </div>
  );
}

export function BottomTabBar() {
  return (
    <nav
      aria-label="Navigasi bawah"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "border-t border-gray-200/50 bg-white/80 backdrop-blur-md",
        // Padding bawah menghormati safe-area iOS.
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
    >
      <div className="mx-auto flex max-w-md items-stretch px-2">
        {LEFT_TABS.map((item) => (
          <TabButton key={item.href} item={item} />
        ))}
        <CenterFab />
        {RIGHT_TABS.map((item) => (
          <TabButton key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}
