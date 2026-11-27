"use client";

/**
 * PrivacyContext — mode privasi (sembunyikan angka uang) untuk seluruh aplikasi.
 *
 * Prinsip:
 *  - MURNI tampilan klien. Data di store/localStorage/Supabase tidak diubah sama sekali.
 *  - Preferensi disimpan di localStorage (kunci "financial-mahes:privacy-mode")
 *    sehingga tetap aktif setelah halaman direfresh.
 *  - Penanganan SSR/hydration: state awal selalu `false` saat render server &
 *    render pertama klien (konsisten → tidak ada hydration mismatch / flash),
 *    lalu nilai dari localStorage diterapkan pada effect mount pertama.
 *    Tombol juga baru ditampilkan setelah preferensi terbaca (`ready`) agar
 *    ikon tidak "berkedip" dari 👁️ ke 🙈 saat mode privasi aktif.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const PRIVACY_STORAGE_KEY = "financial-mahes:privacy-mode";

interface PrivacyContextValue {
  /** true = semua angka uang disembunyikan (diganti "Rp •••••"). */
  isPrivacyMode: boolean;
  /** Preferensi sudah dibaca dari localStorage (untuk mencegah flash ikon). */
  ready: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

/** Baca preferensi dari localStorage dengan aman (SSR/private mode -> false). */
function readStoredPrivacyMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PRIVACY_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  // Mulai selalu false agar HTML server == HTML klien pada render pertama.
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [ready, setReady] = useState(false);
  // Guard agar inisialisasi hanya sekali per mount (aman utk StrictMode).
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setIsPrivacyMode(readStoredPrivacyMode());
    setReady(true);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PRIVACY_STORAGE_KEY, String(next));
      } catch {
        /* storage penuh / mode privat -> perubahan tetap berlaku di sesi ini */
      }
      return next;
    });
  }, []);

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, ready, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

/** Hook pengakses mode privasi. Aman dipakai tanpa provider (default: tampil). */
export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    return { isPrivacyMode: false, ready: true, togglePrivacyMode: () => {} };
  }
  return ctx;
}
