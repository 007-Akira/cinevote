import type { Movie } from "@/types";

export const movies: Movie[] = [
  {
    id: "movie-1",
    title: "Interstellar",
    language: "English",
    genre: "Sci-Fi",
    runtime: "169 min",
    rating: "8.7",
    hook: "A massive space journey built for a dark hall, big sound, and full attention.",
    summary:
      "A team of explorers travels through a wormhole in search of a new home for humanity as time, memory, and sacrifice collide.",
    whyScreen:
      "It works beautifully for a college screening because the visuals, score, and emotional scale feel much bigger with a crowd.",
    posterUrl: "/movies/movie-1.jpg",
    backdropUrl: "/movies/movie-1-backdrop.jpg",
  },
  {
    id: "movie-2",
    title: "The Dark Knight",
    language: "English",
    genre: "Action Thriller",
    runtime: "152 min",
    rating: "9.0",
    hook: "A tense, crowd-pleasing superhero thriller with iconic moments from start to finish.",
    summary:
      "Batman faces a criminal mastermind who pushes Gotham into chaos and forces its heroes to make impossible choices.",
    whyScreen:
      "The action, performances, and sharp moral stakes make it an easy pick for a high-energy student audience.",
    posterUrl: "/movies/movie-2.jpg",
    backdropUrl: "/movies/movie-2-backdrop.jpg",
  },
  {
    id: "movie-3",
    title: "3 Idiots",
    language: "Hindi",
    genre: "Comedy Drama",
    runtime: "170 min",
    rating: "8.4",
    hook: "A funny, emotional campus story that still hits close to home for students.",
    summary:
      "Three engineering students navigate friendship, pressure, and ambition while questioning what success should really mean.",
    whyScreen:
      "It is relatable, quotable, and ideal for a mixed crowd because it balances comedy with a strong student-life message.",
    posterUrl: "/movies/movie-3.jpg",
    backdropUrl: "/movies/movie-3-backdrop.jpg",
  },
  {
    id: "movie-4",
    title: "Inception",
    language: "English",
    genre: "Sci-Fi Thriller",
    runtime: "148 min",
    rating: "8.8",
    hook: "A sleek mind-bending thriller that gives the audience plenty to debate after the credits.",
    summary:
      "A skilled thief enters dreams to steal secrets, then takes on a dangerous mission to plant an idea instead.",
    whyScreen:
      "Its puzzles, set pieces, and soundtrack make it a strong big-screen option with a lot of post-movie conversation value.",
    posterUrl: "/movies/movie-4.jpg",
    backdropUrl: "/movies/movie-4-backdrop.jpg",
  },
];
