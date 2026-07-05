import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatSupabaseError,
  movieSelect,
  seedMoviesIfMissing,
} from "@/lib/supabase/movies";

type MovieRow = {
  id: string;
  title: string;
  genre: string;
  language: string;
  runtime: string;
  poster_url: string;
};

type VoteRow = {
  movie_id: string;
  voted_at: string;
};

export type WinningMovie = {
  id: string;
  title: string;
  posterUrl: string;
  genre: string;
  language: string;
  runtime: string;
  voteCount: number;
};

export async function getWinningMovie(supabase: SupabaseClient) {
  const seedError = await seedMoviesIfMissing(supabase);

  if (seedError) {
    return {
      winningMovie: null,
      error: {
        message: "Could not prepare movie catalog.",
        supabase: formatSupabaseError(seedError),
      },
    };
  }

  const { data: movieRows, error: moviesError } = await supabase
    .from("movies")
    .select(movieSelect)
    .eq("is_active", true)
    .returns<MovieRow[]>();

  if (moviesError || !movieRows) {
    return {
      winningMovie: null,
      error: {
        message: "Could not load movie catalog.",
        supabase: formatSupabaseError(moviesError),
      },
    };
  }

  const { data: voteRows, error: votesError } = await supabase
    .from("votes")
    .select("movie_id,voted_at")
    .returns<VoteRow[]>();

  if (votesError || !voteRows) {
    return {
      winningMovie: null,
      error: {
        message: "Could not load vote result.",
        supabase: formatSupabaseError(votesError),
      },
    };
  }

  return {
    winningMovie: calculateWinningMovie(movieRows, voteRows),
    error: null,
  };
}

function calculateWinningMovie(
  movieRows: MovieRow[],
  voteRows: VoteRow[],
): WinningMovie | null {
  if (!voteRows.length) {
    return null;
  }

  const voteStats = voteRows.reduce<
    Record<string, { voteCount: number; firstVoteAt: string }>
  >((stats, vote) => {
    const existing = stats[vote.movie_id];

    if (!existing) {
      stats[vote.movie_id] = {
        voteCount: 1,
        firstVoteAt: vote.voted_at,
      };
      return stats;
    }

    existing.voteCount += 1;

    if (new Date(vote.voted_at).getTime() < new Date(existing.firstVoteAt).getTime()) {
      existing.firstVoteAt = vote.voted_at;
    }

    return stats;
  }, {});

  const [winningMovieId, winningStats] =
    Object.entries(voteStats).sort(([, a], [, b]) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }

      return new Date(a.firstVoteAt).getTime() - new Date(b.firstVoteAt).getTime();
    })[0] ?? [];

  if (!winningMovieId || !winningStats) {
    return null;
  }

  const movie = movieRows.find((movieRow) => movieRow.id === winningMovieId);

  if (!movie) {
    return null;
  }

  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.poster_url,
    genre: movie.genre,
    language: movie.language,
    runtime: movie.runtime,
    voteCount: winningStats.voteCount,
  };
}
