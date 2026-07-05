import { CinematicMarquee } from "@/components/landing/CinematicMarquee";
import { HeroSection } from "@/components/landing/HeroSection";
import { PollCountdown } from "@/components/landing/PollCountdown";
import { CineVoteIntro } from "@/components/intro/CineVoteIntro";
import { FilmGrain } from "@/components/layout/FilmGrain";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden safe-bottom-lg">
      <CineVoteIntro />
      <FilmGrain />
      <a
        href="/admin"
        aria-label="Open admin dashboard"
        title="Admin"
        className="fixed right-4 top-4 z-[80] grid size-11 place-items-center rounded-full border border-cine-red/45 bg-cine-black/75 text-cine-text-primary shadow-red-glow-sm backdrop-blur-xl transition hover:border-cine-red hover:bg-cine-red/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-red"
      >
        <span className="text-lg font-bold leading-none">A</span>
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgb(229_9_20_/_0.24),transparent_28rem),radial-gradient(circle_at_90%_35%,rgb(233_188_182_/_0.08),transparent_18rem)]"
      />

      <HeroSection />

      <CinematicMarquee
        items={["CHOOSE THE MOVIE", "OWN THE NIGHT", "VOTE NOW"]}
      />

      <PollCountdown />

      <footer className="mx-auto w-full max-w-6xl px-4 py-7 text-center text-sm font-medium text-cine-text-muted sm:px-6">
        Built for students. Decided by students.
      </footer>
    </main>
  );
}
