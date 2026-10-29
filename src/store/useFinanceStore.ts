"use client";

/**
 * Store Zustand — arsitektur Local-First.
 * - Sumber kebenaran: state di store, yang selalu dicerminkan ke localStorage.
 * - Jika user login (Supabase), setiap CRUD juga disinkronkan ke cloud.
 */
import { create } from "zustand";
import type { Transaction } from "@/types";
import { localStorageHelpers, generateDummyData } from "@/lib/storage";
import { toSupabasePayload, fromSupabaseRow, isUuid, isSupabaseConfigured } from "@/lib/supabase";
import { generateId } from "@/lib/utils";

/** Ambil Supabase client secara lazy agar bundle tetap aman tanpa env. */
async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env tidak tersedia");
  return createClient(url, key);
}

/**
 * Sinkron satu transaksi ke cloud (dipakai CRUD saat user login).
 * - id lokal berupa UUID valid  -> upsert dengan id tsb (konsisten dgn cloud).
 * - id lokal non-UUID (dummy)   -> insert tanpa id (DB buat UUID), lalu
 *   ganti id lokal dengan UUID resmi dari cloud agar edit/hapus berikutnya sinkron.
 * Mengembalikan id final (mungkin berubah utk baris dummy).
 */
async function syncTxToCloud(
  tx: Transaction,
  replaceLocalId?: (oldId: string, newId: string) => void
): Promise<string> {
  const sb = await getSupabase();
  const payload = toSupabasePayload(tx); // tidak memuat `id`

  if (isUuid(tx.id)) {
    const { error } = await sb.from("transactions").upsert({ id: tx.id, ...payload });
    if (error) throw error;
    return tx.id;
  }

  const { data, error } = await sb
    .from("transactions")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  const cloudId = String(data.id);
  replaceLocalId?.(tx.id, cloudId);
  return cloudId;
}

interface FinanceState {
  transactions: Transaction[];
  hydrated: boolean; // true setelah load dari localStorage (hindari flash SSR)
  userLoaded: boolean; // true setelah cek sesi Supabase pertama kali (stabil untuk UI)
  userId: string | null;
  email: string | null;
  syncing: boolean;
  pushPending: boolean; // true jika ada perubahan lokal saat cloud sync gagal

  /** Muat data awal dari localStorage (panggil sekali di root layout). */
  hydrate: () => Promise<void>;
  /** Kosongkan data tanpa memunculkan dummy lagi (untuk pull cloud yang kosong). */
  clearTransactions: () => void;

  // ---- CRUD ----
  addTransaction: (t: Omit<Transaction, "id" | "created_at">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // ---- Auth & Sinkronisasi ----
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string; hasLocalData: boolean }>;
  signup: (email: string, password: string) => Promise<{ error?: string; hasLocalData: boolean }>;
  logout: () => Promise<void>;
  /** Tarik data cloud -> menggantikan isi localStorage. */
  pullFromCloud: () => Promise<void>;
  /** Dorong seluruh data lokal -> upsert ke Supabase. */
  pushToCloud: () => Promise<void>;
}

/**
 * Terjemahkan pesan error auth Supabase agar user tidak bingung.
 * Kasus tersering: signup sukses tapi login "Invalid login credentials"
 * karena verifikasi email masih aktif (akun belum di-konfirmasi).
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email atau kata sandi salah. Jika Anda baru mendaftar, kemungkinan akun belum dikonfirmasi — cek inbox email Anda, atau matikan 'Confirm email' di Supabase → Authentication → Providers → Email.";
  if (m.includes("email not confirmed"))
    return "Akun belum dikonfirmasi. Buka link verifikasi di email Anda, atau matikan 'Confirm email' di Supabase → Authentication → Providers → Email lalu daftar ulang.";
  if (m.includes("rate limit"))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return message;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  hydrated: false,
  userLoaded: false,
  userId: null,
  email: null,
  syncing: false,
  pushPending: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = localStorageHelpers.load();
    // Penanda "sengaja kosong" (user menghapus data / pull cloud kosong):
    // jangan bangunkan dummy lagi agar placeholder tidak muncul kembali.
    const intentionallyEmpty = localStorageHelpers.isIntentionallyEmpty();
    let data = stored;
    if (stored.length === 0 && !intentionallyEmpty) {
      // Pengguna baru tanpa data -> isi dummy data agar dashboard hidup.
      data = generateDummyData();
      localStorageHelpers.save(data);
    }
    set({ transactions: data, hydrated: true });
    // Cek sesi Supabase yang tersimpan (tanpa reload halaman).
    await get().checkSession();
  },

  clearTransactions: () => {
    localStorageHelpers.markIntentionallyEmpty();
    set({ transactions: [] });
  },

  addTransaction: async (input) => {
    const tx: Transaction = { ...input, id: generateId(), created_at: new Date().toISOString() };
    const next = [tx, ...get().transactions];
    localStorageHelpers.save(next);
    set({ transactions: next });

    // Sinkron ke cloud bila sudah login.
    if (get().userId) {
      try {
        const finalId = await syncTxToCloud(tx, (oldId, newId) => {
          // Ganti id dummy lokal dengan UUID resmi dari cloud.
          const updated = useFinanceStore
            .getState()
            .transactions.map((t) => (t.id === oldId ? { ...t, id: newId } : t));
          localStorageHelpers.save(updated);
          set({ transactions: updated });
        });
        void finalId;
      } catch {
        set({ pushPending: true }); // tetap aman di localStorage, bisa retry manual
      }
    }
  },

  updateTransaction: async (id, patch) => {
    const next = get().transactions.map((t) =>
      t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t
    );
    localStorageHelpers.save(next);
    set({ transactions: next });

    if (get().userId) {
      try {
        const updated = next.find((t) => t.id === id);
        if (updated) {
          const sb = await getSupabase();
          if (isUuid(id)) {
            const { error } = await sb
              .from("transactions")
              .update(toSupabasePayload(updated))
              .eq("id", id);
            if (error) throw error;
          } else {
            // Baris lama (non-UUID): hapus via client_id lalu insert ulang.
            await sb.from("transactions").delete().eq("client_id", id);
            await syncTxToCloud(updated, (oldId, newId) => {
              const fixed = useFinanceStore
                .getState()
                .transactions.map((t) => (t.id === oldId ? { ...t, id: newId } : t));
              localStorageHelpers.save(fixed);
              set({ transactions: fixed });
            });
          }
        }
      } catch {
        set({ pushPending: true });
      }
    }
  },

  deleteTransaction: async (id) => {
    const next = get().transactions.filter((t) => t.id !== id);
    localStorageHelpers.save(next);
    set({ transactions: next });

    if (get().userId) {
      try {
        const sb = await getSupabase();
        // Hapus baik by id (jika UUID) maupun by client_id (jika id lokal non-UUID).
        let q = isUuid(id)
          ? sb.from("transactions").delete().eq("id", id)
          : sb.from("transactions").delete().eq("client_id", id);
        const { error } = await q;
        if (error) throw error;
      } catch {
        set({ pushPending: true });
      }
    }
  },

  checkSession: async () => {
    try {
      if (!isSupabaseConfigured()) return;
      const sb = await getSupabase();
      const { data } = await sb.auth.getSession();
      const session = data.session;
      if (session?.user) {
        set({ userId: session.user.id, email: session.user.email ?? null });
      }
    } catch {
      /* offline / env belum diisi -> mode lokal murni */
    } finally {
      // Sinyal "cek sesi selesai" — UI boleh menampilkan tombol Login setelah ini.
      set({ userLoaded: true });
    }
  },

  login: async (email, password) => {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: translateAuthError(error.message), hasLocalData: false };
    const hasLocalData = get().transactions.length > 0;
    set({ userId: data.user?.id ?? null, email: data.user?.email ?? null, userLoaded: true });
    return { hasLocalData };
  },

  signup: async (email, password) => {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { error: translateAuthError(error.message), hasLocalData: false };
    // Jika verifikasi email aktif, session/user bisa null -> user belum benar-benar login.
    if (!data.session || !data.user) {
      return {
        error: "CHECK_EMAIL",
        hasLocalData: false,
      };
    }
    const hasLocalData = get().transactions.length > 0;
    set({ userId: data.user.id, email: data.user.email ?? null, userLoaded: true });
    return { hasLocalData };
  },

  logout: async () => {
    try {
      const sb = await getSupabase();
      await sb.auth.signOut();
    } catch {
      /* noop */
    }
    set({ userId: null, email: null, pushPending: false });
  },

  pullFromCloud: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ syncing: true });
    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      const cloud = (data ?? []).map((r) => fromSupabaseRow(r as Record<string, unknown>));
      // Simpan hasil cloud + tandai "sengaja kosong" bila cloud kosong,
      // agar hydrate berikutnya tidak memunculkan dummy lagi.
      localStorageHelpers.save(cloud);
      if (cloud.length === 0) localStorageHelpers.markIntentionallyEmpty();
      else localStorageHelpers.clearIntentionallyEmpty();
      set({ transactions: cloud, pushPending: false });
    } finally {
      set({ syncing: false });
    }
  },

  pushToCloud: async () => {
    const { userId, transactions } = get();
    if (!userId) return;
    set({ syncing: true });
    try {
      const sb = await getSupabase();

      // 1) Baris yang sudah punya UUID valid -> upsert normal (idempotent).
      const uuidRows = transactions.filter((t) => isUuid(t.id)).map(toSupabasePayload);
      for (let i = 0; i < uuidRows.length; i += 500) {
        const { error } = await sb.from("transactions").upsert(uuidRows.slice(i, i + 500));
        if (error) throw error;
      }

      // 2) Baris lokal non-UUID (dummy / id lama) -> kirim TANPA id,
      //    database yang membuat UUID. Hindari duplikasi dengan mengecek
      //    `client_id` yang sudah ada di cloud.
      const legacyRows = transactions.filter((t) => !isUuid(t.id)).map(toSupabasePayload);
      if (legacyRows.length > 0) {
        const { data: existing, error: selErr } = await sb
          .from("transactions")
          .select("client_id");
        if (selErr) throw selErr;
        const existingIds = new Set(
          (existing ?? []).map((r: Record<string, unknown>) => String(r.client_id ?? ""))
        );
        const fresh = legacyRows.filter((r) => !existingIds.has(String(r.client_id)));
        for (let i = 0; i < fresh.length; i += 500) {
          const { error } = await sb.from("transactions").insert(fresh.slice(i, i + 500));
          if (error) throw error;
        }
      }

      // 3) Setelah upload sukses, tarik balik salinan cloud (berisi UUID resmi)
      //    agar id lokal & cloud identik — CRUD berikutnya ikut tersinkron.
      const { data: synced, error: pullErr } = await sb
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (pullErr) throw pullErr;
      const cloud = (synced ?? []).map((r) => fromSupabaseRow(r as Record<string, unknown>));
      localStorageHelpers.save(cloud);
      set({ transactions: cloud, pushPending: false });
    } catch (err) {
      set({ pushPending: true });
      throw err; // lempar agar UI bisa menampilkan pesan error
    } finally {
      set({ syncing: false });
    }
  },
}));
