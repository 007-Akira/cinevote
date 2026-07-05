import { requireAdmin } from "@/lib/admin-auth";
import { formatSupabaseError } from "@/lib/supabase/movies";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ExportRow = {
  id: string;
  voted_at: string;
  movie_id: string;
  device_id: string;
  movies:
    | {
        title: string | null;
      }
    | {
        title: string | null;
      }[]
    | null;
  voters:
    | {
        name: string | null;
        year_of_study: string | null;
        department: string | null;
      }
    | {
        name: string | null;
        year_of_study: string | null;
        department: string | null;
      }[]
    | null;
};

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch (error) {
    console.error("Admin auth check failed:", error);

    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase admin client error:", error);

    return Response.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("votes")
    .select(
      "id,voted_at,movie_id,device_id,movies(title),voters(name,year_of_study,department)",
    )
    .order("voted_at", { ascending: true })
    .returns<ExportRow[]>();

  if (error || !data) {
    console.error("Admin CSV export lookup failed:", error);

    return Response.json(
      {
        error: "Could not export votes.",
        supabase: formatSupabaseError(error),
      },
      { status: 500 },
    );
  }

  const headers = [
    "vote_id",
    "voted_at",
    "movie_id",
    "movie_title",
    "voter_name",
    "year",
    "department",
    "device_id",
  ];

  const rows = data.map((row) => {
    const movie = normalizeJoinedRow(row.movies);
    const voter = normalizeJoinedRow(row.voters);

    return [
      row.id,
      row.voted_at,
      row.movie_id,
      movie?.title ?? "",
      voter?.name ?? "",
      voter?.year_of_study ?? "",
      voter?.department ?? "",
      row.device_id,
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cinevote-results.csv"',
    },
  });
}

function normalizeJoinedRow<T>(row: T | T[] | null) {
  return Array.isArray(row) ? row[0] : row;
}

function escapeCsvValue(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
