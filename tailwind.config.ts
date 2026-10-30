import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /** Tipografi dua-font (refactor):
       *  - font-ui   → Manrope (heading, UI umum, tombol, navigasi) = default global
       *  - font-data → Inter   (tabel, currency, persentase, data mentah;
       *                tabular-nums otomatis via utilitas .font-data di globals.css) */
      fontFamily: {
        sans: ["var(--font-ui)"], // fallback agar class `font-sans` tetap konsisten
        ui: ["var(--font-ui)"],
        data: ["var(--font-data)"],
      },
      /**
       * Palet warna resmi Financial Mahes — "Fresh Earthy Minimalism".
       * Green olive sebagai primary/success (pemasukan), terracotta sebagai
       * danger (pengeluaran), kuning earthy sebagai aksen warning/kategori.
       * Nama token (income/expense/primary/lilac) DIPERTAHANKAN agar seluruh
       * logic & class yang sudah ada tidak perlu diubah — hanya nilainya di-override.
       */
      colors: {
        ink: "#162701", // teks utama (sangat gelap, bukan hitam pekat)
        canvas: "#F7F7F5", // background off-white lembut
        card: "#FAFAF9", // background kartu sekunder
        line: "#E5E5E0", // border sangat halus
        income: "#647637", // primary / success (pemasukan)
        muted: "#74864B", // secondary / muted green
        accent: "#C6B54F", // aksen 1 (warning / kategori)
        expense: "#BB622E", // aksen 2 (danger / pengeluaran)
        primary: "#647637", // override primary → olive (bukan biru lagi)
        lilac: "#C8ACC0", // aksen lembut (dipertahankan untuk compat)
        soft: "#B4B2A0", // teks sekunder / sumbu chart
      },
      boxShadow: {
        glass: "0 8px 30px rgb(0 0 0 / 0.04)",
        "glass-lg": "0 16px 40px rgb(0 0 0 / 0.06)",
        soft: "0 8px 30px rgb(0 0 0 / 0.04)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Sapuan earthy sangat tipis (fallback class lama .bg-glass-mesh).
        "glass-mesh":
          "radial-gradient(60rem 40rem at 10% -10%, rgba(116,134,75,0.06), transparent 60%), radial-gradient(50rem 35rem at 110% 10%, rgba(198,181,79,0.07), transparent 55%), radial-gradient(45rem 35rem at 50% 115%, rgba(100,118,55,0.05), transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
