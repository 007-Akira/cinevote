import {
  formatSupabaseError,
  movieSelect,
  seedMoviesIfMissing,
} from "@/lib/supabase/movies";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

type MovieRow = {
  id: string;
  title: string;
  poster_url: string;
};

type VoteMovieRow = {
  movie_id: string;
};

type VoteVoterRow = {
  voters:
    | {
        department: string | null;
        year_of_study: string | null;
      }
    | {
        department: string | null;
        year_of_study: string | null;
      }[]
    | null;
};

type PollSettingsRow = {
  is_open: boolean;
  event_status: string;
  poll_starts_at: string | null;
  poll_closes_at: string | null;
  event_date: string | null;
  venue: string | null;
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

  const seedError = await seedMoviesIfMissing(supabase);

  if (seedError) {
    console.error("Admin stats movie seed failed:", seedError);

    return Response.json(
      { error: "Could not prepare the movie catalog." },
      { status: 500 },
    );
  }

  const pollSettingsLookup = await supabase
    .from("poll_settings")
    .select("is_open,event_status,poll_starts_at,poll_closes_at,event_date,venue")
    .eq("id", "main")
    .maybeSingle<PollSettingsRow>();
  const pollSettingsFallbackLookup = isMissingPollStartsAt(
    pollSettingsLookup.error,
  )
    ? await supabase
        .from("poll_settings")
        .select("is_open,event_status,poll_closes_at,event_date")
        .eq("id", "main")
        .maybeSingle<Omit<PollSettingsRow, "poll_starts_at" | "venue">>()
    : isMissingVenue(pollSettingsLookup.error)
      ? await supabase
          .from("poll_settings")
          .select("is_open,event_status,poll_starts_at,poll_closes_at,event_date")
          .eq("id", "main")
          .maybeSingle<Omit<PollSettingsRow, "venue">>()
      : null;
  const rawPollSettings =
    pollSettingsFallbackLookup?.data ?? pollSettingsLookup.data;
  const pollSettings = rawPollSettings
    ? {
        ...rawPollSettings,
        poll_starts_at:
          "poll_starts_at" in rawPollSettings
            ? rawPollSettings.poll_starts_at
            : null,
        venue:
          "venue" in rawPollSettings
            ? (rawPollSettings.venue as string | null)
            : null,
      }
    : null;
  const pollSettingsError =
    pollSettingsFallbackLookup?.error ?? pollSettingsLookup.error;

  if (pollSettingsError) {
    console.error("Admin stats poll settings lookup failed:", pollSettingsError);

    return Response.json(
      {
        error: "Could not load poll settings.",
        supabase: formatSupabaseError(pollSettingsError),
      },
      { status: 500 },
    );
  }

  if (!pollSettings) {
    return Response.json(
      { error: 'Poll settings row "main" is missing.' },
      { status: 500 },
    );
  }

  const { data: movieRows, error: moviesError } = await supabase
    .from("movies")
    .select(movieSelect)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<MovieRow[]>();

  if (moviesError || !movieRows) {
    console.error("Admin stats movie lookup failed:", moviesError);

    return Response.json(
      {
        error: "Could not load movies.",
        supabase: formatSupabaseError(moviesError),
      },
      { status: 500 },
    );
  }

  const { data: voteRows, error: votesError } = await supabase
    .from("votes")
    .select("movie_id")
    .returns<VoteMovieRow[]>();

  if (votesError || !voteRows) {
    console.error("Admin stats vote lookup failed:", votesError);

    return Response.json(
      {
        error: "Could not load vote totals.",
        supabase: formatSupabaseError(votesError),
      },
      { status: 500 },
    );
  }

  const { data: voterRows, error: votersError } = await supabase
    .from("votes")
    .select("voters(department,year_of_study)")
    .returns<VoteVoterRow[]>();

  if (votersError || !voterRows) {
    console.error("Admin stats voter grouping lookup failed:", votersError);

    return Response.json(
      {
        error: "Could not load voter breakdowns.",
        supabase: formatSupabaseError(votersError),
      },
      { status: 500 },
    );
  }

  const totalVotes = voteRows.length;
  const securitySummary = await getSecuritySummary(supabase);
  const movieVoteCounts = countBy(voteRows, (vote) => vote.movie_id);

  const movieWiseVotes = movieRows
    .map((movie) => {
      const voteCount = movieVoteCounts[movie.id] ?? 0;

      return {
        movieId: movie.id,
        title: movie.title,
        posterUrl: movie.poster_url,
        voteCount,
        percentage: calculatePercentage(voteCount, totalVotes),
      };
    })
    .sort((a, b) => b.voteCount - a.voteCount);

  const leadingMovie = movieWiseVotes[0] ?? null;
  const departmentCounts: Record<string, number> = {};
  const yearCounts: Record<string, number> = {};

  for (const row of voterRows) {
    const voter = normalizeJoinedRow(row.voters);

    if (voter?.department) {
      departmentCounts[voter.department] =
        (departmentCounts[voter.department] ?? 0) + 1;
    }

    if (voter?.year_of_study) {
      yearCounts[voter.year_of_study] = (yearCounts[voter.year_of_study] ?? 0) + 1;
    }
  }

  return Response.json({
    totalVotes,
    leadingMovie,
    movieWiseVotes,
    departmentWiseVotes: toBreakdownRows(
      departmentCounts,
      totalVotes,
      "department",
    ),
    yearWiseVotes: toBreakdownRows(yearCounts, totalVotes, "year"),
    pollStatus: {
      isOpen: pollSettings.is_open,
      eventStatus: pollSettings.event_status,
      pollStartsAt: pollSettings.poll_starts_at,
      pollClosesAt: pollSettings.poll_closes_at,
      eventDate: pollSettings.event_date,
      venue: pollSettings.venue,
    },
    securitySummary,
  });
}

function countBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const key = getKey(row);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function calculatePercentage(voteCount: number, totalVotes: number) {
  return totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0;
}

function isMissingPollStartsAt(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42703" ||
    Boolean(error?.message?.includes("poll_starts_at"))
  );
}

function isMissingVenue(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || Boolean(error?.message?.includes("venue"));
}

function normalizeJoinedRow<T>(row: T | T[] | null) {
  return Array.isArray(row) ? row[0] : row;
}

function toBreakdownRows(
  counts: Record<string, number>,
  totalVotes: number,
  label: "department" | "year",
) {
  return Object.entries(counts)
    .map(([name, voteCount]) => ({
      [label]: name,
      voteCount,
      percentage: calculatePercentage(voteCount, totalVotes),
    }))
    .sort((a, b) => b.voteCount - a.voteCount);
}

async function getSecuritySummary(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalAttemptsLast10Min = await countVoteAttempts(
    supabase
      .from("vote_attempts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", tenMinutesAgo),
  );
  const rateLimitedAttemptsLast10Min = await countVoteAttempts(
    supabase
      .from("vote_attempts")
      .select("id", { count: "exact", head: true })
      .eq("status", "rate_limited")
      .gte("created_at", tenMinutesAgo),
  );
  const duplicateVoteAttempts = await countVoteAttempts(
    supabase
      .from("vote_attempts")
      .select("id", { count: "exact", head: true })
      .eq("status", "duplicate_vote"),
  );
  const suspiciousAttemptsToday = await countVoteAttempts(
    supabase
      .from("vote_attempts")
      .select("id", { count: "exact", head: true })
      .eq("reason", "suspicious_duplicate_profile")
      .gte("created_at", today.toISOString()),
  );

  return {
    totalAttemptsLast10Min,
    rateLimitedAttemptsLast10Min,
    duplicateVoteAttempts,
    suspiciousAttemptsToday,
  };
}

async function countVoteAttempts(
  query: PromiseLike<{ count: number | null; error: unknown }>,
) {
  const { count, error } = await query;
  if (error) {
    console.error("Security summary vote_attempts count failed:", error);
    return 0;
  }

  return count ?? 0;
}
