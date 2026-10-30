"use client";

/**
 * Route Dashboard — delegasi ke komponen `DashboardPage`
 * (src/components/dashboard/DashboardPage.tsx) bergaya "Fresh Earthy Minimalism".
 * Logic keuangan tetap utuh di store/selectors; file ini hanya titik masuk Next.js App Router.
 */
import DashboardPage from "@/components/dashboard/DashboardPage";

export default function Page() {
  return <DashboardPage />;
}
