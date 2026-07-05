import { movies } from "@/data/movies";
import type { PublicTicket } from "@/lib/ticketing";
import type { WinningMovie } from "@/lib/winning-movie";

export const TICKET_DEMO_MODE = false;
export const DEMO_TOTAL_TICKETS = 120;
export const DEMO_BOOKED_TICKETS = 37;
export const DEMO_EVENT_DATE = "2026-07-12T18:30:00.000Z";
export const DEMO_VENUE = "Main Auditorium";

export function getDemoWinningMovie(): WinningMovie {
  const movie = movies[0];

  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    genre: movie.genre,
    language: movie.language,
    runtime: movie.runtime,
    voteCount: 128,
  };
}

export function createDemoTicket({
  ticketCode,
  studentName,
  year,
  department,
}: {
  ticketCode: string;
  studentName: string;
  year: string;
  department: string;
}): PublicTicket {
  return {
    ticketCode,
    qrPayload: `CINEVOTE-DEMO-TICKET:${ticketCode}`,
    studentName,
    year,
    department,
    movie: getDemoWinningMovie(),
    eventDate: DEMO_EVENT_DATE,
    venue: DEMO_VENUE,
    createdAt: new Date().toISOString(),
  };
}
