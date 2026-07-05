import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type TicketExportRow = {
  ticket_code: string;
  created_at: string;
  student_name: string;
  year: string;
  department: string;
  event_date: string | null;
  venue: string | null;
  device_id: string;
  movies: { title: string } | null;
};

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch (error) {
    console.error("Ticket export admin auth failed:", error);
    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Ticket export Supabase client error:", error);
    return Response.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { data: pollSettings, error: pollError } = await supabase
    .from("poll_settings")
    .select("event_date,venue")
    .eq("id", "main")
    .maybeSingle<{ event_date: string | null; venue: string | null }>();

  if (pollError) {
    console.error("Ticket export poll lookup failed:", pollError);
    return Response.json(
      { error: "Could not prepare ticket export." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("tickets")
    .select(
      "ticket_code,created_at,student_name,year,department,device_id,movies(title)",
    )
    .order("created_at", { ascending: true })
    .returns<Omit<TicketExportRow, "event_date" | "venue">[]>();

  if (error || !data) {
    console.error("Ticket export lookup failed:", error);
    return Response.json(
      { error: "Could not export tickets." },
      { status: 500 },
    );
  }

  const rows: TicketExportRow[] = data.map((ticket) => ({
    ...ticket,
    event_date: pollSettings?.event_date ?? null,
    venue: pollSettings?.venue ?? null,
  }));
  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cinevote-tickets.csv"',
    },
  });
}

function toCsv(rows: TicketExportRow[]) {
  const header = [
    "ticket_code",
    "created_at",
    "movie_title",
    "student_name",
    "year",
    "department",
    "event_date",
    "venue",
    "device_id",
  ];
  const body = rows.map((row) =>
    [
      row.ticket_code,
      row.created_at,
      row.movies?.title ?? "",
      row.student_name,
      row.year,
      row.department,
      row.event_date ?? "",
      row.venue ?? "",
      row.device_id,
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  return [header.join(","), ...body].join("\n");
}

function escapeCsvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
