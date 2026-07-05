import { CinematicButton } from "@/components/ui/CinematicButton";

export function TicketsComingSoon() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center pb-8 text-center sm:pb-0">
      <div className="relative w-full max-w-2xl transition duration-500 sm:-rotate-1 sm:hover:rotate-0">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-cine-red/10 blur-3xl"
        />
        <div className="glass-card red-trace-border relative overflow-hidden rounded-xl px-5 py-14 shadow-red-glow-sm sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgb(255_255_255_/_0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.06)_1px,transparent_1px)] [background-size:10px_10px]"
          />
          <span
            aria-hidden="true"
            className="absolute left-12 top-0 h-36 w-px rotate-45 bg-cine-red/55 drop-shadow-[0_0_8px_rgb(229_9_20_/_0.8)]"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-5 right-16 h-28 w-0.5 -rotate-12 bg-cine-red/65 drop-shadow-[0_0_8px_rgb(229_9_20_/_0.8)]"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/3 top-8 h-px w-32 -rotate-6 bg-white/20"
          />

          <div className="relative">
            <h1 className="font-anton text-6xl leading-[0.9] tracking-wide text-cine-text-primary sm:text-8xl">
              <span className="relative inline-block">
                TICKETS
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-1 w-full -rotate-1 bg-cine-black/80"
                />
              </span>
              <span className="mt-3 block text-cine-red drop-shadow-[0_0_20px_rgb(229_9_20_/_0.65)]">
                COMING SOON
              </span>
            </h1>
          </div>
        </div>
      </div>

      <p className="mt-10 max-w-xl text-sm leading-7 text-cine-text-secondary sm:mt-8 sm:text-base sm:leading-6">
        Ticket booking will open after the poll result is finalized by the
        organizers. Your screening pass will be available here.
      </p>

      <CinematicButton
        className="mt-8 min-h-12 cursor-not-allowed border-white/10 bg-white/[0.06] text-cine-text-muted shadow-none sm:mt-6"
        disabled
        variant="ghost"
      >
        BOOKING NOT LIVE YET
      </CinematicButton>
    </section>
  );
}
