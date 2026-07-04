"use client";

import type { Movie } from "@/types";
import { CinematicButton } from "@/components/ui/CinematicButton";

type MovieDetailsSheetProps = {
  movie: Movie | null;
  onClose: () => void;
  onVote: (movie: Movie) => void;
};

export function MovieDetailsSheet({
  movie,
  onClose,
  onVote,
}: MovieDetailsSheetProps) {
  if (!movie) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-cine-black/72 px-3 pb-3 backdrop-blur-sm sm:px-5 sm:pb-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-details-title"
      onClick={onClose}
    >
      <section
        className="glass-card red-trace-border mx-auto max-h-[90dvh] w-full max-w-3xl overflow-hidden rounded-t-2xl shadow-2xl shadow-black/80 sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="relative min-h-44 bg-cine-elevated bg-cover bg-center sm:min-h-64"
          style={{
            backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / 0.14), rgb(0 0 0 / 0.88)), radial-gradient(circle at 70% 10%, rgb(229 9 20 / 0.38), transparent 34%), url(${movie.backdropUrl})`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full border border-white/10 bg-cine-black/70 px-3 py-2 text-sm font-semibold text-cine-text-primary backdrop-blur transition hover:bg-cine-red"
          >
            Close
          </button>
        </div>

        <div className="-mt-16 max-h-[calc(90dvh-6rem)] overflow-y-auto px-4 pb-5 safe-bottom sm:px-6">
          <div className="grid gap-5 sm:grid-cols-[9rem_1fr] sm:items-end">
            <div
              className="aspect-[2/3] w-32 rounded-lg border border-white/15 bg-cine-card bg-cover bg-center shadow-2xl shadow-black/70 sm:w-36"
              style={{
                backgroundImage: `linear-gradient(180deg, transparent 35%, rgb(0 0 0 / 0.72)), url(${movie.posterUrl})`,
              }}
              aria-label={`${movie.title} poster`}
            />

            <div className="space-y-3">
              <h2
                id="movie-details-title"
                className="font-anton text-5xl leading-none text-cine-text-primary sm:text-6xl"
              >
                {movie.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {[movie.genre, movie.language, movie.runtime, movie.rating].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cine-red/35 bg-cine-red/10 px-3 py-1 text-xs font-semibold text-cine-text-secondary"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-anton text-2xl text-cine-text-primary">
                Summary
              </h3>
              <p className="mt-2 text-sm leading-7 text-cine-text-secondary sm:text-base">
                {movie.summary}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-cine-elevated/70 p-4">
              <h3 className="font-anton text-2xl text-cine-text-primary">
                Why screen this?
              </h3>
              <p className="mt-2 text-sm leading-7 text-cine-text-secondary sm:text-base">
                {movie.whyScreen}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CinematicButton
                className="w-full"
                onClick={() => onVote(movie)}
              >
                Vote for this movie
              </CinematicButton>
              <CinematicButton
                variant="secondary"
                className="w-full"
                onClick={onClose}
              >
                Back to movies
              </CinematicButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
