"use client";

import { useState } from "react";
import { movies } from "@/data/movies";
import type { Movie } from "@/types";
import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";
import { MovieCard } from "@/components/movies/MovieCard";
import { MovieDetailsSheet } from "@/components/movies/MovieDetailsSheet";

export default function MoviesPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [votedMovieId, setVotedMovieId] = useState<string | null>(null);

  function handleVote(movie: Movie) {
    setVotedMovieId(movie.id);
    setSelectedMovie(null);
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden safe-bottom-lg">
      <FilmGrain />
      <TopBar />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgb(229_9_20_/_0.2),transparent_24rem),radial-gradient(circle_at_100%_28%,rgb(233_188_182_/_0.08),transparent_20rem)]"
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="space-y-3">
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            Choose your screening
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-anton text-5xl leading-none text-cine-text-primary sm:text-7xl">
                Movies
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-cine-text-secondary sm:text-base">
                Browse the shortlist, open details, and vote for the movie you
                want on screening night.
              </p>
            </div>
            {votedMovieId ? (
              <p className="rounded-full border border-cine-red/40 bg-cine-red/10 px-4 py-2 text-sm font-semibold text-cine-text-primary shadow-red-glow-sm">
                Vote saved locally
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onDetails={setSelectedMovie}
              onVote={handleVote}
            />
          ))}
        </div>
      </section>

      <MovieDetailsSheet
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onVote={handleVote}
      />
    </main>
  );
}
