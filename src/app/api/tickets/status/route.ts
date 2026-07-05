import { NextRequest, NextResponse } from "next/server";
import {
  DEVICE_COOKIE_NAME,
  getDeviceCookieOptions,
  getOrCreateTrustedDeviceId,
} from "@/lib/device-cookie";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getBookedTicketCount,
  getBookingWindowReason,
  getExistingTicket,
  getPollClosed,
  getPollSettingsForTickets,
  getTicketSettings,
  mapPublicTicket,
} from "@/lib/ticketing";
import { getWinningMovie } from "@/lib/winning-movie";

export async function GET(request: NextRequest) {
  let trustedDevice: ReturnType<typeof getOrCreateTrustedDeviceId>;

  try {
    trustedDevice = getOrCreateTrustedDeviceId(request);
  } catch (error) {
    console.error("Ticket status device cookie setup failed:", error);
    return Response.json({ error: "Could not verify device." }, { status: 500 });
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Ticket status Supabase client error:", error);
    return jsonWithDeviceCookie(
      { error: "Ticketing is not configured." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const now = new Date();
  const [ticketSettingsLookup, pollSettingsLookup, bookedLookup] =
    await Promise.all([
      getTicketSettings(supabase),
      getPollSettingsForTickets(supabase),
      getBookedTicketCount(supabase),
    ]);

  if (ticketSettingsLookup.error) {
    console.error("Ticket status settings lookup failed:", ticketSettingsLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not load ticket status." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  if (pollSettingsLookup.error) {
    console.error("Ticket status poll lookup failed:", pollSettingsLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not load ticket status." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  if (bookedLookup.error) {
    console.error("Ticket status count lookup failed:", bookedLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not load ticket status." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const ticketSettings = ticketSettingsLookup.data;
  const pollSettings = pollSettingsLookup.data;
  const bookedTickets = bookedLookup.count ?? 0;
  const totalTickets = ticketSettings?.total_tickets ?? 0;
  const remainingTickets = Math.max(0, totalTickets - bookedTickets);
  const basePayload = {
    totalTickets,
    bookedTickets,
    remainingTickets,
    bookingStartsAt: ticketSettings?.booking_starts_at ?? null,
    bookingClosesAt: ticketSettings?.booking_closes_at ?? null,
    eventDate: pollSettings?.event_date ?? null,
    venue: pollSettings?.venue ?? null,
  };

  if (!ticketSettings || !ticketSettings.is_live) {
    return jsonWithDeviceCookie(
      {
        isLive: false,
        reason: "coming_soon",
        ...basePayload,
        winningMovie: null,
        existingTicket: null,
      },
      { status: 200 },
      trustedDevice.cookieValue,
    );
  }

  if (!getPollClosed(pollSettings, now)) {
    return jsonWithDeviceCookie(
      {
        isLive: false,
        reason: "poll_not_closed",
        ...basePayload,
        winningMovie: null,
        existingTicket: null,
      },
      { status: 200 },
      trustedDevice.cookieValue,
    );
  }

  const winningMovieLookup = await getWinningMovie(supabase);

  if (winningMovieLookup.error) {
    console.error("Ticket status winner lookup failed:", winningMovieLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not load ticket status." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const winningMovie = winningMovieLookup.winningMovie;

  if (!winningMovie) {
    return jsonWithDeviceCookie(
      {
        isLive: false,
        reason: "no_winning_movie",
        ...basePayload,
        winningMovie: null,
        existingTicket: null,
      },
      { status: 200 },
      trustedDevice.cookieValue,
    );
  }

  if (!pollSettings?.event_date || !pollSettings.venue) {
    return jsonWithDeviceCookie(
      {
        isLive: false,
        reason: "screening_details_missing",
        ...basePayload,
        winningMovie,
        existingTicket: null,
      },
      { status: 200 },
      trustedDevice.cookieValue,
    );
  }

  const existingTicketLookup = await getExistingTicket(
    supabase,
    trustedDevice.deviceId,
  );

  if (existingTicketLookup.error) {
    console.error("Ticket status existing ticket lookup failed:", existingTicketLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not load ticket status." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const existingTicket = existingTicketLookup.data
    ? mapPublicTicket({
        ticket: existingTicketLookup.data,
        winningMovie,
        eventDate: pollSettings.event_date,
        venue: pollSettings.venue,
      })
    : null;
  const windowReason = getBookingWindowReason(ticketSettings, now);
  const reason =
    existingTicket ? "live" : windowReason ?? (remainingTickets <= 0 ? "sold_out" : "live");

  return jsonWithDeviceCookie(
    {
      isLive: reason === "live",
      reason,
      ...basePayload,
      winningMovie,
      existingTicket,
    },
    { status: 200 },
    trustedDevice.cookieValue,
  );
}

function jsonWithDeviceCookie(
  body: unknown,
  init: ResponseInit,
  cookieValue: string | null,
) {
  const response = NextResponse.json(body, init);

  if (cookieValue) {
    response.cookies.set(DEVICE_COOKIE_NAME, cookieValue, getDeviceCookieOptions());
  }

  return response;
}
