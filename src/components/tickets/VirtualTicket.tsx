import { QRCodeSVG } from "qrcode.react";

export type TicketMovie = {
  id: string;
  title: string;
  posterUrl: string;
  genre: string;
  language: string;
  runtime: string;
  voteCount?: number;
};

export type GeneratedTicket = {
  ticketCode: string;
  qrPayload: string;
  studentName: string;
  year: string;
  department: string;
  movie: TicketMovie | null;
  eventDate: string | null;
  venue: string | null;
  createdAt: string;
};

type VirtualTicketProps = {
  ticket: GeneratedTicket;
};

export function VirtualTicket({ ticket }: VirtualTicketProps) {
  const movie = ticket.movie;

  return (
    <article className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-cine-red/35 bg-cine-card/80 shadow-red-glow backdrop-blur-2xl">
      <div className="relative p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(229_9_20_/_0.18),transparent_13rem)]"
        />
        <div className="relative flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cine-red">
            CineVote Screening Pass
          </p>
          <span className="rounded-full border border-cine-red/35 bg-cine-red/10 px-3 py-1 text-xs font-bold uppercase text-cine-text-secondary">
            Admit One
          </span>
        </div>

        <div className="relative mt-5 flex gap-4">
          <div
            className="h-32 w-24 shrink-0 rounded-lg border border-white/10 bg-cover bg-center shadow-xl shadow-black/70"
            style={{
              backgroundImage: movie
                ? `linear-gradient(180deg, transparent 38%, rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`
                : "linear-gradient(180deg, rgb(229 9 20 / 0.22), rgb(0 0 0 / 0.8))",
            }}
            aria-label={movie ? `${movie.title} poster` : "Movie poster"}
          />
          <div className="min-w-0 py-1">
            <h2 className="font-anton text-5xl leading-none text-cine-text-primary">
              {movie?.title ?? "CineVote"}
            </h2>
            <p className="mt-2 text-xs font-semibold uppercase text-cine-text-muted">
              {movie
                ? `${movie.genre} | ${movie.language} | ${movie.runtime}`
                : "Screening Pass"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 bg-cine-black/35 px-5 py-5 sm:px-6">
        <TicketField label="Attendee" value={ticket.studentName} />
        <TicketField label="Status" value={`${ticket.year} | ${ticket.department}`} />
        <TicketField label="Date & Time" value={formatDate(ticket.eventDate)} />
        <TicketField label="Venue" value={ticket.venue ?? "Venue pending"} />
      </div>

      <div className="relative flex h-8 items-center bg-cine-card/80">
        <span className="absolute -left-3 h-6 w-6 rounded-full border border-cine-red/30 bg-background" />
        <span className="mx-3 w-full border-t-2 border-dashed border-white/15" />
        <span className="absolute -right-3 h-6 w-6 rounded-full border border-cine-red/30 bg-background" />
      </div>

      <div className="relative flex flex-col items-center px-5 pb-7 pt-3 text-center sm:px-6">
        <div
          aria-hidden="true"
          className="absolute top-8 h-32 w-32 rounded-full bg-cine-red/20 blur-3xl"
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.26em] text-cine-text-muted">
          Ticket Code
        </p>
        <p className="relative mt-2 font-anton text-5xl leading-none text-cine-red drop-shadow-[0_0_18px_rgb(229_9_20_/_0.6)]">
          {ticket.ticketCode}
        </p>
        <div className="relative mt-5 rounded-lg border border-cine-red/25 bg-cine-black p-3 shadow-red-glow-sm">
          <QRCodeSVG
            value={ticket.qrPayload}
            size={128}
            bgColor="#000000"
            fgColor="#E50914"
            level="M"
          />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-cine-text-muted">
          Show this ticket at the venue
        </p>
      </div>

      <div className="h-1 bg-cine-red" />
    </article>
  );
}

function TicketField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase text-cine-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-cine-text-primary">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
