"use client";

import type { KeyboardEvent } from "react";
import type { Movie } from "@/types";
import { CinematicButton } from "@/components/ui/CinematicButton";

type MovieCardProps = {
  movie: Movie;
  onDetails: (movie: Movie) => void;
  onVote: (movie: Movie) => void;
};

export function MovieCard({ movie, onDetails, onVote }: MovieCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onDetails(movie);
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onDetails(movie)}
      onKeyDown={handleKeyDown}
      className="group glass-card red-trace-border grid cursor-pointer grid-cols-[6.5rem_1fr] gap-4 rounded-lg p-3 transition hover:-translate-y-0.5 hover:border-cine-red/60 hover:shadow-red-glow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-red sm:grid-cols-1 sm:p-4"
      aria-label={`Open details for ${movie.title}`}
    >
      <div
        className="relative aspect-[2/3] min-h-40 overflow-hidden rounded-md border border-white/10 bg-cine-elevated bg-cover bg-center shadow-xl shadow-black/50 sm:min-h-0"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.86)), radial-gradient(circle at 35% 20%, rgb(229 9 20 / 0.38), transparent 42%), url(${movie.posterUrl})`,
        }}
      >
        <div className="absolute left-2 top-2 rounded-full bg-cine-black/70 px-2 py-1 text-[0.65rem] font-bold text-cine-text-secondary backdrop-blur">
          {movie.rating}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 sm:hidden">
          <p className="font-anton text-2xl leading-none text-cine-text-primary">
            {movie.title}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="hidden items-start justify-between gap-3 sm:flex">
            <h2 className="font-anton text-4xl leading-none text-cine-text-primary">
              {movie.title}
            </h2>
            <span className="rounded-full border border-cine-red/40 bg-cine-red/10 px-2.5 py-1 text-xs font-bold text-cine-text-secondary">
              {movie.rating}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[0.7rem] font-semibold uppercase text-cine-text-muted">
            <span>{movie.genre}</span>
            <span className="text-cine-red">•</span>
            <span>{movie.language}</span>
            <span className="text-cine-red">•</span>
            <span>{movie.runtime}</span>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-cine-text-secondary">
            {movie.hook}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CinematicButton
            variant="ghost"
            className="min-h-10 px-3 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              onDetails(movie);
            }}
          >
            Details
          </CinematicButton>
          <CinematicButton
            className="min-h-10 px-3 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              onVote(movie);
            }}
          >
            Vote
          </CinematicButton>
        </div>
      </div>
    </article>
  );
}
