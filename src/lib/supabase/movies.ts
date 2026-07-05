import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { movies } from "@/data/movies";
import type { Movie } from "@/types";

export const movieSelect =
  "id,title,language,genre,runtime,rating,hook,summary,why_screen,poster_url,backdrop_url";

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

type MovieInsert = MovieRow & {
  is_active: boolean;
  sort_order: number;
};

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function mapMovieRow(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    genre: row.genre,
    runtime: row.runtime,
    rating: row.rating,
    hook: row.hook,
    summary: row.summary,
    whyScreen: row.why_screen,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
  };
}

export function formatSupabaseError(error: SupabaseError | null) {
  if (!error) {
    return null;
  }

  return {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  };
}

export async function seedMoviesIfMissing(supabase: SupabaseClient) {
  const { error } = await supabase
    .from("movies")
    .upsert(toMovieInserts(), { onConflict: "id" });

  if (error) {
    console.error("Movie catalog seed failed:", error);
  }

  return error;
}

export async function getActiveMovieById(
  supabase: SupabaseClient,
  movieId: string,
) {
  const firstLookup = await selectActiveMovieById(supabase, movieId);

  if (firstLookup.data && !firstLookup.error) {
    return {
      movie: firstLookup.data,
      error: null,
      seedError: null,
    };
  }

  console.error("Movie lookup missed before catalog seed:", {
    movieId,
    movieError: firstLookup.error,
    movie: firstLookup.data,
  });

  const seedError = await seedMoviesIfMissing(supabase);

  if (seedError) {
    return {
      movie: null,
      error: firstLookup.error,
      seedError,
    };
  }

  const retryLookup = await selectActiveMovieById(supabase, movieId);

  if (retryLookup.error || !retryLookup.data) {
    console.error("Movie lookup failed after catalog seed:", {
      movieId,
      movieError: retryLookup.error,
      movie: retryLookup.data,
    });
  }

  return {
    movie: retryLookup.data ?? null,
    error: retryLookup.error,
    seedError: null,
  };
}

function selectActiveMovieById(supabase: SupabaseClient, movieId: string) {
  return supabase
    .from("movies")
    .select(movieSelect)
    .eq("id", movieId)
    .eq("is_active", true)
    .maybeSingle<MovieRow>();
}

function toMovieInserts(): MovieInsert[] {
  return movies.map((movie, index) => ({
    id: movie.id,
    title: movie.title,
    language: movie.language,
    genre: movie.genre,
    runtime: movie.runtime,
    rating: movie.rating,
    hook: movie.hook,
    summary: movie.summary,
    why_screen: movie.whyScreen,
    poster_url: movie.posterUrl,
    backdrop_url: movie.backdropUrl,
    is_active: true,
    sort_order: index + 1,
  }));
}
