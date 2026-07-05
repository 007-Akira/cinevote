"use client";

import { useEffect, useState } from "react";

type PollStatus =
  | "not_started"
  | "active"
  | "closed"
  | "schedule_missing";

type WinningMovie = {
  id: string;
  title: string;
  posterUrl: string;
  genre: string;
  language: string;
  runtime: string;
  voteCount: number;
};

type ScreeningInfo = {
  pollStatus: PollStatus;
  eventDate: string | null;
  venue: string | null;
  winningMovie: WinningMovie | null;
};

export function ScreeningInfoCard() {
  const [screeningInfo, setScreeningInfo] = useState<ScreeningInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadScreeningInfo() {
      try {
        const response = await fetch("/api/poll/screening-info", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ScreeningInfo;

        if (isMounted) {
          setScreeningInfo(payload);
        }
      } catch {
        if (isMounted) {
          setScreeningInfo(null);
        }
      }
    }

    void loadScreeningInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!screeningInfo || screeningInfo.pollStatus !== "closed") {
    return <CompactScreeningInfoCard />;
  }

  if (!screeningInfo.winningMovie) {
    return (
      <ResultFallbackCard
        badge="No Result"
        text="No votes were recorded. Screening details will be announced by organizers."
      />
    );
  }

  if (!screeningInfo.eventDate || !screeningInfo.venue) {
    return (
      <ResultFallbackCard
        badge="Result Locked"
        movie={screeningInfo.winningMovie}
        text="Screening details will be announced soon."
      />
    );
  }

  return <AnnouncedScreeningCard screeningInfo={screeningInfo} />;
}

function CompactScreeningInfoCard() {
  return (
    <article className="relative overflow-hidden rounded-lg border border-white/10 bg-cine-card/65 p-4 shadow-glass backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase text-cine-text-muted">
          Screening Info
        </p>
        <span className="rounded-full border border-cine-red/35 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
          Not Announced
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-cine-text-secondary sm:text-base">
        Screening date not announced yet. Final movie and venue will be revealed
        after voting closes.
      </p>
    </article>
  );
}

function AnnouncedScreeningCard({
  screeningInfo,
}: {
  screeningInfo: ScreeningInfo;
}) {
  const formattedDate = getDateParts(screeningInfo.eventDate);
  const movie = screeningInfo.winningMovie;

  if (!movie || !formattedDate || !screeningInfo.venue) {
    return null;
  }

  return (
    <article className="group relative overflow-hidden rounded-lg border border-cine-red/25 bg-cine-card/75 p-4 pl-6 shadow-[0_0_15px_rgb(229_9_20_/_0.15),inset_0_0_20px_rgb(229_9_20_/_0.05)] backdrop-blur-xl transition hover:border-cine-red/45 sm:p-6 sm:pl-9">
      <HudAccents />

      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[5.75rem_1fr]">
        <div
          className="aspect-[2/3] w-24 rounded-md border border-white/10 bg-cine-card bg-cover bg-center shadow-xl shadow-black/50 sm:w-full"
          style={{
            backgroundImage: `linear-gradient(180deg, transparent 34%, rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`,
          }}
          aria-label={`${movie.title} poster`}
        />

        <div className="min-w-0">
          <header className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-cine-text-muted">
                Screening Info
              </p>
              <h2 className="mt-2 font-anton text-3xl uppercase leading-none text-cine-text-primary">
                {movie.title}
              </h2>
              <p className="mt-2 text-xs font-semibold uppercase text-cine-text-muted">
                {movie.genre} | {movie.language} | {movie.runtime}
              </p>
            </div>
            <StatusBadge label="Announced" />
          </header>

          <p className="text-base font-light leading-7 text-cine-text-secondary sm:text-lg">
            Screening scheduled for{" "}
            <strong className="font-semibold text-cine-text-primary">
              {formattedDate.fullDate}
            </strong>{" "}
            at{" "}
            <strong className="font-semibold text-cine-text-primary">
              {formattedDate.time}
            </strong>
            .
          </p>
        </div>
      </div>

      <MetadataFooter
        date={formattedDate.shortDate}
        time={formattedDate.time}
        venue={screeningInfo.venue}
      />
    </article>
  );
}

function ResultFallbackCard({
  badge,
  text,
  movie = null,
}: {
  badge: "Result Locked" | "No Result";
  text: string;
  movie?: WinningMovie | null;
}) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-cine-red/25 bg-cine-card/75 p-4 pl-6 shadow-[0_0_15px_rgb(229_9_20_/_0.15),inset_0_0_20px_rgb(229_9_20_/_0.05)] backdrop-blur-xl sm:p-6 sm:pl-9">
      <HudAccents />
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-cine-text-muted">
            Screening Info
          </p>
          {movie ? (
            <h2 className="mt-2 font-anton text-3xl uppercase leading-none text-cine-text-primary">
              {movie.title}
            </h2>
          ) : null}
        </div>
        <StatusBadge label={badge} />
      </header>

      <div className={movie ? "mt-4 grid gap-4 sm:grid-cols-[5rem_1fr]" : "mt-4"}>
        {movie ? (
          <div
            className="aspect-[2/3] w-24 rounded-md border border-white/10 bg-cine-card bg-cover bg-center shadow-xl shadow-black/50 sm:w-full"
            style={{
              backgroundImage: `linear-gradient(180deg, transparent 34%, rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`,
            }}
            aria-label={`${movie.title} poster`}
          />
        ) : null}
        <p className="self-center text-base leading-7 text-cine-text-secondary">
          {text}
        </p>
      </div>
    </article>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full border border-cine-red/30 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cine-red shadow-[0_0_8px_rgb(229_9_20_/_0.3)]">
      {label}
    </span>
  );
}

function HudAccents() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cine-red to-transparent opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 rounded-l bg-cine-red shadow-[0_0_10px_rgb(229_9_20_/_0.8)]"
      />
    </>
  );
}

function MetadataFooter({
  date,
  time,
  venue,
}: {
  date: string;
  time: string;
  venue: string;
}) {
  return (
    <footer className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-cine-text-muted sm:flex-row sm:items-center sm:gap-5">
      <span className="transition group-hover:text-cine-text-secondary">
        Date: {date}
      </span>
      <span className="transition group-hover:text-cine-text-secondary">
        Time: {time}
      </span>
      <span className="text-cine-text-secondary transition sm:ml-auto">
        Venue: {venue}
      </span>
    </footer>
  );
}

function getDateParts(value: string | null) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    fullDate: new Intl.DateTimeFormat("en-IN", {
      dateStyle: "full",
    }).format(date),
    shortDate: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      timeStyle: "short",
    }).format(date),
  };
}
