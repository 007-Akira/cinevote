"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CinematicButton } from "@/components/ui/CinematicButton";
import { GlassCard } from "@/components/ui/GlassCard";

type MovieVote = {
  movieId: string;
  title: string;
  posterUrl: string;
  voteCount: number;
  percentage: number;
};

type BreakdownRow = {
  voteCount: number;
  percentage: number;
};

type DepartmentVote = BreakdownRow & {
  department: string;
};

type YearVote = BreakdownRow & {
  year: string;
};

type PollStatus = {
  isOpen: boolean;
  eventStatus: string;
  pollStartsAt: string | null;
  pollClosesAt: string | null;
  eventDate: string | null;
  venue: string | null;
};

type PollSchedulePayload = {
  poll_starts_at: string | null;
  poll_closes_at: string | null;
  event_date: string | null;
  venue: string | null;
};

type TicketSettingsPayload = {
  total_tickets: number;
  booking_starts_at: string | null;
  booking_closes_at: string | null;
};

type AdminConfirmAction =
  | "export"
  | "export-tickets"
  | "close-poll"
  | "reopen-poll"
  | "enable-ticketing"
  | "disable-ticketing"
  | "logout"
  | "save-schedule";

type AdminStatsPayload = {
  totalVotes: number;
  leadingMovie: MovieVote | null;
  movieWiseVotes: MovieVote[];
  departmentWiseVotes: DepartmentVote[];
  yearWiseVotes: YearVote[];
  pollStatus: PollStatus;
};

type TicketAdminPayload = {
  isLive: boolean;
  totalTickets: number;
  bookedTickets: number;
  remainingTickets: number;
  bookingStartsAt: string | null;
  bookingClosesAt: string | null;
  winningMovie: {
    id: string;
    title: string;
    posterUrl: string;
    genre: string;
    language: string;
    runtime: string;
    voteCount: number;
  } | null;
  eventDate: string | null;
  venue: string | null;
  canGoLive: boolean;
  blockingReason: string | null;
};

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStatsPayload | null>(null);
  const [ticketStatus, setTicketStatus] = useState<TicketAdminPayload | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPoll, setIsUpdatingPoll] = useState(false);
  const [isUpdatingTickets, setIsUpdatingTickets] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingAction, setPendingAction] = useState<AdminConfirmAction | null>(
    null,
  );

  async function loadStats() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      const payload = (await response.json()) as
        | AdminStatsPayload
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload ? payload.error : "Could not load admin stats.",
        );
      }

      setStats(payload as AdminStatsPayload);
      await loadTicketStatus();
    } catch (statsError) {
      setError(
        statsError instanceof Error
          ? statsError.message
          : "Could not load admin stats.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTicketStatus() {
    const response = await fetch("/api/admin/tickets", { cache: "no-store" });
    const payload = (await response.json()) as
      | TicketAdminPayload
      | { error?: string };

    if (!response.ok) {
      throw new Error(
        "error" in payload ? payload.error : "Could not load ticket settings.",
      );
    }

    setTicketStatus(payload as TicketAdminPayload);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadStats();
    });
  }, []);

  async function handlePollToggle() {
    if (!stats) {
      return;
    }

    setIsUpdatingPoll(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/poll", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_open: !stats.pollStatus.isOpen }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update poll.");
      }

      await loadStats();
    } catch (pollError) {
      setError(
        pollError instanceof Error ? pollError.message : "Could not update poll.",
      );
    } finally {
      setIsUpdatingPoll(false);
    }
  }

  async function handlePollScheduleSave(payload: PollSchedulePayload) {
    setIsUpdatingPoll(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/poll", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Could not save poll schedule.");
      }

      await loadStats();
    } catch (scheduleError) {
      throw scheduleError instanceof Error
        ? scheduleError
        : new Error("Could not save poll schedule.");
    } finally {
      setIsUpdatingPoll(false);
    }
  }

  async function handleTicketSettingsSave(payload: TicketSettingsPayload) {
    setIsUpdatingTickets(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as TicketAdminPayload | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in result ? result.error : "Could not save ticket settings.",
        );
      }

      setTicketStatus(result as TicketAdminPayload);
    } catch (ticketError) {
      throw ticketError instanceof Error
        ? ticketError
        : new Error("Could not save ticket settings.");
    } finally {
      setIsUpdatingTickets(false);
    }
  }

  async function handleTicketLiveToggle(nextIsLive: boolean) {
    setIsUpdatingTickets(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_live: nextIsLive }),
      });
      const payload = (await response.json()) as TicketAdminPayload | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload ? payload.error : "Could not update ticketing.",
        );
      }

      setTicketStatus(payload as TicketAdminPayload);
    } catch (ticketError) {
      setError(
        ticketError instanceof Error
          ? ticketError.message
          : "Could not update ticketing.",
      );
    } finally {
      setIsUpdatingTickets(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not log out.");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Could not log out.",
      );
      setIsLoggingOut(false);
    }
  }

  async function handleConfirmAction() {
    const action = pendingAction;
    setPendingAction(null);

    if (action === "export") {
      window.location.href = "/api/admin/export";
      return;
    }

    if (action === "export-tickets") {
      window.location.href = "/api/admin/tickets/export";
      return;
    }

    if (action === "close-poll" || action === "reopen-poll") {
      await handlePollToggle();
      return;
    }

    if (action === "enable-ticketing" || action === "disable-ticketing") {
      await handleTicketLiveToggle(action === "enable-ticketing");
      return;
    }

    if (action === "logout") {
      await handleLogout();
    }
  }

  const pollLabel = stats?.pollStatus.isOpen ? "Open" : "Closed";

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            Control room
          </p>
          <h1 className="mt-3 font-anton text-5xl leading-none text-cine-text-primary sm:text-7xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cine-text-secondary sm:text-base">
            Track the screening race, manage poll access, and export the final
            ballot record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CinematicButton
            variant="secondary"
            onClick={() => setPendingAction("export")}
          >
            Export CSV
          </CinematicButton>
          <CinematicButton
            variant="ghost"
            onClick={() => setPendingAction("logout")}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </CinematicButton>
        </div>
      </div>

      {isLoading && !stats ? (
        <GlassCard className="mt-6">
          <p className="text-sm font-semibold text-cine-text-secondary">
            Loading voting statistics...
          </p>
        </GlassCard>
      ) : null}

      {error ? (
        <GlassCard className="mt-6 border-cine-red/60 bg-cine-red/10">
          <p className="text-sm font-semibold text-cine-text-primary">{error}</p>
          <CinematicButton className="mt-4" variant="secondary" onClick={loadStats}>
            Retry
          </CinematicButton>
        </GlassCard>
      ) : null}

      {stats ? (
        <div className="mt-6 space-y-4 sm:space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <AdminStats
              totalVotes={stats.totalVotes}
              leadingMovie={stats.leadingMovie}
            />
            <PollControl
              pollStatus={stats.pollStatus}
              pollLabel={pollLabel ?? "Unknown"}
              onToggle={() =>
                setPendingAction(
                  stats.pollStatus.isOpen ? "close-poll" : "reopen-poll",
                )
              }
              onSaveSchedule={handlePollScheduleSave}
              isUpdating={isUpdatingPoll || isLoading}
            />
          </div>

          {ticketStatus ? (
            <TicketControl
              ticketStatus={ticketStatus}
              isUpdating={isUpdatingTickets || isLoading}
              onSaveSettings={handleTicketSettingsSave}
              onExportTickets={() => setPendingAction("export-tickets")}
              onToggleLive={() =>
                setPendingAction(
                  ticketStatus.isLive ? "disable-ticketing" : "enable-ticketing",
                )
              }
            />
          ) : null}

          {stats.totalVotes === 0 ? <EmptyVotes /> : null}

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <TopContenders movies={stats.movieWiseVotes} />
            <div className="grid gap-4">
              <DepartmentTurnout rows={stats.departmentWiseVotes} />
              <YearTurnout rows={stats.yearWiseVotes} />
            </div>
          </div>
        </div>
      ) : null}
      </section>
      <AdminConfirmModal
        action={pendingAction}
        isWorking={isUpdatingPoll || isUpdatingTickets || isLoggingOut}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}

function AdminStats({
  totalVotes,
  leadingMovie,
}: {
  totalVotes: number;
  leadingMovie: MovieVote | null;
}) {
  return (
    <GlassCard className="grid gap-4 sm:grid-cols-[0.72fr_1fr]">
      <div>
        <p className="text-xs font-bold uppercase text-cine-text-muted">
          Total votes
        </p>
        <p className="mt-2 font-anton text-6xl leading-none text-cine-text-primary">
          {totalVotes}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-cine-text-muted">
          Leading movie
        </p>
        {leadingMovie ? (
          <div className="mt-3 flex gap-3">
            <div
              className="h-24 w-16 shrink-0 rounded-md border border-white/10 bg-cine-elevated bg-cover bg-center shadow-lg shadow-black/40"
              style={{ backgroundImage: `url(${leadingMovie.posterUrl})` }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate font-anton text-3xl leading-none text-cine-text-primary">
                {leadingMovie.title}
              </p>
              <p className="mt-2 text-sm font-semibold text-cine-text-secondary">
                {leadingMovie.voteCount} votes | {leadingMovie.percentage}%
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-cine-text-secondary">
            No active movies are available.
          </p>
        )}
      </div>
    </GlassCard>
  );
}

function AdminConfirmModal({
  action,
  isWorking,
  onCancel,
  onConfirm,
}: {
  action: AdminConfirmAction | null;
  isWorking: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  if (!action) {
    return null;
  }

  const copy = getConfirmCopy(action);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end bg-cine-black/78 px-3 pb-3 backdrop-blur-sm sm:items-center sm:px-5 sm:pb-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      onClick={onCancel}
    >
      <section
        className="glass-card red-trace-border mx-auto w-full max-w-lg space-y-5 rounded-t-2xl p-4 shadow-2xl shadow-black/80 safe-bottom sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            Admin check
          </p>
          <h2
            id="admin-confirm-title"
            className="font-anton text-4xl leading-none text-cine-text-primary"
          >
            {copy.title}
          </h2>
          <p className="text-sm leading-6 text-cine-text-secondary">
            {copy.description}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-cine-elevated/70 p-4">
          <p className="text-xs font-bold uppercase text-cine-text-muted">
            Action
          </p>
          <p className="mt-1 text-base font-semibold text-cine-text-primary">
            {copy.summary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CinematicButton
            className="w-full"
            disabled={isWorking}
            onClick={onConfirm}
          >
            {isWorking ? copy.workingLabel : copy.confirmLabel}
          </CinematicButton>
          <CinematicButton
            variant="secondary"
            className="w-full"
            disabled={isWorking}
            onClick={onCancel}
          >
            Cancel
          </CinematicButton>
        </div>
      </section>
    </div>
  );
}

function getConfirmCopy(action: AdminConfirmAction) {
  const copy: Record<
    AdminConfirmAction,
    {
      title: string;
      description: string;
      summary: string;
      confirmLabel: string;
      workingLabel: string;
    }
  > = {
    export: {
      title: "Export results?",
      description: "This will download the current vote records as a CSV file.",
      summary: "Download cinevote-results.csv",
      confirmLabel: "Export CSV",
      workingLabel: "Preparing...",
    },
    "export-tickets": {
      title: "Export tickets?",
      description: "This will download all generated ticket records as a CSV file.",
      summary: "Download cinevote-tickets.csv",
      confirmLabel: "Export Tickets",
      workingLabel: "Preparing...",
    },
    "close-poll": {
      title: "Close poll now?",
      description: "Students will no longer be able to submit votes.",
      summary: "Set poll status to closed",
      confirmLabel: "Close Poll",
      workingLabel: "Closing...",
    },
    "reopen-poll": {
      title: "Reopen poll?",
      description: "Students can vote again if the schedule window allows it.",
      summary: "Set poll status to open",
      confirmLabel: "Reopen Poll",
      workingLabel: "Reopening...",
    },
    "enable-ticketing": {
      title: "Make tickets live?",
      description: "Students will be able to generate screening passes.",
      summary: "Enable ticket booking",
      confirmLabel: "Make Live",
      workingLabel: "Enabling...",
    },
    "disable-ticketing": {
      title: "Disable ticket booking?",
      description: "Students will no longer be able to generate new tickets.",
      summary: "Disable ticket booking",
      confirmLabel: "Disable Booking",
      workingLabel: "Disabling...",
    },
    logout: {
      title: "Log out?",
      description: "You will need the admin password to return.",
      summary: "End this admin session",
      confirmLabel: "Logout",
      workingLabel: "Logging out...",
    },
    "save-schedule": {
      title: "Save schedule?",
      description: "This updates the voting window and screening date.",
      summary: "Apply poll schedule changes",
      confirmLabel: "Save Schedule",
      workingLabel: "Saving...",
    },
  };

  return copy[action];
}

function PollControl({
  pollStatus,
  pollLabel,
  onToggle,
  onSaveSchedule,
  isUpdating,
}: {
  pollStatus: PollStatus;
  pollLabel: string;
  onToggle: () => void;
  onSaveSchedule: (payload: PollSchedulePayload) => Promise<void>;
  isUpdating: boolean;
}) {
  const [startsAt, setStartsAt] = useState(() =>
    toDateTimeLocalValue(pollStatus.pollStartsAt),
  );
  const [closesAt, setClosesAt] = useState(() =>
    toDateTimeLocalValue(pollStatus.pollClosesAt),
  );
  const [eventDate, setEventDate] = useState(() =>
    toDateTimeLocalValue(pollStatus.eventDate),
  );
  const [venue, setVenue] = useState(() => pollStatus.venue ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingSchedulePayload, setPendingSchedulePayload] =
    useState<PollSchedulePayload | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setStartsAt(toDateTimeLocalValue(pollStatus.pollStartsAt));
      setClosesAt(toDateTimeLocalValue(pollStatus.pollClosesAt));
      setEventDate(toDateTimeLocalValue(pollStatus.eventDate));
      setVenue(pollStatus.venue ?? "");
      setFormError(null);
    });
  }, [pollStatus]);

  function handleSaveSchedule() {
    setFormError(null);
    setSuccessMessage(null);

    const startsAtIso = fromDateTimeLocalValue(startsAt);
    const closesAtIso = fromDateTimeLocalValue(closesAt);
    const eventDateIso = fromDateTimeLocalValue(eventDate);

    if (
      startsAtIso &&
      closesAtIso &&
      new Date(closesAtIso).getTime() <= new Date(startsAtIso).getTime()
    ) {
      setFormError("Poll closes at must be after poll starts at.");
      return;
    }

    setPendingSchedulePayload({
      poll_starts_at: startsAtIso,
      poll_closes_at: closesAtIso,
      event_date: eventDateIso,
      venue: venue.trim() || null,
    });
  }

  async function handleConfirmSaveSchedule() {
    if (!pendingSchedulePayload) {
      return;
    }

    const payload = pendingSchedulePayload;
    setPendingSchedulePayload(null);

    try {
      await onSaveSchedule(payload);
      setSuccessMessage("Poll schedule saved.");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save poll schedule.",
      );
    }
  }

  return (
    <>
    <GlassCard>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase text-cine-text-muted">
            Poll Schedule / Poll Control
          </p>
          <p className="mt-2 font-anton text-5xl leading-none text-cine-text-primary">
            {pollLabel}
          </p>
          <p className="mt-2 text-sm font-semibold text-cine-text-secondary">
            Event: {formatStatus(pollStatus.eventStatus)}
          </p>
          <p className="mt-1 text-xs text-cine-text-muted">
            Starts: {formatDate(pollStatus.pollStartsAt)}
          </p>
          <p className="mt-1 text-xs text-cine-text-muted">
            Closes: {formatDate(pollStatus.pollClosesAt)}
          </p>
          <p className="mt-1 text-xs text-cine-text-muted">
            Screening: {formatDate(pollStatus.eventDate)}
          </p>
          <p className="mt-1 text-xs text-cine-text-muted">
            Venue: {pollStatus.venue || "Not set"}
          </p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Poll Starts At
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Poll Closes At
            <input
              type="datetime-local"
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Event Date / Screening Date
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Venue
            <input
              type="text"
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Main Auditorium"
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition placeholder:text-cine-text-muted focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>
        </div>

        {formError ? (
          <p className="rounded-lg border border-cine-red/50 bg-cine-red/10 px-3 py-2 text-sm font-semibold text-cine-text-secondary">
            {formError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-cine-text-secondary">
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <CinematicButton onClick={handleSaveSchedule} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Schedule"}
          </CinematicButton>
          <CinematicButton
            variant={pollStatus.isOpen ? "secondary" : "primary"}
            onClick={onToggle}
            disabled={isUpdating}
          >
            {isUpdating
              ? "Updating..."
              : pollStatus.isOpen
                ? "Close Poll Now"
                : "Reopen Poll"}
          </CinematicButton>
        </div>
      </div>
    </GlassCard>
    <AdminConfirmModal
      action={pendingSchedulePayload ? "save-schedule" : null}
      isWorking={isUpdating}
      onCancel={() => setPendingSchedulePayload(null)}
      onConfirm={handleConfirmSaveSchedule}
    />
    </>
  );
}

function TicketControl({
  ticketStatus,
  isUpdating,
  onSaveSettings,
  onExportTickets,
  onToggleLive,
}: {
  ticketStatus: TicketAdminPayload;
  isUpdating: boolean;
  onSaveSettings: (payload: TicketSettingsPayload) => Promise<void>;
  onExportTickets: () => void;
  onToggleLive: () => void;
}) {
  const [totalTickets, setTotalTickets] = useState(() =>
    String(ticketStatus.totalTickets),
  );
  const [startsAt, setStartsAt] = useState(() =>
    toDateTimeLocalValue(ticketStatus.bookingStartsAt),
  );
  const [closesAt, setClosesAt] = useState(() =>
    toDateTimeLocalValue(ticketStatus.bookingClosesAt),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setTotalTickets(String(ticketStatus.totalTickets));
      setStartsAt(toDateTimeLocalValue(ticketStatus.bookingStartsAt));
      setClosesAt(toDateTimeLocalValue(ticketStatus.bookingClosesAt));
      setFormError(null);
    });
  }, [ticketStatus]);

  async function handleSave() {
    setFormError(null);
    setSuccessMessage(null);

    const nextTotalTickets = Number(totalTickets);
    const startsAtIso = fromDateTimeLocalValue(startsAt);
    const closesAtIso = fromDateTimeLocalValue(closesAt);

    if (!Number.isInteger(nextTotalTickets) || nextTotalTickets < 0) {
      setFormError("Total tickets must be a non-negative whole number.");
      return;
    }

    if (nextTotalTickets < ticketStatus.bookedTickets) {
      setFormError("Total tickets cannot be below booked ticket count.");
      return;
    }

    if (
      startsAtIso &&
      closesAtIso &&
      new Date(closesAtIso).getTime() <= new Date(startsAtIso).getTime()
    ) {
      setFormError("Booking closes at must be after booking starts at.");
      return;
    }

    try {
      await onSaveSettings({
        total_tickets: nextTotalTickets,
        booking_starts_at: startsAtIso,
        booking_closes_at: closesAtIso,
      });
      setSuccessMessage("Ticket settings saved.");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save ticket settings.",
      );
    }
  }

  const warnings = getTicketWarnings(ticketStatus, Number(totalTickets));

  return (
    <GlassCard>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <p className="text-xs font-bold uppercase text-cine-text-muted">
            Ticket Control
          </p>
          <p className="mt-2 font-anton text-5xl leading-none text-cine-text-primary">
            {ticketStatus.isLive ? "Live" : "Locked"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <TicketMetric label="Booked" value={ticketStatus.bookedTickets} />
            <TicketMetric
              label="Remaining"
              value={ticketStatus.remainingTickets}
            />
            <TicketMetric label="Capacity" value={ticketStatus.totalTickets} />
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-cine-black/35 p-4">
            <p className="text-xs font-bold uppercase text-cine-text-muted">
              Winning movie
            </p>
            {ticketStatus.winningMovie ? (
              <div className="mt-3 flex gap-3">
                <div
                  className="h-20 w-14 shrink-0 rounded-md border border-white/10 bg-cover bg-center shadow-lg shadow-black/50"
                  style={{
                    backgroundImage: `url(${ticketStatus.winningMovie.posterUrl})`,
                  }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate font-anton text-3xl leading-none text-cine-text-primary">
                    {ticketStatus.winningMovie.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase text-cine-text-muted">
                    {ticketStatus.winningMovie.voteCount} votes
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-cine-text-secondary">
                No winning movie yet.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-cine-text-muted">
            Screening: {formatDate(ticketStatus.eventDate)}
          </p>
          <p className="mt-1 text-xs text-cine-text-muted">
            Venue: {ticketStatus.venue || "Not set"}
          </p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Total Tickets
            <input
              type="number"
              min={ticketStatus.bookedTickets}
              value={totalTickets}
              onChange={(event) => setTotalTickets(event.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Booking Starts At
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cine-text-primary">
            Booking Closes At
            <input
              type="datetime-local"
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-cine-text-primary outline-none transition focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            />
          </label>

          {warnings.length ? (
            <div className="grid gap-2">
              {warnings.map((warning) => (
                <p
                  key={warning}
                  className="rounded-lg border border-cine-red/40 bg-cine-red/10 px-3 py-2 text-sm font-semibold text-cine-text-secondary"
                >
                  {warning}
                </p>
              ))}
            </div>
          ) : null}

          {formError ? (
            <p className="rounded-lg border border-cine-red/50 bg-cine-red/10 px-3 py-2 text-sm font-semibold text-cine-text-secondary">
              {formError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-cine-text-secondary">
              {successMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <CinematicButton onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Ticket Settings"}
            </CinematicButton>
            <CinematicButton
              variant={ticketStatus.isLive ? "secondary" : "primary"}
              onClick={onToggleLive}
              disabled={isUpdating || (!ticketStatus.isLive && warnings.length > 0)}
            >
              {ticketStatus.isLive ? "Disable Ticket Booking" : "Make Tickets Live"}
            </CinematicButton>
            <CinematicButton
              variant="ghost"
              onClick={onExportTickets}
              disabled={isUpdating}
            >
              Export Tickets CSV
            </CinematicButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function TicketMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-bold uppercase text-cine-text-muted">{label}</p>
      <p className="mt-1 font-anton text-3xl leading-none text-cine-text-primary">
        {value}
      </p>
    </div>
  );
}

function getTicketWarnings(
  ticketStatus: TicketAdminPayload,
  draftTotalTickets: number,
) {
  const warnings: string[] = [];

  if (ticketStatus.blockingReason === "poll_not_closed") {
    warnings.push("Poll is not closed yet.");
  }

  if (ticketStatus.blockingReason === "no_winning_movie") {
    warnings.push("No winning movie yet.");
  }

  if (!ticketStatus.eventDate) {
    warnings.push("Screening date missing.");
  }

  if (!ticketStatus.venue) {
    warnings.push("Venue missing.");
  }

  if (!Number.isFinite(draftTotalTickets) || draftTotalTickets <= 0) {
    warnings.push("Total tickets must be greater than 0.");
  }

  if (draftTotalTickets < ticketStatus.bookedTickets) {
    warnings.push("Total tickets cannot be below booked count.");
  }

  return [...new Set(warnings)];
}

function TopContenders({ movies }: { movies: MovieVote[] }) {
  return (
    <GlassCard>
      <h2 className="font-anton text-4xl leading-none text-cine-text-primary">
        Top Contenders
      </h2>
      <div className="mt-5 space-y-4">
        {movies.map((movie, index) => (
          <ProgressRow
            key={movie.movieId}
            label={`${index + 1}. ${movie.title}`}
            voteCount={movie.voteCount}
            percentage={movie.percentage}
          />
        ))}
      </div>
    </GlassCard>
  );
}

function DepartmentTurnout({ rows }: { rows: DepartmentVote[] }) {
  return (
    <BreakdownCard
      title="Department Participation"
      emptyLabel="No department data yet."
      rows={rows.map((row) => ({
        label: row.department,
        voteCount: row.voteCount,
        percentage: row.percentage,
      }))}
    />
  );
}

function YearTurnout({ rows }: { rows: YearVote[] }) {
  return (
    <BreakdownCard
      title="Year Participation"
      emptyLabel="No year data yet."
      rows={rows.map((row) => ({
        label: row.year,
        voteCount: row.voteCount,
        percentage: row.percentage,
      }))}
    />
  );
}

function BreakdownCard({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ label: string; voteCount: number; percentage: number }>;
  emptyLabel: string;
}) {
  return (
    <GlassCard>
      <h2 className="font-anton text-3xl leading-none text-cine-text-primary">
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((row) => <ProgressRow key={row.label} {...row} />)
        ) : (
          <p className="text-sm text-cine-text-secondary">{emptyLabel}</p>
        )}
      </div>
    </GlassCard>
  );
}

function ProgressRow({
  label,
  voteCount,
  percentage,
}: {
  label: string;
  voteCount: number;
  percentage: number;
}) {
  const width = useMemo(() => `${Math.max(percentage, voteCount ? 5 : 0)}%`, [
    percentage,
    voteCount,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="min-w-0 truncate font-semibold text-cine-text-primary">
          {label}
        </p>
        <p className="shrink-0 text-cine-text-secondary">
          {voteCount} | {percentage}%
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cine-red shadow-red-glow-sm"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function EmptyVotes() {
  return (
    <GlassCard>
      <p className="font-semibold text-cine-text-primary">No votes yet.</p>
      <p className="mt-1 text-sm text-cine-text-secondary">
        Results will populate here as students submit their choices.
      </p>
    </GlassCard>
  );
}

function formatStatus(status: string) {
  return status
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
