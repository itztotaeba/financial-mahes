import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

// Tipografi global: Plus Jakarta Sans (sesuai arahan desain).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

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
      <body className={`${jakarta.variable} font-sans text-ink antialiased`}>
        {/* AppShell: hydrate store localStorage + sidebar + modal transaksi global */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
