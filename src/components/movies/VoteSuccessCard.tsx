"use client";

import type { Movie } from "@/types";

type VoteSuccessCardProps = {
  movie: Movie;
};

export function VoteSuccessCard({ movie }: VoteSuccessCardProps) {
  return (
    <aside className="glass-card red-trace-border mt-6 grid gap-4 rounded-lg p-4 shadow-red-glow-sm sm:grid-cols-[6rem_1fr] sm:items-center">
      <div
        className="aspect-[2/3] w-24 rounded-md border border-white/10 bg-cine-card bg-cover bg-center shadow-xl shadow-black/60"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`,
        }}
        aria-label={`${movie.title} poster`}
      />
      <div>
        <p className="font-anton text-3xl leading-none text-cine-text-primary">
          Your vote has been recorded
        </p>
        <p className="mt-2 text-sm leading-6 text-cine-text-secondary">
          Final screening details will be announced soon.
        </p>
        <p className="mt-3 text-sm font-semibold text-cine-text-muted">
          Selected movie:{" "}
          <span className="text-cine-text-primary">{movie.title}</span>
        </p>
      </div>
    </aside>
  );
}
