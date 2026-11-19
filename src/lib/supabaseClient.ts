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

/**
 * Perbaiki URL Supabase dari environment variable.
 *
 * PENTING: nilai `NEXT_PUBLIC_SUPABASE_URL` yang keliru (mis. ada spasi,
 * tanpa skema `https://`, atau salah ketik seperti `https//xxx.supabase.co`)
 * membuat SEMUA request GoTrue ("token?grant_type=refresh_token", dsb.)
 * di-resolve sebagai URL RELATIF ke domain aplikasi — sehingga browser
 * melihatnya sebagai request lintas-origin ke
 * `https://financial-mahes-lovat.vercel.app/auth/v1/token...` yang diblokir
 * CORS dengan pesan legendaris:
 *   "Redirect is not allowed for a preflight request"
 * dan seluruh proses login tampak "menggantung" tanpa progress.
 *
 * Fungsi ini menormalkan URL seaman mungkin sebelum dipakai createClient.
 */
export function normalizeSupabaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    // Tidak ada skema sama sekali -> tambahkan https:// (bukan typo "https//")
    url = url.replace(/^https?[\/:]+\s*/i, ""); // buang "https//", "https:", dsb.
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    // Validasi kasar: host harus bergaya supabase (supabase.co / project ref).
    // Kalau jelas-jelas bukan, kembalikan undefined agar kita gagal cepat
    // dengan pesan jelas, BUKAN menembak path relatif ke domain sendiri.
    if (!/[.]/.test(parsed.hostname)) return undefined;
    return parsed.origin; // buang trailing slash & path berlebih
  } catch {
    return undefined;
  }
}

/** Ambil (atau buat sekali) instance Supabase client. Melempar error jika env belum diisi. */
export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase client hanya boleh dipakai di browser");
  }
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Konfigurasi Supabase tidak valid — periksa NEXT_PUBLIC_SUPABASE_URL (harus berbentuk https://<project-ref>.supabase.co) dan NEXT_PUBLIC_SUPABASE_ANON_KEY di environment variables Vercel."
    );
  }

  if (!cached) {
    cached = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Simpan sesi di localStorage secara eksplisit (default sudah true,
        // ditulis di sini supaya perilaku refresh-token deterministik).
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
        logLevel: "silent", // matikan log internal realtime agar console bersih
      },
    });
  }
  return cached;
}

/**
 * Deteksi dini apakah server Realtime Supabase dapat dijangkau.
 * Endpoint `/realtime/v1/api/info` selalu menjawab JSON bila layanan sehat.
 * Dipakai AppShell untuk memutuskan: subscribe realtime ATAU fallback polling.
 */
export async function isRealtimeReachable(timeoutMs = 3500): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${url.replace(/\/$/, "")}/realtime/v1/api/info`, {
      headers: { apikey: key },
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
