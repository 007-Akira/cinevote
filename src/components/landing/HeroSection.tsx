import { CinematicButton } from "@/components/ui/CinematicButton";
import { PosterStack } from "./PosterStack";
import { ScreeningInfoCard } from "./ScreeningInfoCard";

export function HeroSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-9 px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:pb-16 lg:pt-14">
      <div className="space-y-7">
        <div className="space-y-4">
          <p className="font-anton text-3xl leading-none text-cine-text-primary">
            CINE<span className="text-cine-red">VOTE</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
              College Movie Screening
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase text-cine-text-muted">
              Coming Soon
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="max-w-2xl font-anton text-6xl leading-[0.88] text-cine-text-primary sm:text-7xl lg:text-8xl">
            Movie Screening Night
          </h1>
          <p className="max-w-lg text-xl font-semibold leading-8 text-cine-text-secondary sm:text-2xl">
            Choose the movie. Own the night.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <CinematicButton href="/movies" className="w-full sm:w-auto">
            Vote Now
          </CinematicButton>
          <CinematicButton
            href="/movies"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Explore Movies
          </CinematicButton>
        </div>

        <div className="max-w-xl">
          <ScreeningInfoCard />
        </div>
      </div>

      <PosterStack />
    </section>
  );
}
