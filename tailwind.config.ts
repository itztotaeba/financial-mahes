import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /** Tipografi global — Plus Jakarta Sans (self-host, lihat globals.css). */
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "var(--font-jakarta)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      /** Palet warna resmi Financial Mahes. */
      colors: {
        ink: "#151516", // teks utama
        canvas: "#F6F6F6", // background
        income: "#4FB279", // aksen hijau (pemasukan)
        expense: "#D3534C", // aksen merah (pengeluaran)
        primary: "#2141E0", // primary blue
        lilac: "#C8ACC0", // aksen lembut
      },
      boxShadow: {
        glass: "0 8px 32px rgba(21, 21, 22, 0.08)",
        "glass-lg": "0 16px 48px rgba(21, 21, 22, 0.12)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Mesh gradient lembut untuk halaman bergaya liquid glass.
        "glass-mesh":
          "radial-gradient(60rem 40rem at 10% -10%, rgba(33,65,224,0.10), transparent 60%), radial-gradient(50rem 35rem at 110% 10%, rgba(200,172,192,0.22), transparent 55%), radial-gradient(45rem 35rem at 50% 115%, rgba(79,178,121,0.10), transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
