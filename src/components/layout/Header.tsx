"use client";

/**
 * Header: judul halaman, tombol "Login / Sync ke Cloud", avatar profil user.
 * Pada mobile menampilkan hamburger untuk membuka drawer sidebar.
 */
import Link from "next/link";
import { Menu, CloudUpload, LogOut, UserRound } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/primitives";

export function Header({
  title,
  subtitle,
  onMenuClick,
}: {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}) {
  const email = useFinanceStore((s) => s.email);
  const userLoaded = useFinanceStore((s) => s.userLoaded);
  const logout = useFinanceStore((s) => s.logout);

  return (
    <header className="mb-7 flex items-center justify-between gap-4 lg:mb-9">
      <div className="flex items-center gap-3 min-w-0">
        {/* Tombol menu hanya tampil di mobile */}
        <button
          onClick={onMenuClick}
          className="glass-pill grid h-10 w-10 shrink-0 place-items-center text-ink lg:hidden"
          aria-label="Buka menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-ink text-glass-shadow sm:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-ink">{subtitle}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {email ? (
          <>
            <div className="glass-pill hidden items-center gap-2 py-1 pl-1 pr-3 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-lilac text-sm font-bold text-white">
                {email[0].toUpperCase()}
              </span>
              <span className="max-w-[160px] truncate text-xs font-semibold text-ink">
                {email}
              </span>
            </div>
            <Button variant="outline" onClick={() => logout()} className="px-3">
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </>
        ) : (
          <Link href="/login">
            {/* disabled hanya jika Supabase benar2 tidak dikonfigurasi;
                selama cek sesi berjalan, tampilkan status "Memeriksa…" agar stabil. */}
            <Button className="px-3 sm:px-4" disabled={!isSupabaseConfigured()}>
              <CloudUpload size={16} />
              <span className="hidden sm:inline">
                {!isSupabaseConfigured()
                  ? "Belum terkonfigurasi"
                  : !userLoaded
                    ? "Memeriksa sesi…"
                    : "Login / Sync ke Cloud"}
              </span>
              <span className="sm:hidden">Sync</span>
            </Button>
          </Link>
        )}
        {/* Avatar kecil pada mobile saat sudah login */}
        {email && (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-lilac text-sm font-bold text-white shadow-glass sm:hidden">
            <UserRound size={16} />
          </span>
        )}
      </div>
    </header>
  );
}
