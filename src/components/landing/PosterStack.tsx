"use client";

import { useEffect, useMemo, useState } from "react";
import { movies } from "@/data/movies";
import type { Movie } from "@/types";

const fallbackMovies: Movie[] = [
  {
    id: "fallback-1",
    title: "CineVote",
    language: "Cinema",
    genre: "Screening",
    runtime: "TBA",
    rating: "Vote",
    hook: "The student pick takes the big screen.",
    summary: "The student pick takes the big screen.",
    whyScreen: "Built for a packed room and a loud vote.",
    posterUrl: "/movies/movie-1.jpg",
    backdropUrl: "/movies/movie-1.jpg",
  },
  {
    id: "fallback-2",
    title: "Movie Night",
    language: "Cinema",
    genre: "Campus",
    runtime: "TBA",
    rating: "Live",
    hook: "A campus screening shaped by student votes.",
    summary: "A campus screening shaped by student votes.",
    whyScreen: "The room decides what plays next.",
    posterUrl: "/movies/movie-2.jpg",
    backdropUrl: "/movies/movie-2.jpg",
  },
  {
    id: "fallback-3",
    title: "Final Pick",
    language: "Cinema",
    genre: "Vote",
    runtime: "TBA",
    rating: "Soon",
    hook: "One poll, one screen, one winning film.",
    summary: "One poll, one screen, one winning film.",
    whyScreen: "Every vote pushes a poster closer to the center.",
    posterUrl: "/movies/movie-3.jpg",
    backdropUrl: "/movies/movie-3.jpg",
  },
];

const cardStyles = [
  {
    widthClass: "w-44 sm:w-56",
    zIndex: 40,
    opacity: 1,
    transform: "translateX(-50%) translateY(0) rotate(-2deg) scale(1.04)",
    shadowClass: "shadow-red-glow-sm",
    label: "Center pick",
  },
  {
    widthClass: "w-40 sm:w-52",
    zIndex: 30,
    opacity: 0.85,
    transform: "translateX(calc(-50% + 4.25rem)) translateY(2.5rem) rotate(7deg) scale(0.95)",
    shadowClass: "",
    label: "Next pick",
  },
  {
    widthClass: "w-40 sm:w-52",
    zIndex: 20,
    opacity: 0.8,
    transform: "translateX(calc(-50% - 4.25rem)) translateY(3rem) rotate(-8deg) scale(0.94)",
    shadowClass: "",
    label: "Previous pick",
  },
  {
    widthClass: "w-36 sm:w-44",
    zIndex: 10,
    opacity: 0.65,
    transform: "translateX(calc(-50% + 1.5rem)) translateY(6rem) rotate(3deg) scale(0.88)",
    shadowClass: "",
    label: "Queue pick",
  },
];

export function PosterStack() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [clientReady, setClientReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const featuredMovies = useMemo(() => getFeaturedMovies(), []);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => setClientReady(true), 0);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleMotionPreferenceChange() {
      setPrefersReducedMotion(mediaQuery.matches);
    }

    handleMotionPreferenceChange();
    mediaQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      window.clearTimeout(readyTimer);
      mediaQuery.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % featuredMovies.length);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [featuredMovies.length, prefersReducedMotion]);

  return (
    <div
      className={`poster-stack relative mx-auto h-[26rem] w-full max-w-xs sm:h-[31rem] sm:max-w-sm lg:mx-0 ${
        clientReady ? "poster-stack--ready" : ""
      }`}
    >
      <div className="absolute inset-x-6 bottom-2 h-20 rounded-full bg-cine-red/30 blur-3xl" />
      {featuredMovies.map((movie, index) => {
        const position = (index - activeIndex + featuredMovies.length) % featuredMovies.length;
        const cardStyle = cardStyles[position];

        return (
        <article
          key={movie.id}
          className={`poster-stack__card absolute left-1/2 top-6 flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-lg border border-white/15 bg-cine-card bg-cover bg-center p-4 shadow-2xl shadow-black/70 transition-all duration-700 ease-out motion-reduce:transition-none ${cardStyle.widthClass} ${cardStyle.shadowClass}`}
          style={{
            "--poster-card-index": index,
            zIndex: cardStyle.zIndex,
            opacity: cardStyle.opacity,
            transform: cardStyle.transform,
            backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`,
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgb(255_255_255_/_0.2),transparent_34%)]" />
          {position === 0 ? (
            <div className="absolute inset-0 border border-cine-red/50 shadow-[inset_0_0_32px_rgb(229_9_20_/_0.22)]" />
          ) : null}
          <div className="relative flex items-center justify-between text-[0.65rem] font-bold uppercase text-cine-text-secondary">
            <span>CINEVOTE</span>
            <span>{movie.genre}</span>
          </div>
          <div className="relative">
            <p className="text-xs uppercase text-cine-text-muted">
              {cardStyle.label}
            </p>
            <h2 className="mt-1 font-anton text-3xl leading-none text-cine-text-primary">
              {movie.title}
            </h2>
          </div>
        </article>
        );
      })}
    </div>
  );
}

function getFeaturedMovies() {
  const sourceMovies =
    movies.length >= 3 ? movies : [...movies, ...fallbackMovies];

  return Array.from({ length: 4 }, (_, index) => {
    return sourceMovies[index % sourceMovies.length] ?? fallbackMovies[index];
  });
}
