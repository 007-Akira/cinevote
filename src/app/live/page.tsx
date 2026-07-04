"use client";

import { useEffect, useMemo, useState } from "react";
import { movies } from "@/data/movies";
import type { Vote } from "@/types";
import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";
import { CinematicButton } from "@/components/ui/CinematicButton";
import { getStoredVote } from "@/lib/storage";

const baseVotes: Record<string, number> = {
  "movie-1": 42,
  "movie-2": 38,
  "movie-3": 31,
  "movie-4": 35,
};

export default function LiveVotingPage() {
  const [storedVote, setStoredVote] = useState<Vote | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setStoredVote(getStoredVote());
    });
  }, []);

  const results = useMemo(() => {
    const totals = movies.map((movie) => ({
      movie,
      votes: baseVotes[movie.id] + (storedVote?.movieId === movie.id ? 1 : 0),
    }));
    const totalVotes = totals.reduce((sum, result) => sum + result.votes, 0);

    return totals
      .map((result) => ({
        ...result,
        percent: totalVotes ? Math.round((result.votes / totalVotes) * 100) : 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [storedVote]);

  const leadingMovie = results[0]?.movie;

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
            Live voting
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <h1 className="font-anton text-5xl leading-none text-cine-text-primary sm:text-7xl">
                Current Standings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-cine-text-secondary sm:text-base">
                Follow the screening race as votes come in. Your browser vote is
                highlighted locally until the backend is connected.
              </p>
            </div>

            {leadingMovie ? (
              <div className="glass-card red-trace-border rounded-lg p-4">
                <p className="text-xs font-bold uppercase text-cine-text-muted">
                  Leading now
                </p>
                <p className="mt-2 font-anton text-4xl leading-none text-cine-text-primary">
                  {leadingMovie.title}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-7 grid gap-4">
          {results.map((result, index) => {
            const isYourVote = storedVote?.movieId === result.movie.id;

            return (
              <article
                key={result.movie.id}
                className="glass-card red-trace-border grid gap-4 rounded-lg p-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center"
              >
                <div
                  className="aspect-[2/3] w-20 rounded-md border border-white/10 bg-cine-card bg-cover bg-center shadow-xl shadow-black/60"
                  style={{
                    backgroundImage: `linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.72)), url(${result.movie.posterUrl})`,
                  }}
                  aria-label={`${result.movie.title} poster`}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cine-red px-2 py-1 text-xs font-bold text-cine-text-primary">
                      #{index + 1}
                    </span>
                    {isYourVote ? (
                      <span className="rounded-full border border-cine-red/40 bg-cine-red/10 px-2 py-1 text-xs font-bold text-cine-text-secondary">
                        Your vote
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-anton text-4xl leading-none text-cine-text-primary">
                    {result.movie.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold uppercase text-cine-text-muted">
                    {result.movie.genre} • {result.movie.language}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cine-red red-glow-sm"
                      style={{ width: `${result.percent}%` }}
                    />
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-anton text-4xl leading-none text-cine-red">
                    {result.percent}%
                  </p>
                  <p className="mt-1 text-sm text-cine-text-muted">
                    {result.votes} votes
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6">
          <CinematicButton href="/movies" variant="secondary">
            Back to voting
          </CinematicButton>
        </div>
      </section>
    </main>
  );
}
