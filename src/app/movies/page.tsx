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

const ALREADY_VOTED_MESSAGE = "You have already voted.";

export default function MoviesPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [pendingVoteMovie, setPendingVoteMovie] = useState<Movie | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [storedVote, setStoredVote] = useState<Vote | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const nextDeviceId = ensureDeviceId();
      setDeviceId(nextDeviceId);

      const storedProfile = getStoredProfile();
      const existingVote = getStoredVote();

      if (existingVote) {
        setStoredVote(existingVote);
        setVoteMessage(ALREADY_VOTED_MESSAGE);
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
      setVoteMessage(ALREADY_VOTED_MESSAGE);
      return;
    }

    if (!profile) {
      setVoteMessage("Complete onboarding before voting.");
      setShowOnboarding(true);
      return;
    }

    setPendingVoteMovie(movie);
    setSelectedMovie(null);
    setVoteError(null);
  }

  function handleOnboardingComplete(nextProfile: UserProfile) {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    setShowOnboarding(false);
    setVoteMessage("Profile saved. You can vote now.");
  }

  async function handleConfirmVote(movie: Movie) {
    if (storedVote) {
      setPendingVoteMovie(null);
      setVoteMessage(ALREADY_VOTED_MESSAGE);
      return;
    }

    if (!profile) {
      setVoteError("Complete onboarding before voting.");
      setShowOnboarding(true);
      return;
    }

    const nextDeviceId = deviceId ?? ensureDeviceId();
    setIsSubmittingVote(true);
    setVoteError(null);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: nextDeviceId,
          movieId: movie.id,
          profile: {
            name: profile.name,
            year: profile.yearOfStudy,
            department: profile.department,
          },
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        supabase?: {
          code?: string;
          message?: string;
          details?: string;
          hint?: string;
        } | null;
        vote?: Vote;
        movie?: Movie | null;
      };

      if (response.ok && result.vote) {
        saveVote(result.vote);
        setDeviceId(nextDeviceId);
        setStoredVote(result.vote);
        setSelectedMovie(null);
        setPendingVoteMovie(null);
        setVoteMessage(`Vote recorded for ${movie.title}`);
        return;
      }

      if (response.status === 403) {
        setVoteError("Voting is currently closed.");
        setVoteMessage("Voting is currently closed.");
        return;
      }

      if (response.status === 409) {
        if (result.vote) {
          saveVote(result.vote);
          setStoredVote(result.vote);
        }

        setPendingVoteMovie(null);
        setVoteMessage(ALREADY_VOTED_MESSAGE);
        return;
      }

      setVoteError(formatVoteError(result));
    } catch {
      setVoteError("Could not reach the voting server. Try again.");
    } finally {
      setIsSubmittingVote(false);
    }
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
        errorMessage={voteError}
        isSubmitting={isSubmittingVote}
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

function formatVoteError(result: {
  error?: string;
  supabase?: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
}) {
  const message =
    result.supabase?.message ?? result.error ?? "Could not record your vote.";
  const hint = result.supabase?.hint ?? result.supabase?.details;

  return hint ? `${message} ${hint}` : message;
}
