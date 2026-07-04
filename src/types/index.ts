export type Movie = {
  id: string;
  title: string;
  language: string;
  genre: string;
  runtime: string;
  rating: string;
  hook: string;
  summary: string;
  whyScreen: string;
  posterUrl: string;
  backdropUrl: string;
};

export type Department =
  | "CSE"
  | "ECE"
  | "EEE"
  | "ME"
  | "CE"
  | "AI/DS"
  | "MCA"
  | "Other";

export type YearOfStudy = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";

export type UserProfile = {
  name: string;
  yearOfStudy: YearOfStudy;
  department: Department;
};

export type Vote = {
  movieId: string;
  deviceId: string;
  votedAt: string;
};
