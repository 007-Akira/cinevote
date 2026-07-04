"use client";

import type { Movie } from "@/types";
import { CinematicButton } from "@/components/ui/CinematicButton";

type VoteConfirmModalProps = {
  movie: Movie | null;
  onCancel: () => void;
  onConfirm: (movie: Movie) => void;
};

export function VoteConfirmModal({
  movie,
  onCancel,
  onConfirm,
}: VoteConfirmModalProps) {
  if (!movie) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end bg-cine-black/78 px-3 pb-3 backdrop-blur-sm sm:items-center sm:px-5 sm:pb-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-confirm-title"
      onClick={onCancel}
    >
      <section
        className="glass-card red-trace-border mx-auto w-full max-w-lg space-y-5 rounded-t-2xl p-4 shadow-2xl shadow-black/80 safe-bottom sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            Final check
          </p>
          <h2
            id="vote-confirm-title"
            className="font-anton text-4xl leading-none text-cine-text-primary"
          >
            Confirm your vote?
          </h2>
        </div>

        <MovieVotePreview movie={movie} />

        <div className="grid gap-3 sm:grid-cols-2">
          <CinematicButton className="w-full" onClick={() => onConfirm(movie)}>
            Confirm Vote
          </CinematicButton>
          <CinematicButton
            variant="secondary"
            className="w-full"
            onClick={onCancel}
          >
            Cancel
          </CinematicButton>
        </div>
      </section>
    </div>
  );
}

function MovieVotePreview({ movie }: { movie: Movie }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-4 rounded-lg border border-white/10 bg-cine-elevated/70 p-3">
      <div
        className="aspect-[2/3] rounded-md border border-white/10 bg-cine-card bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`,
        }}
        aria-label={`${movie.title} poster`}
      />
      <div className="min-w-0 self-center">
        <h3 className="font-anton text-3xl leading-none text-cine-text-primary">
          {movie.title}
        </h3>
        <p className="mt-2 text-xs font-semibold uppercase text-cine-text-muted">
          {movie.genre} • {movie.language} • {movie.runtime}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-cine-text-secondary">
          {movie.hook}
        </p>
      </div>
    </div>
  );
}
