"use client";

/**
 * Halaman Login / Sync ke Cloud.
 * Alur pasca-login (cloud-first):
 *  1. Login → store SELALU menarik data akun dari Supabase dan menampilkannya.
 *  2. Panel pilihan sync HANYA muncul bila masih ada catatan lokal nyata yang
 *     belum ada di cloud (hasil mencatat offline) — tidak pernah menawarkan dummy.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, CloudUpload, CloudDownload, ArrowLeft } from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import { useFinanceStore } from "@/store/useFinanceStore";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const login = useFinanceStore((s) => s.login);
  const signup = useFinanceStore((s) => s.signup);
  const pushToCloud = useFinanceStore((s) => s.pushToCloud);
  const pullFromCloud = useFinanceStore((s) => s.pullFromCloud);
  const syncing = useFinanceStore((s) => s.syncing);
  const localCount = useFinanceStore((s) => s.transactions.length);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Setelah auth sukses & ada data lokal → tampilkan panel pilihan sinkronisasi.
  const [showSyncChoice, setShowSyncChoice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Supabase belum dikonfigurasi. Isi .env.local terlebih dahulu.");
      return;
    }
    try {
      const result =
        mode === "login" ? await login(email, password) : await signup(email, password);
      if (result.error) {
        // Sinyal khusus: pendaftaran butuh konfirmasi email.
        if (result.error === "CHECK_EMAIL") {
          setError(
            "Akun dibuat, tetapi Anda harus mengonfirmasi email terlebih dahulu (cek inbox). Setelah itu baru bisa login. Tip: matikan 'Confirm email' di Supabase → Authentication → Providers → Email agar bisa langsung coba."
          );
        } else {
          setError(result.error);
        }
        return;
      }
      if (result.hasLocalData) setShowSyncChoice(true);
      else router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke Supabase.");
    }
  };

  const finishSync = async (direction: "push" | "pull") => {
    setError("");
    try {
      if (direction === "push") await pushToCloud();
      else await pullFromCloud();
      router.push("/");
    } catch (err) {
      // Tampilkan kegagalan sync alih-alih diam-diam pindah halaman.
      setError(
        err instanceof Error
          ? `Sinkronisasi gagal: ${err.message}`
          : "Sinkronisasi gagal. Pastikan script SQL 003_fix_schema.sql sudah dijalankan di Supabase."
      );
    }
  };

  /* ---------- Panel pilihan sinkronisasi (langkah 2 spesifikasi) ---------- */
  if (showSyncChoice) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F6F6F6] px-4">
        <Card className="w-full max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#2141E0]/10">
            <CloudUpload size={26} className="text-[#2141E0]" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold text-[#151516]">Punya catatan offline? 📦</h1>
          <p className="mt-1 text-sm text-black/55">
            Ada <b>{localCount}</b> transaksi yang dicatat sebelum login dan belum tersimpan di
            cloud. Kirim sekarang agar aman tersinkron?
          </p>

          {error && (
            <p className="mt-3 rounded-lg bg-[#D3534C]/10 px-3 py-2 text-left text-xs font-semibold text-[#D3534C]">
              {error}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <Button onClick={() => finishSync("push")} disabled={syncing} className="w-full">
              <CloudUpload size={16} /> Upload ke Supabase (rekomendasi)
            </Button>
            <Button variant="outline" onClick={() => finishSync("pull")} disabled={syncing} className="w-full">
              <CloudDownload size={16} /> Tarik data dari Supabase (timpa lokal)
            </Button>
            <button
              onClick={() => router.push("/")}
              className="text-xs font-semibold text-black/45 hover:text-[#151516]"
            >
              Lewati — sinkron nanti saja lewat Pengaturan
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------- Form login/signup ---------- */
  return (
    <div className="grid min-h-screen place-items-center bg-[#F6F6F6] px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-[#151516]">
          <ArrowLeft size={16} /> Kembali ke aplikasi
        </Link>

        <Card className="p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#2141E0] text-white">
              <Wallet size={22} />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-[#151516]">Login / Sync ke Cloud</h1>
              <p className="text-xs text-black/45">
                Opsional — aplikasi tetap penuh fungsi tanpa akun.
              </p>
            </div>
          </div>

          {/* Toggle mode */}
          <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F6F6F6] p-1.5">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 text-sm font-bold transition-all ${
                  mode === m ? "bg-white text-[#2141E0] shadow" : "text-black/45 hover:text-black"
                }`}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                placeholder="mahes@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Kata Sandi</Label>
              <Input
                type="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-xs font-semibold text-[#D3534C]">{error}</p>}

            <Button type="submit" className="w-full">
              {mode === "login" ? "Masuk & Aktifkan Sinkronisasi" : "Buat Akun & Sinkronkan"}
            </Button>

            {!isSupabaseConfigured() && (
              <p className="rounded-lg bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#92610a]">
                ⚠️ Belum ada konfigurasi Supabase. Salin <code>.env.example</code> menjadi{" "}
                <code>.env.local</code> lalu isi URL & anon key project Anda.
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
