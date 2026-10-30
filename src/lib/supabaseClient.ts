/**
 * Supabase client SINGLETON (client-side).
 *
 * PENTING: supabase-js menyimpan sesi di localStorage dengan key
 * `sb-<ref>-auth-token`. Jika createClient() dipanggil lebih dari sekali
 * pada konteks browser yang sama, GoTrueClient akan memperingatkan:
 *   "Multiple GoTrueClient instances detected in the same browser context"
 * dan bisa memicu perilaku tidak terduga (refresh token bentrok, dsb).
 *
 * Solusi: SATU instance untuk seluruh aplikasi — dipakai oleh store,
 * AppShell (realtime), halaman login, dan pengaturan.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Ambil (atau buat sekali) instance Supabase client. Melempar error jika env belum diisi. */
export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase client hanya boleh dipakai di browser");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env tidak tersedia");

  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return cached;
}
