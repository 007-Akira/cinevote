import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WinningMovie } from "@/lib/winning-movie";

export type PollSettingsForTickets = {
  is_open: boolean;
  poll_closes_at: string | null;
  event_date: string | null;
  venue: string | null;
};

export type TicketSettingsRow = {
  is_live: boolean;
  total_tickets: number;
  booking_starts_at: string | null;
  booking_closes_at: string | null;
  updated_at: string;
};

export type TicketRow = {
  ticket_code: string;
  student_name: string;
  year: string;
  department: string;
  qr_payload: string;
  movie_id: string | null;
  created_at: string;
};

export type PublicTicket = {
  ticketCode: string;
  qrPayload: string;
  studentName: string;
  year: string;
  department: string;
  movie: WinningMovie | null;
  eventDate: string | null;
  venue: string | null;
  createdAt: string;
};

export function getPollClosed(settings: PollSettingsForTickets | null, now: Date) {
  if (!settings || !settings.poll_closes_at) {
    return false;
  }

  const closesAt = new Date(settings.poll_closes_at).getTime();

  if (!Number.isFinite(closesAt)) {
    return false;
  }

  return !settings.is_open || now.getTime() >= closesAt;
}

export function getBookingWindowReason(
  settings: TicketSettingsRow,
  now: Date,
) {
  if (settings.booking_starts_at) {
    const startsAt = new Date(settings.booking_starts_at).getTime();

    if (Number.isFinite(startsAt) && now.getTime() < startsAt) {
      return "booking_not_started";
    }
  }

  if (settings.booking_closes_at) {
    const closesAt = new Date(settings.booking_closes_at).getTime();

    if (Number.isFinite(closesAt) && now.getTime() >= closesAt) {
      return "booking_closed";
    }
  }

  return null;
}

export function mapPublicTicket({
  ticket,
  winningMovie,
  eventDate,
  venue,
}: {
  ticket: TicketRow;
  winningMovie: WinningMovie | null;
  eventDate: string | null;
  venue: string | null;
}): PublicTicket {
  return {
    ticketCode: ticket.ticket_code,
    qrPayload: ticket.qr_payload,
    studentName: ticket.student_name,
    year: ticket.year,
    department: ticket.department,
    movie: winningMovie,
    eventDate,
    venue,
    createdAt: ticket.created_at,
  };
}

export async function getTicketSettings(supabase: SupabaseClient) {
  return supabase
    .from("ticket_settings")
    .select(
      "is_live,total_tickets,booking_starts_at,booking_closes_at,updated_at",
    )
    .eq("id", "main")
    .maybeSingle<TicketSettingsRow>();
}

export async function getPollSettingsForTickets(supabase: SupabaseClient) {
  return supabase
    .from("poll_settings")
    .select("is_open,poll_closes_at,event_date,venue")
    .eq("id", "main")
    .maybeSingle<PollSettingsForTickets>();
}

export async function getBookedTicketCount(supabase: SupabaseClient) {
  return supabase
    .from("tickets")
    .select("id", { count: "exact", head: true });
}

export async function getExistingTicket(
  supabase: SupabaseClient,
  deviceId: string,
) {
  return supabase
    .from("tickets")
    .select(
      "ticket_code,student_name,year,department,qr_payload,movie_id,created_at",
    )
    .eq("device_id", deviceId)
    .maybeSingle<TicketRow>();
}
