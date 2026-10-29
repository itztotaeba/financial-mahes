"use client";

/**
 * Halaman Pengaturan: status akun/cloud, aksi sinkronisasi manual,
 * reset data lokal & muat ulang dummy data.
 */
import { useState } from "react";
import Link from "next/link";
import { CloudUpload, CloudDownload, Trash2, Database, WifiOff } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { openMobileMenu } from "@/lib/menu";
import { Card, Button } from "@/components/ui/primitives";
import { useFinanceStore } from "@/store/useFinanceStore";
import { localStorageHelpers } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatIDR } from "@/lib/utils";

export default function PengaturanPage() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const transactions = useFinanceStore((s) => s.transactions);
  const userId = useFinanceStore((s) => s.userId);
  const userLoaded = useFinanceStore((s) => s.userLoaded);
  const email = useFinanceStore((s) => s.email);
  const syncing = useFinanceStore((s) => s.syncing);
  const pushPending = useFinanceStore((s) => s.pushPending);
  const pushToCloud = useFinanceStore((s) => s.pushToCloud);
  const pullFromCloud = useFinanceStore((s) => s.pullFromCloud);
  const logout = useFinanceStore((s) => s.logout);

  const [message, setMessage] = useState("");

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  /** Ganti isi localStorage dengan data baru lalu segarkan store. */
  const replaceLocalData = (data: typeof transactions) => {
    localStorageHelpers.save(data);
    // Data non-kosong membatalkan penanda "sengaja kosong".
    if (data.length === 0) localStorageHelpers.markIntentionallyEmpty();
    else localStorageHelpers.clearIntentionallyEmpty();
    useFinanceStore.setState({ transactions: data });
  };

  const handleReset = () => {
    if (!confirm("Hapus SEMUA transaksi dari perangkat ini? Tindakan ini tidak bisa dibatalkan.")) return;
    replaceLocalData([]);
    flash("Semua data lokal telah dihapus.");
  };


  return (
    <>
      <Header title="Pengaturan" subtitle="Akun, sinkronisasi & data" onMenuClick={openMobileMenu} />

      {!hydrated ? (
        <div className="grid min-h-[50vh] place-items-center text-sm text-black/40">
          Memuat data lokal…
        </div>
      ) : (
        <div className="max-w-2xl space-y-4 pb-20 lg:pb-4">
          {message && (
            <div className="rounded-xl bg-[#2141E0]/10 px-4 py-3 text-sm font-semibold text-[#2141E0]">
              {message}
            </div>
          )}

          {/* Status penyimpanan lokal */}
          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#C8ACC0]/25 text-[#C8ACC0]">
                <Database size={18} className="text-[#8f6f87]" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-[#151516]">Penyimpanan Lokal</h2>
                <p className="mt-0.5 text-xs text-black/50">
                  {transactions.length} transaksi tersimpan di browser · total{" "}
                  {formatIDR(transactions.reduce((a, t) => a + t.amount, 0))} dicatat.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="danger" onClick={handleReset} className="px-3 text-xs">
                    <Trash2 size={14} /> Hapus Semua Data Lokal
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Akun & sinkronisasi cloud */}
          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2141E0]/10">
                {userId ? (
                  <CloudUpload size={18} className="text-[#2141E0]" />
                ) : (
                  <WifiOff size={18} className="text-black/40" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-[#151516]">
                  {userId ? `Login sebagai ${email}` : "Belum login"}
                </h2>
                <p className="mt-0.5 text-xs text-black/50">
                  {userId
                    ? pushPending
                      ? "Ada perubahan lokal yang belum berhasil dikirim ke cloud. Coba sync ulang."
                      : "Setiap perubahan otomatis dikirim ke Supabase."
                    : isSupabaseConfigured()
                      ? "Login untuk mencadangkan dan menyinkronkan data ke cloud."
                      : "Supabase belum dikonfigurasi — isi NEXT_PUBLIC_SUPABASE_URL & ANON KEY di .env.local."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {userId ? (
                    <>
                      <Button onClick={() => pushToCloud().then(() => flash("Data lokal dikirim ke cloud."))} disabled={syncing} className="px-3 text-xs">
                        <CloudUpload size={14} /> Upload Lokal → Cloud
                      </Button>
                      <Button variant="outline" onClick={() => pullFromCloud().then(() => flash("Data cloud ditarik ke perangkat."))} disabled={syncing} className="px-3 text-xs">
                        <CloudDownload size={14} /> Tarik Cloud → Lokal
                      </Button>
                      <Button variant="ghost" onClick={() => logout()} className="px-3 text-xs">
                        Keluar
                      </Button>
                    </>
                  ) : (
                    <Link href="/login">
                      {/* Tunggu hasil cek sesi dulu agar tombol tidak "muncul-hilang". */}
                      <Button disabled={!isSupabaseConfigured() || !userLoaded} className="px-3 text-xs">
                        <CloudUpload size={14} /> Login / Sync ke Cloud
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Tentang */}
          <Card className="text-xs leading-relaxed text-black/50">
            <b className="text-[#151516]">Financial Mahes</b> memakai arsitektur{" "}
            <i>local-first</i>: data utama selalu aman di browser Anda. Sinkronisasi cloud bersifat
            opsional dan hanya terjadi setelah Anda login melalui Supabase.
          </Card>
        </div>
      )}
    </>
  );
}
