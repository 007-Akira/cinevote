import {
  formatSupabaseError,
  mapMovieRow,
  movieSelect,
  seedMoviesIfMissing,
} from "@/lib/supabase/movies";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MovieRow = {
  id: string;
  title: string;
  language: string;
  genre: string;
  runtime: string;
  rating: string;
  hook: string;
  summary: string;
  why_screen: string;
  poster_url: string;
  backdrop_url: string;
};

export async function GET() {
  let supabase: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase admin client error:", error);

    return Response.json(
      {
        error: "Supabase environment variables are not configured.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }

  const seedError = await seedMoviesIfMissing(supabase);

  if (seedError) {
    return Response.json(
      {
        error: "Could not prepare the movie catalog.",
        supabase: formatSupabaseError(seedError),
      },
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
    console.error("Live results movie lookup failed:", moviesError);

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
    .returns<{ movie_id: string }[]>();

  if (votesError || !voteRows) {
    console.error("Live results vote lookup failed:", votesError);

    return Response.json(
      {
        error: "Could not load vote totals.",
        supabase: formatSupabaseError(votesError),
      },
      { status: 500 },
    );
  }

  const voteCounts = voteRows.reduce<Record<string, number>>((counts, vote) => {
    counts[vote.movie_id] = (counts[vote.movie_id] ?? 0) + 1;
    return counts;
  }, {});
  const totalVotes = voteRows.length;

  const results = movieRows
    .map((movieRow) => {
      const votes = voteCounts[movieRow.id] ?? 0;

      return {
        movie: mapMovieRow(movieRow),
        votes,
        percent: totalVotes ? Math.round((votes / totalVotes) * 100) : 0,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  return Response.json({
    totalVotes,
    results,
  });
}
