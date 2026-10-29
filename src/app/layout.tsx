import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Mahes — Tracker Keuangan Pribadi",
  description:
    "Pantau pemasukan dan pengeluaran Anda dengan dashboard local-first yang modern.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-[#F6F6F6] text-[#151516]`}>
        {/* AppShell: hydrate store localStorage + sidebar + modal transaksi global */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
