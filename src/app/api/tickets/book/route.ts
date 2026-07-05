import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DEVICE_COOKIE_NAME,
  getDeviceCookieOptions,
  getOrCreateTrustedDeviceId,
} from "@/lib/device-cookie";
import { createDemoTicket, TICKET_DEMO_MODE } from "@/lib/demo-ticketing";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getBookedTicketCount,
  getBookingWindowReason,
  getExistingTicket,
  getPollClosed,
  getPollSettingsForTickets,
  getTicketSettings,
  mapPublicTicket,
  type TicketRow,
} from "@/lib/ticketing";
import { getWinningMovie } from "@/lib/winning-movie";

const departments = [
  "CSE",
  "ECE",
  "CSE(AI)",
  "ER",
  "CIVIL",
  "MECH",
  "EEE",
] as const;

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

const ticketRequestSchema = z
  .object({
    profile: z
      .object({
        name: z.string().trim().min(2).max(80),
        year: z.enum(years),
        department: z.enum(departments),
      })
      .strict(),
  })
  .strict();

export async function POST(request: NextRequest) {
  let trustedDevice: ReturnType<typeof getOrCreateTrustedDeviceId>;

  try {
    trustedDevice = getOrCreateTrustedDeviceId(request);
  } catch (error) {
    console.error("Ticket booking device cookie setup failed:", error);
    return Response.json({ error: "Could not verify device." }, { status: 500 });
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return jsonWithDeviceCookie(
      { error: "Invalid JSON body." },
      { status: 400 },
      trustedDevice.cookieValue,
    );
  }

  const parsedBody = ticketRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return jsonWithDeviceCookie(
      { error: "Invalid ticket request." },
      { status: 400 },
      trustedDevice.cookieValue,
    );
  }

  if (TICKET_DEMO_MODE) {
    return jsonWithDeviceCookie(
      {
        ticket: createDemoTicket({
          ticketCode: createTicketCode(),
          studentName: parsedBody.data.profile.name,
          year: parsedBody.data.profile.year,
          department: parsedBody.data.profile.department,
        }),
      },
      { status: 200 },
      trustedDevice.cookieValue,
    );
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Ticket booking Supabase client error:", error);
    return jsonWithDeviceCookie(
      { error: "Ticket booking is not configured." },
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

  if (ticketSettingsLookup.error || !ticketSettingsLookup.data) {
    console.error("Ticket booking settings lookup failed:", ticketSettingsLookup.error);
    return jsonWithDeviceCookie(
      { error: "Ticket booking not live." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  if (pollSettingsLookup.error || !pollSettingsLookup.data) {
    console.error("Ticket booking poll lookup failed:", pollSettingsLookup.error);
    return jsonWithDeviceCookie(
      { error: "Poll result not finalized." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  if (bookedLookup.error) {
    console.error("Ticket booking count lookup failed:", bookedLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not verify ticket capacity." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const ticketSettings = ticketSettingsLookup.data;
  const pollSettings = pollSettingsLookup.data;

  if (!ticketSettings.is_live) {
    return jsonWithDeviceCookie(
      { error: "Ticket booking not live." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  if (!getPollClosed(pollSettings, now)) {
    return jsonWithDeviceCookie(
      { error: "Poll result not finalized." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  const windowReason = getBookingWindowReason(ticketSettings, now);

  if (windowReason === "booking_not_started") {
    return jsonWithDeviceCookie(
      { error: "Booking not started." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  if (windowReason === "booking_closed") {
    return jsonWithDeviceCookie(
      { error: "Booking closed." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  if (!pollSettings.event_date || !pollSettings.venue) {
    return jsonWithDeviceCookie(
      { error: "Screening details are missing." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  const winningMovieLookup = await getWinningMovie(supabase);

  if (winningMovieLookup.error) {
    console.error("Ticket booking winner lookup failed:", winningMovieLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not prepare ticket booking." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  const winningMovie = winningMovieLookup.winningMovie;

  if (!winningMovie) {
    return jsonWithDeviceCookie(
      { error: "Poll result not finalized." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  const existingTicketLookup = await getExistingTicket(
    supabase,
    trustedDevice.deviceId,
  );

  if (existingTicketLookup.error) {
    console.error("Ticket booking duplicate lookup failed:", existingTicketLookup.error);
    return jsonWithDeviceCookie(
      { error: "Could not verify existing ticket." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  if (existingTicketLookup.data) {
    return jsonWithDeviceCookie(
      {
        ticket: mapPublicTicket({
          ticket: existingTicketLookup.data,
          winningMovie,
          eventDate: pollSettings.event_date,
          venue: pollSettings.venue,
        }),
      },
      { status: 200 },
      trustedDevice.cookieValue,
    );
  }

  if (ticketSettings.total_tickets <= 0) {
    return jsonWithDeviceCookie(
      { error: "Ticket booking not live." },
      { status: 403 },
      trustedDevice.cookieValue,
    );
  }

  if ((bookedLookup.count ?? 0) >= ticketSettings.total_tickets) {
    return jsonWithDeviceCookie(
      { error: "Tickets sold out." },
      { status: 409 },
      trustedDevice.cookieValue,
    );
  }

  const voterLookup = await supabase
    .from("voters")
    .select("id")
    .eq("device_id", trustedDevice.deviceId)
    .maybeSingle<{ id: string }>();

  if (voterLookup.error) {
    console.error("Ticket booking voter lookup failed:", voterLookup.error);
  }

  const insertedTicket = await insertTicket({
    supabase,
    deviceId: trustedDevice.deviceId,
    voterId: voterLookup.data?.id ?? null,
    movieId: winningMovie.id,
    profile: parsedBody.data.profile,
  });

  if (insertedTicket.error === "duplicate_device") {
    const duplicateTicketLookup = await getExistingTicket(
      supabase,
      trustedDevice.deviceId,
    );

    if (duplicateTicketLookup.data) {
      return jsonWithDeviceCookie(
        {
          ticket: mapPublicTicket({
            ticket: duplicateTicketLookup.data,
            winningMovie,
            eventDate: pollSettings.event_date,
            venue: pollSettings.venue,
          }),
        },
        { status: 200 },
        trustedDevice.cookieValue,
      );
    }
  }

  if (insertedTicket.error || !insertedTicket.ticket) {
    console.error("Ticket insert failed:", insertedTicket.error);
    return jsonWithDeviceCookie(
      { error: "Could not create ticket." },
      { status: 500 },
      trustedDevice.cookieValue,
    );
  }

  return jsonWithDeviceCookie(
    {
      ticket: mapPublicTicket({
        ticket: insertedTicket.ticket,
        winningMovie,
        eventDate: pollSettings.event_date,
        venue: pollSettings.venue,
      }),
    },
    { status: 200 },
    trustedDevice.cookieValue,
  );
}

async function insertTicket({
  supabase,
  deviceId,
  voterId,
  movieId,
  profile,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  deviceId: string;
  voterId: string | null;
  movieId: string;
  profile: z.infer<typeof ticketRequestSchema>["profile"];
}): Promise<
  | { ticket: TicketRow; error: null }
  | { ticket: null; error: unknown | "duplicate_device" }
> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ticketCode = createTicketCode();
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        ticket_code: ticketCode,
        device_id: deviceId,
        voter_id: voterId,
        movie_id: movieId,
        student_name: profile.name,
        year: profile.year,
        department: profile.department,
        qr_payload: `CINEVOTE-TICKET:${ticketCode}`,
      })
      .select(
        "ticket_code,student_name,year,department,qr_payload,movie_id,created_at",
      )
      .single<TicketRow>();

    if (!error && data) {
      return { ticket: data, error: null };
    }

    if (error?.code === "23505" && error.message.includes("device_id")) {
      return { ticket: null, error: "duplicate_device" };
    }

    if (error?.code === "23505" && error.message.includes("ticket_code")) {
      continue;
    }

    return { ticket: null, error };
  }

  return { ticket: null, error: "ticket_code_collision" };
}

function createTicketCode() {
  return `CVT-${new Date().getFullYear()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
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
