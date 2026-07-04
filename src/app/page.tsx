import { CinematicMarquee } from "@/components/landing/CinematicMarquee";
import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";
import { CinematicButton } from "@/components/ui/CinematicButton";
import { GlassCard } from "@/components/ui/GlassCard";

const stats = [
  { label: "Shortlisted films", value: "08" },
  { label: "Departments", value: "08" },
  { label: "Live window", value: "24h" },
];

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden safe-bottom-lg">
      <FilmGrain />
      <TopBar />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
              CineVote design system
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-anton text-6xl leading-[0.9] text-cine-text-primary sm:text-7xl lg:text-8xl">
                Vote for the next big screen night.
              </h1>
              <p className="max-w-xl text-base leading-7 text-cine-text-secondary sm:text-lg">
                A mobile-first cinematic interface foundation with glass panels,
                red trace borders, Anton headlines, and Geist body text.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CinematicButton href="/movies">Browse movies</CinematicButton>
              <CinematicButton href="/admin" variant="secondary">
                View dashboard
              </CinematicButton>
            </div>
          </div>

          <GlassCard className="space-y-5">
            <div>
              <p className="text-sm font-medium text-cine-text-muted">
                Active poll
              </p>
              <h2 className="mt-2 font-anton text-4xl text-cine-text-primary">
                Campus Screening
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md border border-white/10 bg-cine-elevated/80 p-3"
                >
                  <p className="font-anton text-3xl text-cine-red">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-cine-text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-cine-red red-glow-sm" />
            </div>
          </GlassCard>
        </div>
      </section>

      <CinematicMarquee />
    </main>
  );
}
