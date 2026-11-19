"use client";

/**
 * Store Zustand — arsitektur Local-First.
 * - Sumber kebenaran: state di store, yang selalu dicerminkan ke localStorage.
 * - Jika user login (Supabase), setiap CRUD juga disinkronkan ke cloud.
 */
import { create } from "zustand";
import type { Transaction, CategoryBudget, SavingsGoal } from "@/types";
import { localStorageHelpers, DEFAULT_CATEGORY_BUDGETS } from "@/lib/storage";
import { toSupabasePayload, fromSupabaseRow, isUuid, isSupabaseConfigured } from "@/lib/supabase";
import { generateId, parseDate } from "@/lib/utils";
import { getSupabaseClient, normalizeSupabaseUrl } from "@/lib/supabaseClient";

/**
 * Kunci sorting untuk daftar transaksi: epoch ms dari WAKTU TRANSAKSI
 * (tanggal + jam yang diinput user) — BUKAN waktu input — supaya urutan
 * daftar selalu sinkron dengan tanggal/jam transaksi. Diekspor agar
 * store dan selector dashboard memakai logika yang sama persis.
 * Fallback berjenjang: date valid -> created_at/inputted_at -> 0.
 */
export function sortKeyOf(t: Transaction): number {
  // 1) Waktu transaksi sesuai yang diinput (zona lokal, toleran format).
  const d = t.date ? parseDate(t.date) : null;
  if (d && !Number.isNaN(d.getTime())) return d.getTime();
  // 2) Fallback: timestamp sistem (baris tanpa date valid).
  const raw = t.inputted_at ?? t.created_at;
  if (raw) {
    const ms = Date.parse(raw);
    if (!Number.isNaN(ms)) return ms;
  }
  return 0;
}

/**
 * Deteksi sesi basi/rusak di localStorage.
 *
 * Akar masalah GET 404 `/auth/v1/token?grant_type=refresh_token`:
 * supabase-js menyimpan sesi pada key `sb-<project-ref>-auth-token`.
 * Bila URL project berubah / env sempat salah / token lama sudah dicabut,
 * refresh token tersimpan akan ditolak server (HTTP 404 "Invalid Refresh
 * Token") — dan GoTrueClient terus-menerus mencoba me-refresh setiap kali
 * aplikasi dibuka, memicu error CORS preflight + request berulang.
 *
 * Solusi: bila key sesi terdeteksi TAPI project ref di URL env tidak cocok
 * dengan ref pada key tersebut, sesi itu pasti sisa konfigurasi lama ->
 * bersihkan sekali saja sebelum client dibuat.
 */
let staleSessionChecked = false;
function purgeStaleStoredSession(): void {
  if (staleSessionChecked || typeof window === "undefined") return;
  staleSessionChecked = true;
  try {
    const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (!url) return; // env invalid -> biarkan apa adanya (getSupabaseClient yang menolak)
    const ref = new URL(url).hostname.split(".")[0];
    const prefix = "sb-";
    const suffix = "-auth-token";
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(prefix) || !k.endsWith(suffix)) continue;
      const storedRef = k.slice(prefix.length, k.length - suffix.length);
      if (storedRef && storedRef !== ref) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    /* localStorage diblokir (private mode) -> noop */
  }
}

/**
 * Ambil Supabase client — SELALU instance singleton yang sama.
 * (Dulu tiap pemanggilan membuat createClient baru -> warning
 * "Multiple GoTrueClient instances detected" di console.)
 */
function getSupabase() {
  purgeStaleStoredSession(); // sekali saja: bersihkan sesi sisa konfigurasi lama (penyebab 404 refresh_token)
  return Promise.resolve(getSupabaseClient());
}

/**
 * Kenali error "endpoint tidak ditemukan / tabel belum ada" (HTTP 404 dari
 * PostgREST/GoTrue). Pada deployment Vercel, URL env yang keliru membuat
 * request di-resolve relatif ke domain sendiri -> selalu 404. Permintaan
 * semacam ini TIDAK boleh di-retry — gagal cepat agar UI tidak menggantung.
 */
function isNotFoundError(err: unknown): boolean {
  const e = err as { code?: string; status?: number; statusCode?: number; message?: string } | null;
  if (!e) return false;
  return (
    e.code === "PGRST205" || // tabel/view tidak ada di schema cache
    e.status === 404 ||
    e.statusCode === 404 ||
    /not found/i.test(String(e.message ?? ""))
  );
}

/**
 * Kenali error Postgres 42P10: "there is no unique or exclusion constraint
 * matching the ON CONFLICT specification". Terjadi bila upsert dengan
 * `onConflict` dikirim ke database yang belum punya unique index
 * (migration 006 belum dijalankan). Strategi cadangan: replace-by-key
 * (hapus baris lama via filter, lalu insert) — TIDAK memakai ON CONFLICT
 * sama sekali sehingga selalu berhasil walau index belum ada.
 */
function isMissingUniqueConstraintError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  return (
    e.code === "42P10" ||
    /ON CONFLICT/i.test(String(e.message ?? ""))
  );
}

/**
 * Ganti satu anggaran (user_id + category + month) di cloud TANPA upsert:
 * delete by key lalu insert, dan kembalikan id baru hasil insert.
 */
async function replaceBudgetByFilter(
  sb: Awaited<ReturnType<typeof getSupabase>>,
  userId: string,
  budget: { category: string; amount: number; month: string | null }
): Promise<string | null> {
  let del = sb
    .from("category_budgets")
    .delete()
    .eq("user_id", userId)
    .eq("category", budget.category);
  del = budget.month ? del.eq("month", budget.month) : del.is("month", null);
  await del;

  const { data: inserted } = await sb
    .from("category_budgets")
    .insert({
      user_id: userId,
      category: budget.category,
      amount: budget.amount,
      month: budget.month,
    })
    .select("id")
    .single();

  return inserted?.id ? String(inserted.id) : null;
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
  userId?: string | null,
  replaceLocalId?: (oldId: string, newId: string) => void
): Promise<string> {
  const sb = await getSupabase();
  const payload = toSupabasePayload(tx) as Record<string, unknown>;
  if (userId) {
    payload.user_id = userId;
  }

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
  budgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  hydrated: boolean; // true setelah load dari localStorage (hindari flash SSR)
  userLoaded: boolean; // true setelah cek sesi Supabase pertama kali (stabil untuk UI)
  userId: string | null;
  email: string | null;
  syncing: boolean;
  pushPending: boolean; // true jika ada perubahan lokal saat cloud sync gagal
  lastSyncedAt: number; // epoch ms sinkronisasi cloud terakhir (deteksi perubahan antar-device)

  /** Muat data awal dari localStorage (panggil sekali di root layout). */
  hydrate: () => Promise<void>;
  /** Kosongkan data tanpa memunculkan dummy lagi (untuk pull cloud yang kosong). */
  clearTransactions: () => void;

  /** Urutan stabil terbaru -> terlama berdasarkan waktu input (created_at). */
  sortedByInput: (list?: Transaction[]) => Transaction[];

  // ---- CRUD Transaksi ----
  addTransaction: (t: Omit<Transaction, "id" | "created_at" | "inputted_at">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // ---- CRUD Anggaran per Kategori ----
  setCategoryBudget: (category: string, amount: number, month?: string) => Promise<void>;
  setMultipleBudgets: (list: { category: string; amount: number; month?: string }[]) => Promise<void>;
  removeCategoryBudget: (category: string, month?: string) => Promise<void>;

  // ---- CRUD Target Tabungan ----
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateSavingsGoal: (id: string, patch: Partial<Omit<SavingsGoal, "id">>) => Promise<void>;
  depositToGoal: (id: string, amount: number) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  // ---- Auth & Sinkronisasi ----
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string; hasLocalData: boolean }>;
  signup: (email: string, password: string) => Promise<{ error?: string; hasLocalData: boolean }>;
  logout: () => Promise<void>;
  /** Tarik data cloud -> menggantikan isi localStorage. */
  pullFromCloud: () => Promise<void>;
  /** Dorong seluruh data lokal -> upsert ke Supabase. */
  pushToCloud: () => Promise<void>;
  /**
   * Pull-on-load: bila user login DAN ada perubahan di cloud sejak sync
   * terakhir (atau tab lain/device lain mengirim pesan), tarik ulang data.
   * Dipanggil saat hydrate & ketika tab kembali fokus — membuat refresh
   * browser di device B langsung menampilkan data terbaru dari device A.
   */
  refreshIfStale: () => Promise<void>;
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

/**
 * Helper bersama: tarik SELURUH snapshot cloud (transactions + budgets + goals)
 * -> simpan ke localStorage + update state store + perbarui watermark `lastSyncedAt`.
 * Dipakai oleh pullFromCloud, refreshIfStale, dan Realtime onChange.
 */
async function applyCloudSnapshot(
  _userId: string,
  set: (partial: Partial<FinanceState>) => void,
  get: () => FinanceState,
  opts?: { preservePendingLocalBudgets?: boolean }
): Promise<void> {
  const sb = await getSupabase();

  // 1) Transaksi
  const { data: txData, error: txErr } = await sb
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (txErr) throw txErr;
  const cloud = (txData ?? []).map((r) => fromSupabaseRow(r as Record<string, unknown>));

  // 2) Anggaran kategori — query ini yang dulu memicu GET 404 di halaman
  //    /anggaran bila tabel `category_budgets` belum ada di schema cache
  //    ATAU URL Supabase salah (request di-resolve ke domain Vercel).
  //    Kesalahan di sini TIDAK boleh menggagalkan snapshot transaksi:
  //    log warning + lewati bagian anggaran.
  let cloudBudgetFetchFailed = false;
  const { data: budgetData, error: budgetErr } = await sb
    .from("category_budgets")
    .select("id, category, amount, month");
  if (budgetErr) {
    cloudBudgetFetchFailed = true;
    console.warn("Gagal tarik anggaran dari cloud:", budgetErr.message);
  }
  const cloudBudgets: import("@/types").CategoryBudget[] = (budgetData ?? []).map(
    (r: Record<string, unknown>) => ({
      id: String(r.id),
      category: String(r.category),
      amount: Number(r.amount) || 0,
      month: r.month ? String(r.month) : undefined,
    })
  );

  // 3) Target tabungan
  const { data: goalData } = await sb
    .from("savings_goals")
    .select("id, name, target_amount, current_amount, target_date, color, created_at, updated_at")
    .order("created_at", { ascending: false });
  const cloudGoals: import("@/types").SavingsGoal[] = (goalData ?? []).map(
    (r: Record<string, unknown>) => ({
      id: String(r.id),
      name: String(r.name),
      targetAmount: Number(r.target_amount) || 0,
      currentAmount: Number(r.current_amount) || 0,
      targetDate: r.target_date ? String(r.target_date) : undefined,
      color: r.color ? String(r.color) : undefined,
      created_at: r.created_at ? String(r.created_at) : undefined,
      updated_at: r.updated_at ? String(r.updated_at) : undefined,
    })
  );

  const now = Date.now();

  // Simpan semua ke localStorage
  localStorageHelpers.save(cloud);
  localStorageHelpers.setLastSyncedAt(now);
  if (cloud.length === 0) localStorageHelpers.markIntentionallyEmpty();
  else localStorageHelpers.clearIntentionallyEmpty();

  // Budgets: pakai cloud jika ada data, jika tidak jangan timpa (biarkan lokal).
  // Khusus kegagalan 404 (tabel belum ada / URL salah): JANGAN tandai synced,
  // agar refreshIfStale mencoba tarik ulang setelah konfigurasi/skema diperbaiki.
  // Safety-net: bila cloud mengembalikan array KOSONG padahal local masih berisi
  // nilai DEFAULT (belum pernah sync sukses), jangan timpa local — biarkan nilai
  // default tersimpan & ter-push saat user mengubahnya. Ini mencegah target
  // anggaran "kembali ke default" setiap logout/login ketika push cloud gagal.
  const localBudgets = get().budgets;
  // Local dianggap "masih default" bila persis sama dengan DEFAULT_CATEGORY_BUDGETS
  // (artinya belum pernah diubah user / belum pernah sync sukses dari cloud).
  const localLooksDefault =
    localBudgets.length === DEFAULT_CATEGORY_BUDGETS.length &&
    JSON.stringify(localBudgets.map((b) => [b.category, b.amount, b.month ?? ""])) ===
      JSON.stringify(DEFAULT_CATEGORY_BUDGETS.map((b) => [b.category, b.amount, b.month ?? ""]));
  // Bila ada perubahan lokal yang belum sempat ter-push (mis. push gagal karena
  // error 42P10), JANGAN timpa anggaran lokal dengan snapshot cloud —
  // kalau tidak, target anggaran kembali ke default setiap logout/login.
  const preserveLocalBudgets =
    opts?.preservePendingLocalBudgets === true || get().pushPending === true;

  if (preserveLocalBudgets) {
    // biarkan budgets lokal apa adanya; akan di-push ulang oleh pushToCloud
  } else if (cloudBudgets.length > 0) {
    localStorageHelpers.saveBudgets(cloudBudgets);
  } else if (!cloudBudgetFetchFailed && !localLooksDefault) {
    // Cloud benar-benar kosong & local sudah pernah disinkronkan berarti
    // user memang menghapus semua anggaran di device lain -> sinkron kosong.
    localStorageHelpers.saveBudgets([]);
  }
  // Goals: pakai cloud (termasuk array kosong = user memang hapus semua)
  // Gunakan flag khusus agar bisa dibedakan "belum pernah ada" vs "sudah dihapus semua"
  localStorageHelpers.saveGoals(cloudGoals);
  localStorageHelpers.setBudgetsSynced(
    cloudBudgets.length > 0 || !cloudBudgetFetchFailed
  );

  set({
    transactions: cloud,
    budgets: preserveLocalBudgets
      ? localBudgets
      : cloudBudgets.length > 0
        ? cloudBudgets
        : !cloudBudgetFetchFailed && !localLooksDefault
          ? []
          : localBudgets,
    savingsGoals: cloudGoals,
    // Bila ada perubahan lokal yang tertunda (push gagal), JANGAN hapus flag
    // pushPending — agar refreshIfStale tidak menimpa anggaran lokal dengan
    // snapshot cloud dan pushToCloud bisa mencoba ulang nanti.
    pushPending: preserveLocalBudgets ? true : false,
    lastSyncedAt: now,
  });
  notifyOtherTabs(); // sinkronkan tab lain di perangkat yang sama
  void get;
}

/** Beri tahu tab lain di perangkat yang sama bahwa data cloud berubah. */
function notifyOtherTabs(): void {
  if (typeof window === "undefined") return;
  try {
    const bc = new BroadcastChannel("financial-mahes-sync");
    bc.postMessage({ type: "cloud-changed" });
    bc.close();
  } catch {
    /* unsupported -> noop */
  }
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  budgets: [],
  savingsGoals: [],
  hydrated: false,
  userLoaded: false,
  userId: null,
  email: null,
  syncing: false,
  pushPending: false,
  lastSyncedAt: localStorageHelpers.getLastSyncedAt(),

  hydrate: async () => {
    if (get().hydrated) return;
    // Local-first murni: apa adanya di localStorage.
    const data = localStorageHelpers.load();
    const budgets = localStorageHelpers.loadBudgets();
    const goals = localStorageHelpers.loadGoals();
    set({
      transactions: data,
      budgets,
      savingsGoals: goals,
      hydrated: true,
    });
    // Cek sesi Supabase yang tersimpan (tanpa reload halaman).
    await get().checkSession();
    // Pull-on-load: bila login dan cloud lebih baru dari cache lokal
    void get().refreshIfStale();
  },

  clearTransactions: () => {
    localStorageHelpers.markIntentionallyEmpty();
    set({ transactions: [] });
  },

  /**
   * Urutan daftar transaksi: terbaru -> terlama berdasarkan WAKTU TRANSAKSI
   * (tanggal + jam yang diinput user), bukan waktu input.
   */
  sortedByInput: (list) => {
    const arr = list ?? get().transactions;
    return [...arr].sort((a, b) => sortKeyOf(b) - sortKeyOf(a));
  },

  // ---- CRUD Anggaran per Kategori ----
  setCategoryBudget: async (category, amount, month) => {
    const current = get().budgets;
    const normMonth = month ?? "";
    const existingIndex = current.findIndex(
      (b) => b.category === category && (b.month ?? "") === normMonth
    );
    let next: CategoryBudget[];
    if (existingIndex >= 0) {
      next = current.map((b, idx) =>
        idx === existingIndex ? { ...b, amount: Math.max(0, Math.round(amount)) } : b
      );
    } else {
      next = [...current, { category, amount: Math.max(0, Math.round(amount)), month }];
    }
    localStorageHelpers.saveBudgets(next);
    set({ budgets: next });

    // Sync ke cloud jika login
    const { userId } = get();
    if (userId) {
      try {
        const sb = await getSupabase();
        // Cek apakah baris ini sudah ada (untuk dapat `id`-nya)
        const existing = next[existingIndex >= 0 ? existingIndex : next.length - 1];
        const localId = (existing as CategoryBudget & { id?: string } | undefined)?.id;
        if (localId && isUuid(localId)) {
          // Update via UUID resmi. Bila gagal (mis. baris hilang di cloud /
          // endpoint 404), JANGAN biarkan id basi tersimpan — fallback upsert
          // dengan id yang sama agar tetap satu baris dan sinkron kembali.
          const { error: updErr } = await sb
            .from("category_budgets")
            .update({ amount: Math.max(0, Math.round(amount)), updated_at: new Date().toISOString() })
            .eq("id", localId);
          if (updErr) {
            if (isNotFoundError(updErr)) throw updErr;
            // Fallback upsert dengan id — bila unique index belum ada (42P10),
            // pakai replace-by-key agar tetap sinkron tanpa ON CONFLICT.
            const { error: upErr } = await sb.from("category_budgets").upsert({
              id: localId,
              user_id: userId,
              category,
              amount: Math.max(0, Math.round(amount)),
              month: month ?? null,
            });
            if (upErr && !isMissingUniqueConstraintError(upErr)) throw upErr;
            if (upErr) {
              const newId = await replaceBudgetByFilter(sb, userId, {
                category,
                amount: Math.max(0, Math.round(amount)),
                month: month ?? null,
              });
              if (newId && newId !== localId) {
                const remapped = next.map((b) =>
                  b.id === localId ? { ...b, id: newId } : b
                );
                localStorageHelpers.saveBudgets(remapped);
                set({ budgets: remapped });
              }
            }
          }
        } else {
          // Upsert berbasis unique index (user_id, category, coalesce(month,''))
          // — migration 006 — sehingga tidak pernah menghasilkan baris ganda
          // walau device lain membuat anggaran serupa lebih dulu.
          // Bila database belum punya unique index tsb (error 42P10),
          // fallback ke replace-by-key (delete by filter + insert) yang
          // tidak memakai ON CONFLICT sama sekali.
          const payload = {
            user_id: userId,
            category,
            amount: Math.max(0, Math.round(amount)),
            month: month ?? null,
          };
          const { data: inserted, error: insErr } = await sb
            .from("category_budgets")
            .upsert(payload, { onConflict: "user_id,category,month" })
            .select("id")
            .single();

          let finalId: string | null = inserted?.id ? String(inserted.id) : null;

          if (insErr) {
            if (!isMissingUniqueConstraintError(insErr)) throw insErr;
            console.warn(
              "Unique index (user_id, category, month) belum ada di database — memakai fallback delete+insert. Jalankan migration 006 di Supabase."
            );
            finalId = await replaceBudgetByFilter(sb, userId, {
              category,
              amount: payload.amount,
              month: payload.month,
            });
          }

          // Simpan id cloud ke state lokal agar update/delete berikutnya bisa pakai id
          if (finalId) {
            const withId = next.map((b) =>
              b.category === category && (b.month ?? "") === normMonth
                ? { ...b, id: finalId }
                : b
            );
            localStorageHelpers.saveBudgets(withId);
            set({ budgets: withId });
          }
        }
        notifyOtherTabs();
      } catch (err) {
        console.warn("Sync anggaran ke cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  setMultipleBudgets: async (list) => {
    let current = [...get().budgets];
    for (const item of list) {
      const normMonth = item.month ?? "";
      const idx = current.findIndex(
        (b) => b.category === item.category && (b.month ?? "") === normMonth
      );
      if (idx >= 0) {
        current[idx] = { ...current[idx], amount: Math.max(0, Math.round(item.amount)) };
      } else {
        current.push({
          category: item.category,
          amount: Math.max(0, Math.round(item.amount)),
          month: item.month,
        });
      }
    }
    localStorageHelpers.saveBudgets(current);
    set({ budgets: current });

    // Sync ke cloud jika login — gunakan pull-after-push agar id cloud tersimpan
    const { userId } = get();
    if (userId) {
      try {
        const sb = await getSupabase();
        // Hapus semua budgets lama milik user, lalu insert ulang
        await sb.from("category_budgets").delete().eq("user_id", userId);
        const rows = current.map((b) => ({
          user_id: userId,
          category: b.category,
          amount: b.amount,
          month: b.month ?? null,
        }));
        if (rows.length > 0) {
          const { data: inserted } = await sb
            .from("category_budgets")
            .insert(rows)
            .select("id, category, month");
          // Simpan id cloud ke state
          if (inserted && inserted.length > 0) {
            const withIds = current.map((b) => {
              const match = (inserted as Array<Record<string, unknown>>).find(
                (r) => r.category === b.category && (r.month ?? null) === (b.month ?? null)
              );
              return match ? { ...b, id: String(match.id) } : b;
            });
            localStorageHelpers.saveBudgets(withIds);
            set({ budgets: withIds });
          }
        }
        notifyOtherTabs();
      } catch (err) {
        console.warn("Sync multiple anggaran ke cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  removeCategoryBudget: async (category, month) => {
    const normMonth = month ?? "";
    const toRemove = get().budgets.find(
      (b) => b.category === category && (b.month ?? "") === normMonth
    );
    const next = get().budgets.filter(
      (b) => !(b.category === category && (b.month ?? "") === normMonth)
    );
    localStorageHelpers.saveBudgets(next);
    set({ budgets: next });

    const { userId } = get();
    if (userId && toRemove) {
      try {
        const sb = await getSupabase();
        const cloudId = (toRemove as CategoryBudget & { id?: string }).id;
        if (cloudId) {
          await sb.from("category_budgets").delete().eq("id", cloudId);
        } else {
          // Fallback: hapus by user_id + category + month
          let q = sb
            .from("category_budgets")
            .delete()
            .eq("user_id", userId)
            .eq("category", category);
          if (month) q = q.eq("month", month);
          else q = q.is("month", null);
          await q;
        }
        notifyOtherTabs();
      } catch (err) {
        console.warn("Hapus anggaran dari cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  // ---- CRUD Target Tabungan ----
  addSavingsGoal: async (goalInput) => {
    const newGoal: SavingsGoal = {
      ...goalInput,
      id: generateId(),
      targetAmount: Math.max(0, Math.round(goalInput.targetAmount)),
      currentAmount: Math.max(0, Math.round(goalInput.currentAmount || 0)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const next = [newGoal, ...get().savingsGoals];
    localStorageHelpers.saveGoals(next);
    set({ savingsGoals: next });

    const { userId } = get();
    if (userId) {
      try {
        const sb = await getSupabase();
        const { data: inserted } = await sb
          .from("savings_goals")
          .insert({
            user_id: userId,
            name: newGoal.name,
            target_amount: newGoal.targetAmount,
            current_amount: newGoal.currentAmount,
            target_date: newGoal.targetDate ?? null,
            color: newGoal.color ?? "#2141E0",
          })
          .select("id")
          .single();
        // Ganti id lokal (dummy) dengan UUID resmi dari cloud
        if (inserted?.id) {
          const cloudId = String(inserted.id);
          const withId = get().savingsGoals.map((g) =>
            g.id === newGoal.id ? { ...g, id: cloudId } : g
          );
          localStorageHelpers.saveGoals(withId);
          set({ savingsGoals: withId });
        }
        notifyOtherTabs();
      } catch (err) {
        console.warn("Sync target tabungan ke cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  updateSavingsGoal: async (id, patch) => {
    const next = get().savingsGoals.map((g) => {
      if (g.id !== id) return g;
      return {
        ...g,
        ...patch,
        targetAmount:
          patch.targetAmount !== undefined
            ? Math.max(0, Math.round(patch.targetAmount))
            : g.targetAmount,
        currentAmount:
          patch.currentAmount !== undefined
            ? Math.max(0, Math.round(patch.currentAmount))
            : g.currentAmount,
        updated_at: new Date().toISOString(),
      };
    });
    localStorageHelpers.saveGoals(next);
    set({ savingsGoals: next });

    const { userId } = get();
    if (userId && isUuid(id)) {
      try {
        const sb = await getSupabase();
        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (patch.name !== undefined) updatePayload.name = patch.name;
        if (patch.targetAmount !== undefined)
          updatePayload.target_amount = Math.max(0, Math.round(patch.targetAmount));
        if (patch.currentAmount !== undefined)
          updatePayload.current_amount = Math.max(0, Math.round(patch.currentAmount));
        if (patch.targetDate !== undefined) updatePayload.target_date = patch.targetDate ?? null;
        if (patch.color !== undefined) updatePayload.color = patch.color;
        await sb.from("savings_goals").update(updatePayload).eq("id", id);
        notifyOtherTabs();
      } catch (err) {
        console.warn("Update target tabungan di cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  depositToGoal: async (id, amount) => {
    if (amount <= 0) return;
    const next = get().savingsGoals.map((g) => {
      if (g.id !== id) return g;
      const updatedAmount = Math.max(0, g.currentAmount + Math.round(amount));
      return {
        ...g,
        currentAmount: updatedAmount,
        updated_at: new Date().toISOString(),
      };
    });
    localStorageHelpers.saveGoals(next);
    set({ savingsGoals: next });

    const { userId } = get();
    if (userId && isUuid(id)) {
      try {
        const goal = next.find((g) => g.id === id);
        if (goal) {
          const sb = await getSupabase();
          await sb
            .from("savings_goals")
            .update({ current_amount: goal.currentAmount, updated_at: new Date().toISOString() })
            .eq("id", id);
          notifyOtherTabs();
        }
      } catch (err) {
        console.warn("Sync deposit tabungan ke cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  deleteSavingsGoal: async (id) => {
    const next = get().savingsGoals.filter((g) => g.id !== id);
    localStorageHelpers.saveGoals(next);
    set({ savingsGoals: next });

    const { userId } = get();
    if (userId && isUuid(id)) {
      try {
        const sb = await getSupabase();
        await sb.from("savings_goals").delete().eq("id", id);
        notifyOtherTabs();
      } catch (err) {
        console.warn("Hapus target tabungan dari cloud gagal:", err);
      }
    }

    notifyOtherTabs();
  },

  addTransaction: async (input) => {
    const tx: Transaction = {
      ...input,
      id: generateId(),
      created_at: new Date().toISOString(),
      inputted_at: new Date().toISOString(),
    };
    const next = [tx, ...get().transactions];
    localStorageHelpers.save(next);
    set({ transactions: next });

    // Sinkron ke cloud bila sudah login.
    const { userId } = get();
    if (userId) {
      try {
        const finalId = await syncTxToCloud(tx, userId, (oldId, newId) => {
          // Ganti id dummy lokal dengan UUID resmi dari cloud.
          const updated = useFinanceStore
            .getState()
            .transactions.map((t) => (t.id === oldId ? { ...t, id: newId } : t));
          localStorageHelpers.save(updated);
          set({ transactions: updated, pushPending: false });
        });
        void finalId;
        set({ pushPending: false });
        notifyOtherTabs();
      } catch (err) {
        console.warn("Sinkron cloud gagal, data aman di penyimpanan lokal:", err);
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

    const { userId } = get();
    if (userId) {
      try {
        const updated = next.find((t) => t.id === id);
        if (updated) {
          const sb = await getSupabase();
          if (isUuid(id)) {
            const payload = toSupabasePayload(updated) as Record<string, unknown>;
            payload.user_id = userId;
            const { error } = await sb
              .from("transactions")
              .update(payload)
              .eq("id", id);
            if (error) throw error;
          } else {
            // Baris lama (non-UUID): hapus via client_id lalu insert ulang.
            await sb.from("transactions").delete().eq("client_id", id);
            await syncTxToCloud(updated, userId, (oldId, newId) => {
              const fixed = useFinanceStore
                .getState()
                .transactions.map((t) => (t.id === oldId ? { ...t, id: newId } : t));
              localStorageHelpers.save(fixed);
              set({ transactions: fixed, pushPending: false });
            });
          }
        }
        set({ pushPending: false });
        notifyOtherTabs();
      } catch (err) {
        console.warn("Update cloud gagal, data aman di penyimpanan lokal:", err);
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
        notifyOtherTabs();
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
    // Normalisasi input: spasi terselubung di email adalah penyebab umum
    // request auth menggantung/lambat tanpa pesan error yang jelas.
    const cleanEmail = email.trim().toLowerCase();
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) return { error: translateAuthError(error.message), hasLocalData: false };
    set({ userId: data.user?.id ?? null, email: data.user?.email ?? null, userLoaded: true });

    // ===== Cloud-first =====
    // Setelah login, SELALU tarik data akun dari Supabase dan jadikan sumber
    // tampilan (sekaligus cache lokal). Tidak ada lagi prompt "upload dummy".
    try {
      await applyCloudSnapshot(data.user?.id ?? "", set, get, { preservePendingLocalBudgets: true });
    } catch {
      /* gagal tarik cloud -> tetap tampilkan data lokal, sync manual via Pengaturan */
    }

    // `hasLocalData` kini berarti: masih ada transaksi lokal yang TIDAK ada di
    // cloud (mis. dicatat offline sebelum login) -> UI boleh menawarkan upload.
    const localOnly = get().transactions.filter((t) => !isUuid(t.id)).length > 0;
    return { hasLocalData: localOnly };
  },

  signup: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signUp({ email: cleanEmail, password });
    if (error) return { error: translateAuthError(error.message), hasLocalData: false };
    // Jika verifikasi email aktif, session/user bisa null -> user belum benar-benar login.
    if (!data.session || !data.user) {
      return {
        error: "CHECK_EMAIL",
        hasLocalData: false,
      };
    }
    set({ userId: data.user.id, email: data.user.email ?? null, userLoaded: true });

    // Akun baru: cloud pasti kosong -> mulai bersih (tanpa dummy).
    // Jika user sudah sempat mencatat secara lokal, tawarkan upload sekali saja.
    const hasLocalData = get().transactions.length > 0;
    if (!hasLocalData) localStorageHelpers.markIntentionallyEmpty();
    return { hasLocalData };
  },

  logout: async () => {
    try {
      const sb = await getSupabase();
      await sb.auth.signOut();
    } catch {
      /* noop */
    }
    // Bersihkan flag sync budgets agar saat login berikutnya
    // selalu pull data terbaru dari cloud, bukan gunakan cache lokal.
    localStorageHelpers.setBudgetsSynced(false);
    set({ userId: null, email: null, pushPending: false });
  },

  pullFromCloud: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ syncing: true });
    try {
      await applyCloudSnapshot(userId, set, get);
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Pull-on-load — strategi "watermark" agar hemat & andal:
   * 1. Head-count `count()` ringan + timestamp perubahan terbaru di cloud.
   * 2. Bila jumlah baris ATAU waktu berubah sejak sync terakhir -> full pull.
   * 3. Bila tidak berubah -> tidak melakukan apa-apa (cache lokal valid).
   * Diberi timeout 8 detik agar tidak memblokir UI bila koneksi lambat.
   */
  refreshIfStale: async () => {
    const { userId, hydrated, pushPending } = get();
    // Jika ada perubahan lokal yang tertunda (pushPending), jangan tiban dengan snapshot cloud
    if (!userId || !hydrated || !isSupabaseConfigured() || pushPending) return;
    try {
      // Timeout guard: batalkan jika lebih dari 8 detik agar login tidak lambat
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller
        ? setTimeout(() => controller.abort(), 8000)
        : null;
      try {
        const sb = await getSupabase();
        // Kolom updated_at sudah ada di skema (001_init.sql) dan di-set oleh DB.
        const { count, error: cntErr } = await sb
          .from("transactions")
          .select("id", { count: "exact", head: true });
        if (cntErr) {
          // Gagal cepat bila endpoint tidak ditemukan (404) — biasanya karena
          // NEXT_PUBLIC_SUPABASE_URL keliru di deployment sehingga request
          // diarahkan ke domain Vercel sendiri. Jangan biarkan polling
          // mengulang request sia-sia tiap siklus; cukup log sekali warning.
          if (isNotFoundError(cntErr)) {
            console.warn(
              "Cek sinkronisasi cloud dilewati: endpoint Supabase tidak ditemukan (HTTP 404). Periksa NEXT_PUBLIC_SUPABASE_URL & jalankan migration supabase/migrations.",
            );
          }
          return; // offline / env belum siap -> biarkan cache lokal
        }
        const { data: latest, error: latErr } = await sb
          .from("transactions")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latErr) return;

        const lastChangedMs = latest?.updated_at ? Date.parse(String(latest.updated_at)) : 0;
        const localCount = get().transactions.length;
        const staleByCount = count !== null && count !== localCount;
        const staleByTime = lastChangedMs > get().lastSyncedAt + 1500; // toleransi drift jam
        // Juga cek budgets/goals jika belum pernah di-pull dari cloud
        const budgetsNeverSynced = !localStorageHelpers.isBudgetsSynced();

        if (staleByCount || staleByTime || budgetsNeverSynced) {
          await applyCloudSnapshot(userId, set, get);
        } else {
          // Sinkron dengan cloud — perbarui watermark lokal.
          localStorageHelpers.setLastSyncedAt(Date.now());
          set({ lastSyncedAt: Date.now() });
        }
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch {
      /* gagal cek -> aman, tetap pakai cache lokal */
    }
  },

  pushToCloud: async () => {
    const { userId, transactions, budgets, savingsGoals } = get();
    if (!userId) return;
    set({ syncing: true });
    try {
      const sb = await getSupabase();

      // === 1) Transaksi ===
      // 1a) Baris yang sudah punya UUID valid -> upsert normal (idempotent).
      const uuidRows = transactions.filter((t) => isUuid(t.id)).map(toSupabasePayload);
      for (let i = 0; i < uuidRows.length; i += 500) {
        const { error } = await sb.from("transactions").upsert(uuidRows.slice(i, i + 500));
        if (error) throw error;
      }

      // 1b) Baris lokal non-UUID (dummy / id lama) -> kirim TANPA id,
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

      // === 2) Anggaran kategori ===
      // Strategi: replace-all (hapus semua baris user, insert ulang)
      await sb.from("category_budgets").delete().eq("user_id", userId);
      if (budgets.length > 0) {
        const budgetRows = budgets.map((b) => ({
          user_id: userId,
          category: b.category,
          amount: b.amount,
          month: b.month ?? null,
        }));
        await sb.from("category_budgets").insert(budgetRows);
      }
      localStorageHelpers.setBudgetsSynced(true);

      // === 3) Target tabungan ===
      // Hanya upload goals yang belum ada di cloud (bukan UUID) atau semua jika user minta sync manual
      const goalRows = savingsGoals.map((g) => ({
        user_id: userId,
        name: g.name,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate ?? null,
        color: g.color ?? "#2141E0",
      }));
      // Hapus semua lalu insert ulang (simple replace strategy untuk manual push)
      await sb.from("savings_goals").delete().eq("user_id", userId);
      if (goalRows.length > 0) {
        await sb.from("savings_goals").insert(goalRows);
      }

      // 4) Setelah upload sukses, tarik balik salinan cloud (berisi UUID resmi)
      //    agar id lokal & cloud identik — CRUD berikutnya ikut tersinkron.
      await applyCloudSnapshot(userId, set, get);
    } catch (err) {
      set({ pushPending: true });
      throw err; // lempar agar UI bisa menampilkan pesan error
    } finally {
      set({ syncing: false });
    }
  },
}));
