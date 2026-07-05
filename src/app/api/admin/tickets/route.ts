import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getBookedTicketCount,
  getPollClosed,
  getPollSettingsForTickets,
  getTicketSettings,
} from "@/lib/ticketing";
import { getWinningMovie } from "@/lib/winning-movie";

type PatchBody = {
  is_live?: unknown;
  total_tickets?: unknown;
  booking_starts_at?: unknown;
  booking_closes_at?: unknown;
};

export async function GET() {
  const authError = await getAuthErrorResponse();

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseOrResponse();

  if (supabase instanceof Response) {
    return supabase;
  }

  const payload = await getAdminTicketPayload(supabase);

  if ("error" in payload) {
    return payload.error;
  }

  return Response.json(payload);
}

export async function PATCH(request: Request) {
  const authError = await getAuthErrorResponse();

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseOrResponse();

  if (supabase instanceof Response) {
    return supabase;
  }

  let body: PatchBody;

  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = await getAdminTicketPayload(supabase);

  if ("error" in payload) {
    return payload.error;
  }

  const update: Record<string, string | boolean | number | null> = {
    updated_at: new Date().toISOString(),
  };
  const validationError = applyPatchBody(body, update, payload.bookedTickets);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const nextSettings = {
    isLive:
      "is_live" in update ? Boolean(update.is_live) : payload.isLive,
    totalTickets:
      "total_tickets" in update
        ? Number(update.total_tickets)
        : payload.totalTickets,
    bookingStartsAt:
      "booking_starts_at" in update
        ? (update.booking_starts_at as string | null)
        : payload.bookingStartsAt,
    bookingClosesAt:
      "booking_closes_at" in update
        ? (update.booking_closes_at as string | null)
        : payload.bookingClosesAt,
  };
  const scheduleError = validateScheduleOrder(
    nextSettings.bookingStartsAt,
    nextSettings.bookingClosesAt,
  );

  if (scheduleError) {
    return Response.json({ error: scheduleError }, { status: 400 });
  }

  if (nextSettings.totalTickets < payload.bookedTickets) {
    return Response.json(
      { error: "Total tickets cannot be below booked ticket count." },
      { status: 400 },
    );
  }

  if (nextSettings.isLive) {
    const nextBlockingReason = getBlockingReason({
      pollClosed: payload.blockingReason !== "poll_not_closed",
      winningMovieExists: Boolean(payload.winningMovie),
      eventDateExists: Boolean(payload.eventDate),
      venueExists: Boolean(payload.venue),
      totalTickets: nextSettings.totalTickets,
    });
    const liveBlocker = getLiveBlocker(nextBlockingReason);

    if (liveBlocker) {
      return Response.json({ error: liveBlocker }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("ticket_settings")
    .upsert({ id: "main", ...update }, { onConflict: "id" });

  if (error) {
    console.error("Admin ticket settings update failed:", error);
    return Response.json(
      { error: "Could not update ticket settings." },
      { status: 500 },
    );
  }

  const nextPayload = await getAdminTicketPayload(supabase);

  if ("error" in nextPayload) {
    return nextPayload.error;
  }

  return Response.json(nextPayload);
}

async function getAdminTicketPayload(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const now = new Date();
  const [ticketSettingsLookup, pollSettingsLookup, bookedLookup] =
    await Promise.all([
      getTicketSettings(supabase),
      getPollSettingsForTickets(supabase),
      getBookedTicketCount(supabase),
    ]);

  if (ticketSettingsLookup.error) {
    console.error("Admin ticket settings lookup failed:", ticketSettingsLookup.error);
    return {
      error: Response.json(
        { error: "Could not load ticket settings." },
        { status: 500 },
      ),
    };
  }

  if (pollSettingsLookup.error) {
    console.error("Admin ticket poll lookup failed:", pollSettingsLookup.error);
    return {
      error: Response.json(
        { error: "Could not load poll settings." },
        { status: 500 },
      ),
    };
  }

  if (bookedLookup.error) {
    console.error("Admin ticket count lookup failed:", bookedLookup.error);
    return {
      error: Response.json(
        { error: "Could not load ticket counts." },
        { status: 500 },
      ),
    };
  }

  const winningMovieLookup = await getWinningMovie(supabase);

  if (winningMovieLookup.error) {
    console.error("Admin ticket winner lookup failed:", winningMovieLookup.error);
    return {
      error: Response.json(
        { error: "Could not load winning movie." },
        { status: 500 },
      ),
    };
  }

  const settings = ticketSettingsLookup.data;
  const pollSettings = pollSettingsLookup.data;
  const bookedTickets = bookedLookup.count ?? 0;
  const totalTickets = settings?.total_tickets ?? 0;
  const blockingReason = getBlockingReason({
    pollClosed: getPollClosed(pollSettings, now),
    winningMovieExists: Boolean(winningMovieLookup.winningMovie),
    eventDateExists: Boolean(pollSettings?.event_date),
    venueExists: Boolean(pollSettings?.venue),
    totalTickets,
  });

  return {
    isLive: settings?.is_live ?? false,
    totalTickets,
    bookedTickets,
    remainingTickets: Math.max(0, totalTickets - bookedTickets),
    bookingStartsAt: settings?.booking_starts_at ?? null,
    bookingClosesAt: settings?.booking_closes_at ?? null,
    winningMovie: winningMovieLookup.winningMovie,
    eventDate: pollSettings?.event_date ?? null,
    venue: pollSettings?.venue ?? null,
    canGoLive: blockingReason === null,
    blockingReason,
  };
}

async function getAuthErrorResponse() {
  try {
    if (await requireAdmin()) {
      return null;
    }

    return Response.json({ error: "Unauthorized." }, { status: 401 });
  } catch (error) {
    console.error("Admin auth check failed:", error);

    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }
}

function getSupabaseOrResponse() {
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase admin client error:", error);

    return Response.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }
}

function applyPatchBody(
  body: PatchBody,
  update: Record<string, string | boolean | number | null>,
  bookedTickets: number,
) {
  if ("is_live" in body) {
    if (typeof body.is_live !== "boolean") {
      return "is_live must be a boolean.";
    }

    update.is_live = body.is_live;
  }

  if ("total_tickets" in body) {
    if (
      typeof body.total_tickets !== "number" ||
      !Number.isInteger(body.total_tickets) ||
      body.total_tickets < 0
    ) {
      return "total_tickets must be a non-negative integer.";
    }

    if (body.total_tickets < bookedTickets) {
      return "Total tickets cannot be below booked ticket count.";
    }

    update.total_tickets = body.total_tickets;
  }

  if ("booking_starts_at" in body) {
    if (!isNullableDateString(body.booking_starts_at)) {
      return "booking_starts_at must be an ISO date string or null.";
    }

    update.booking_starts_at = body.booking_starts_at;
  }

  if ("booking_closes_at" in body) {
    if (!isNullableDateString(body.booking_closes_at)) {
      return "booking_closes_at must be an ISO date string or null.";
    }

    update.booking_closes_at = body.booking_closes_at;
  }

  return null;
}

function validateScheduleOrder(startsAt: string | null, closesAt: string | null) {
  if (!startsAt || !closesAt) {
    return null;
  }

  if (new Date(closesAt).getTime() <= new Date(startsAt).getTime()) {
    return "Booking closes at must be after booking starts at.";
  }

  return null;
}

function isNullableDateString(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && !Number.isNaN(Date.parse(value)))
  );
}

function getBlockingReason({
  pollClosed,
  winningMovieExists,
  eventDateExists,
  venueExists,
  totalTickets,
}: {
  pollClosed: boolean;
  winningMovieExists: boolean;
  eventDateExists: boolean;
  venueExists: boolean;
  totalTickets: number;
}) {
  if (!pollClosed) {
    return "poll_not_closed";
  }

  if (!winningMovieExists) {
    return "no_winning_movie";
  }

  if (!eventDateExists) {
    return "event_date_missing";
  }

  if (!venueExists) {
    return "venue_missing";
  }

  if (totalTickets <= 0) {
    return "total_tickets_missing";
  }

  return null;
}

function getLiveBlocker(blockingReason: string | null) {
  if (!blockingReason) {
    return null;
  }

  const copy: Record<string, string> = {
    poll_not_closed: "Poll must be closed before ticketing can go live.",
    no_winning_movie: "A winning movie is required before ticketing can go live.",
    event_date_missing: "Screening date is required before ticketing can go live.",
    venue_missing: "Venue is required before ticketing can go live.",
    total_tickets_missing: "Total tickets must be greater than 0.",
  };

  return copy[blockingReason];
}
