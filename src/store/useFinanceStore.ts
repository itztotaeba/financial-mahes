"use client";

/**
 * Store Zustand — arsitektur Local-First.
 * - Sumber kebenaran: state di store, yang selalu dicerminkan ke localStorage.
 * - Jika user login (Supabase), setiap CRUD juga disinkronkan ke cloud.
 */
import { create } from "zustand";
import type { Transaction } from "@/types";
import { localStorageHelpers, generateDummyData } from "@/lib/storage";
import { toSupabasePayload, fromSupabaseRow } from "@/lib/supabase";
import { generateId } from "@/lib/utils";

/** Ambil Supabase client secara lazy agar bundle tetap aman tanpa env. */
async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env tidak tersedia");
  return createClient(url, key);
}

interface FinanceState {
  transactions: Transaction[];
  hydrated: boolean; // true setelah load dari localStorage (hindari flash SSR)
  userId: string | null;
  email: string | null;
  syncing: boolean;
  pushPending: boolean; // true jika ada perubahan lokal saat cloud sync gagal

  /** Muat data awal dari localStorage (panggil sekali di root layout). */
  hydrate: () => Promise<void>;

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

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  hydrated: false,
  userId: null,
  email: null,
  syncing: false,
  pushPending: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = localStorageHelpers.load();
    // Pengguna baru tanpa data -> isi dummy data agar dashboard hidup.
    const data = stored.length > 0 ? stored : generateDummyData();
    localStorageHelpers.save(data);
    set({ transactions: data, hydrated: true });
    // Cek sesi Supabase yang tersimpan (tanpa reload halaman).
    await get().checkSession();
  },

  addTransaction: async (input) => {
    const tx: Transaction = { ...input, id: generateId(), created_at: new Date().toISOString() };
    const next = [tx, ...get().transactions];
    localStorageHelpers.save(next);
    set({ transactions: next });

    // Sinkron ke cloud bila sudah login.
    if (get().userId) {
      try {
        const sb = await getSupabase();
        const { error } = await sb.from("transactions").insert(toSupabasePayload(tx));
        if (error) throw error;
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
        const sb = await getSupabase();
        const updated = next.find((t) => t.id === id);
        if (updated) {
          const { error } = await sb
            .from("transactions")
            .update(toSupabasePayload(updated))
            .eq("id", id);
          if (error) throw error;
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
        const { error } = await sb.from("transactions").delete().eq("id", id);
        if (error) throw error;
      } catch {
        set({ pushPending: true });
      }
    }
  },

  checkSession: async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    try {
      const sb = await getSupabase();
      const { data } = await sb.auth.getSession();
      const session = data.session;
      if (session?.user) {
        set({ userId: session.user.id, email: session.user.email ?? null });
      }
    } catch {
      /* offline / env belum diisi -> mode lokal murni */
    }
  },

  login: async (email, password) => {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message, hasLocalData: false };
    const hasLocalData = get().transactions.length > 0;
    set({ userId: data.user?.id ?? null, email: data.user?.email ?? null });
    return { hasLocalData };
  },

  signup: async (email, password) => {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { error: error.message, hasLocalData: false };
    const hasLocalData = get().transactions.length > 0;
    set({ userId: data.user?.id ?? null, email: data.user?.email ?? null });
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
      localStorageHelpers.save(cloud);
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
      const payload = transactions.map(toSupabasePayload);
      // Upsert bertahap 500 baris agar tidak melewati batas ukuran request.
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await sb.from("transactions").upsert(payload.slice(i, i + 500));
        if (error) throw error;
      }
      set({ pushPending: false });
    } finally {
      set({ syncing: false });
    }
  },
}));
