"use client";

import { useEffect, useState } from "react";
import { movies } from "@/data/movies";
import type { Movie, UserProfile, Vote } from "@/types";
import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";
import { MovieCard } from "@/components/movies/MovieCard";
import { MovieDetailsSheet } from "@/components/movies/MovieDetailsSheet";
import { VoteConfirmModal } from "@/components/movies/VoteConfirmModal";
import { VoteSuccessCard } from "@/components/movies/VoteSuccessCard";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { ensureDeviceId } from "@/lib/device";
import {
  getStoredProfile,
  getStoredVote,
  saveProfile,
  saveVote,
} from "@/lib/storage";

export default function MoviesPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [pendingVoteMovie, setPendingVoteMovie] = useState<Movie | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [storedVote, setStoredVote] = useState<Vote | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const nextDeviceId = ensureDeviceId();
      setDeviceId(nextDeviceId);

      const storedProfile = getStoredProfile();
      const existingVote = getStoredVote();

      if (existingVote) {
        setStoredVote(existingVote);
        setVoteMessage("You have already voted from this browser.");
      }

      if (storedProfile) {
        setProfile(storedProfile);
        return;
      }

      setShowOnboarding(true);
    });
  }, []);

  function handleVote(movie: Movie) {
    if (storedVote) {
      setVoteMessage("You have already voted from this browser.");
      return;
    }

    if (!profile) {
      setVoteMessage("Complete onboarding before voting.");
      setShowOnboarding(true);
      return;
    }

    setPendingVoteMovie(movie);
  }

  function handleOnboardingComplete(nextProfile: UserProfile) {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    setShowOnboarding(false);
    setVoteMessage("Profile saved. You can vote now.");
  }

  function handleConfirmVote(movie: Movie) {
    if (storedVote) {
      setPendingVoteMovie(null);
      setVoteMessage("You have already voted from this browser.");
      return;
    }

    const nextDeviceId = deviceId ?? ensureDeviceId();
    const vote: Vote = {
      movieId: movie.id,
      deviceId: nextDeviceId,
      votedAt: new Date().toISOString(),
    };

    saveVote(vote);
    setDeviceId(nextDeviceId);
    setStoredVote(vote);
    setSelectedMovie(null);
    setPendingVoteMovie(null);
    setVoteMessage(`Vote recorded for ${movie.title}`);
  }

  const votedMovie = storedVote
    ? movies.find((movie) => movie.id === storedVote.movieId) ?? null
    : null;
  const hasVoted = Boolean(storedVote);

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
            {voteMessage ? (
              <p className="rounded-full border border-cine-red/40 bg-cine-red/10 px-4 py-2 text-sm font-semibold text-cine-text-primary shadow-red-glow-sm">
                {voteMessage}
              </p>
            ) : null}
          </div>
          {profile ? (
            <p className="text-sm text-cine-text-muted">
              Voting as{" "}
              <span className="font-semibold text-cine-text-secondary">
                {profile.name}
              </span>{" "}
              • {profile.yearOfStudy} • {profile.department}
            </p>
          ) : (
            <p className="text-sm text-cine-text-muted">
              Complete onboarding to unlock voting.
            </p>
          )}
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              hasVoted={hasVoted}
              onDetails={setSelectedMovie}
              onVote={handleVote}
            />
          ))}
        </div>

        {votedMovie ? <VoteSuccessCard movie={votedMovie} /> : null}
      </section>

      <MovieDetailsSheet
        movie={selectedMovie}
        hasVoted={hasVoted}
        onClose={() => setSelectedMovie(null)}
        onVote={handleVote}
      />
      <VoteConfirmModal
        movie={pendingVoteMovie}
        onCancel={() => setPendingVoteMovie(null)}
        onConfirm={handleConfirmVote}
      />
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </main>
  );
}
