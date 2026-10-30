import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

/*
  Tipografi global: Manrope (UI/heading) + Inter (angka/tabel/data).
  Didefinisikan lewat @font-face self-host di globals.css (bukan di sini).

  CATATAN PENTING (kenapa tidak pakai next/font/google):
  Build Vercel gagal dengan `TypeError: Cannot read properties of null
  (reading '1')` di @next/font/dist/google/loader.js — bug internal loader
  next/font pada Next 14.2.5 ketika fetch metadata Google Fonts gagal/
  terblokir di environment CI Vercel. Solusi paling andal: self-host file
  WOFF2 di /public/fonts + @font-face lokal (tanpa network saat build,
  jadi tidak mungkin error lagi).
*/

export const metadata: Metadata = {
  title: "Financial Mahes",
  description:
    "Catat, lihat pola, dan kendalikan uangmu — semuanya dari satu tempat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans text-ink antialiased">
        {/* AppShell: hydrate store localStorage + sidebar + modal transaksi global */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
