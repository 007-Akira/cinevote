import { CinematicMarquee } from "@/components/landing/CinematicMarquee";
import { HeroSection } from "@/components/landing/HeroSection";
import { FilmGrain } from "@/components/layout/FilmGrain";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden safe-bottom-lg">
      <FilmGrain />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgb(229_9_20_/_0.24),transparent_28rem),radial-gradient(circle_at_90%_35%,rgb(233_188_182_/_0.08),transparent_18rem)]"
      />

      <HeroSection />

      <CinematicMarquee
        items={["CHOOSE THE MOVIE", "OWN THE NIGHT", "VOTE NOW"]}
      />

      <footer className="mx-auto w-full max-w-6xl px-4 py-7 text-center text-sm font-medium text-cine-text-muted sm:px-6">
        Built for students. Decided by students.
      </footer>
    </main>
  );
}
