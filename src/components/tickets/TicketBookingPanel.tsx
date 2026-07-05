"use client";

import { useEffect, useState } from "react";
import { CinematicButton } from "@/components/ui/CinematicButton";
import { getStoredProfile, saveProfile } from "@/lib/storage";
import type { Department, UserProfile, YearOfStudy } from "@/types";
import { TicketsComingSoon } from "./TicketsComingSoon";
import {
  type GeneratedTicket,
  type TicketMovie,
  VirtualTicket,
} from "./VirtualTicket";

type TicketStatusPayload = {
  isLive: boolean;
  reason: string;
  totalTickets: number;
  bookedTickets: number;
  remainingTickets: number;
  bookingStartsAt: string | null;
  bookingClosesAt: string | null;
  eventDate: string | null;
  venue: string | null;
  winningMovie: TicketMovie | null;
  existingTicket: GeneratedTicket | null;
};

const departments: Department[] = [
  "CSE",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "AI/DS",
  "MCA",
  "Other",
];

const years: YearOfStudy[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export function TicketBookingPanel() {
  const [ticketStatus, setTicketStatus] = useState<TicketStatusPayload | null>(
    null,
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>("1st Year");
  const [department, setDepartment] = useState<Department>("CSE");
  const [ticket, setTicket] = useState<GeneratedTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTicketStatus() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tickets/status", { cache: "no-store" });
      const payload = (await response.json()) as
        | TicketStatusPayload
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload ? payload.error : "Could not load ticket status.",
        );
      }

      const nextStatus = payload as TicketStatusPayload;
      setTicketStatus(nextStatus);
      setTicket(nextStatus.existingTicket);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not load ticket status.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      const storedProfile = getStoredProfile();

      if (storedProfile) {
        setProfile(storedProfile);
        setName(storedProfile.name);
        setYearOfStudy(storedProfile.yearOfStudy);
        setDepartment(storedProfile.department);
      }

      void loadTicketStatus();
    });
  }, []);

  async function handleGenerateTicket() {
    const activeProfile =
      profile ??
      ({
        name: name.trim(),
        yearOfStudy,
        department,
      } satisfies UserProfile);

    if (!activeProfile.name.trim()) {
      setError("Name is required to generate a ticket.");
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const response = await fetch("/api/tickets/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            name: activeProfile.name,
            year: activeProfile.yearOfStudy,
            department: activeProfile.department,
          },
        }),
      });
      const payload = (await response.json()) as
        | { ticket: GeneratedTicket }
        | { error?: string };

      if (!response.ok || !("ticket" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "Could not generate ticket.",
        );
      }

      if (!profile) {
        saveProfile(activeProfile);
        setProfile(activeProfile);
      }

      setTicket(payload.ticket);
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : "Could not generate ticket.",
      );
    } finally {
      setIsBooking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card red-trace-border rounded-xl p-5 text-sm font-semibold text-cine-text-secondary">
        Loading ticket status...
      </div>
    );
  }

  if (ticket) {
    return <VirtualTicket ticket={ticket} />;
  }

  if (!ticketStatus?.isLive || !ticketStatus.winningMovie) {
    return <TicketsComingSoon />;
  }

  const activeProfile = profile;
  const trimmedName = name.trim();
  const remainingPercent = Math.max(
    0,
    Math.min(
      100,
      ticketStatus.totalTickets
        ? (ticketStatus.remainingTickets / ticketStatus.totalTickets) * 100
        : 0,
    ),
  );

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
      <article className="glass-card red-trace-border overflow-hidden rounded-xl">
        <div className="grid md:grid-cols-[15rem_1fr]">
          <div
            className="min-h-80 bg-cover bg-center md:min-h-full"
            style={{
              backgroundImage: `linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.82)), url(${ticketStatus.winningMovie.posterUrl})`,
            }}
            aria-label={`${ticketStatus.winningMovie.title} poster`}
          />
          <div className="p-5 sm:p-6">
            <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
              Screening pass
            </p>
            <h1 className="mt-4 font-anton text-6xl leading-none text-cine-text-primary sm:text-7xl">
              {ticketStatus.winningMovie.title}
            </h1>

            <dl className="mt-6 grid gap-3 text-sm text-cine-text-primary">
              <InfoRow label="Date & Time" value={formatDate(ticketStatus.eventDate)} />
              <InfoRow label="Venue" value={ticketStatus.venue ?? "Venue pending"} />
              <InfoRow
                label="Runtime"
                value={`${ticketStatus.winningMovie.runtime} | ${ticketStatus.winningMovie.language}`}
              />
            </dl>
          </div>
        </div>
      </article>

      <div className="space-y-5">
        <section className="glass-card red-trace-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-cine-text-muted">
                Tickets remaining
              </p>
              <p className="mt-1 font-anton text-5xl leading-none text-cine-red">
                {ticketStatus.remainingTickets}
                <span className="ml-2 text-2xl text-cine-text-muted">
                  / {ticketStatus.totalTickets}
                </span>
              </p>
            </div>
            <p className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold uppercase text-cine-text-secondary">
              {ticketStatus.bookedTickets} booked
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cine-red shadow-red-glow-sm"
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        </section>

        <form
          className="glass-card red-trace-border rounded-xl p-5 sm:p-6"
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            void handleGenerateTicket();
          }}
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-cine-text-muted">
              Student details
            </p>
            {activeProfile ? (
              <p className="text-sm leading-6 text-cine-text-secondary">
                Generating ticket for{" "}
                <span className="font-semibold text-cine-text-primary">
                  {activeProfile.name}
                </span>
                , {activeProfile.yearOfStudy}, {activeProfile.department}.
              </p>
            ) : (
              <p className="text-sm leading-6 text-cine-text-secondary">
                No saved voting profile was found on this browser. Add details
                once to generate the pass.
              </p>
            )}
          </div>

          {!activeProfile ? (
            <div className="mt-5 grid gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-cine-text-primary">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                  className="min-h-12 w-full rounded-lg border border-white/10 bg-cine-black/70 px-4 text-base text-cine-text-primary outline-none transition placeholder:text-cine-text-muted focus:border-cine-red focus:shadow-red-glow-sm"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-cine-text-primary">
                    Year
                  </span>
                  <select
                    value={yearOfStudy}
                    onChange={(event) =>
                      setYearOfStudy(event.target.value as YearOfStudy)
                    }
                    className="min-h-12 w-full rounded-lg border border-white/10 bg-cine-black/70 px-4 text-base text-cine-text-primary outline-none transition focus:border-cine-red focus:shadow-red-glow-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-cine-text-primary">
                    Department
                  </span>
                  <select
                    value={department}
                    onChange={(event) =>
                      setDepartment(event.target.value as Department)
                    }
                    className="min-h-12 w-full rounded-lg border border-white/10 bg-cine-black/70 px-4 text-base text-cine-text-primary outline-none transition focus:border-cine-red focus:shadow-red-glow-sm"
                  >
                    {departments.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-cine-red/50 bg-cine-red/10 px-3 py-2 text-sm font-semibold text-cine-text-secondary">
              {error}
            </p>
          ) : null}

          <CinematicButton
            className="mt-6 w-full"
            type="submit"
            disabled={isBooking || (!activeProfile && !trimmedName)}
          >
            {isBooking ? "Generating..." : "Generate Ticket"}
          </CinematicButton>
        </form>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
      <dt className="text-cine-text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
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
