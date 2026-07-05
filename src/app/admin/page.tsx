import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminPage() {
  if (!(await requireAdmin())) {
    redirect("/admin/login");
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden safe-bottom-lg">
      <FilmGrain />
      <TopBar />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgb(229_9_20_/_0.2),transparent_24rem),radial-gradient(circle_at_100%_28%,rgb(233_188_182_/_0.08),transparent_20rem)]"
      />
      <AdminDashboard />
    </main>
  );
}
