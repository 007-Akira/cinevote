import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";
import { TicketBookingPanel } from "@/components/tickets/TicketBookingPanel";

export default function TicketsPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden safe-bottom-lg">
      <FilmGrain />
      <TopBar />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgb(229_9_20_/_0.2),transparent_24rem),radial-gradient(circle_at_92%_28%,rgb(233_188_182_/_0.08),transparent_20rem)]"
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-8 space-y-3">
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            Screening pass
          </p>
          <div>
            <h1 className="font-anton text-5xl leading-none text-cine-text-primary sm:text-7xl">
              Tickets
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cine-text-secondary sm:text-base">
              Generate your CineVote pass when booking opens for the winning
              screening.
            </p>
          </div>
        </div>

        <TicketBookingPanel />
      </section>
    </main>
  );
}
