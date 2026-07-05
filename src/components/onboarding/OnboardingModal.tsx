"use client";

import { useState } from "react";
import type { Department, UserProfile, YearOfStudy } from "@/types";
import { CinematicButton } from "@/components/ui/CinematicButton";

const departments: Department[] = [
  "CSE",
  "ECE",
  "CSE(AI)",
  "ER",
  "CIVIL",
  "MECH",
  "EEE",
  "CHEM",
];

const years: YearOfStudy[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

type OnboardingModalProps = {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
};

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>("1st Year");
  const [department, setDepartment] = useState<Department>("CSE");

  if (!isOpen) {
    return null;
  }

  const trimmedName = name.trim();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-cine-black/78 px-3 pb-4 backdrop-blur-sm sm:items-center sm:px-5 sm:pb-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <form
        className="glass-card red-trace-border mx-auto w-full max-w-lg space-y-6 rounded-t-2xl p-5 shadow-2xl shadow-black/80 safe-bottom sm:space-y-5 sm:rounded-2xl sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();

          if (!trimmedName) {
            return;
          }

          onComplete({
            name: trimmedName,
            yearOfStudy,
            department,
          });
        }}
      >
        <div className="space-y-3 sm:space-y-2">
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            One-time setup
          </p>
          <h2
            id="onboarding-title"
            className="font-anton text-4xl leading-none text-cine-text-primary"
          >
            Tell us who is voting
          </h2>
          <p className="text-sm leading-6 text-cine-text-secondary">
            Complete this before voting so the screening poll can track student
            turnout locally on this device.
          </p>
        </div>

        <label className="block space-y-3 sm:space-y-2">
          <span className="text-sm font-semibold text-cine-text-primary">
            Name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            required
            className="min-h-12 w-full rounded-lg border border-white/10 bg-cine-black/70 px-4 text-base text-cine-text-primary outline-none transition placeholder:text-cine-text-muted focus:border-cine-red focus:shadow-red-glow-sm"
          />
        </label>

        <label className="block space-y-3 sm:space-y-2">
          <span className="text-sm font-semibold text-cine-text-primary">
            Year of Study
          </span>
          <select
            value={yearOfStudy}
            onChange={(event) =>
              setYearOfStudy(event.target.value as YearOfStudy)
            }
            className="min-h-12 w-full rounded-lg border border-white/10 bg-cine-black/70 px-4 text-base text-cine-text-primary outline-none transition focus:border-cine-red focus:shadow-red-glow-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-3 sm:space-y-2">
          <span className="text-sm font-semibold text-cine-text-primary">
            Department
          </span>
          <select
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value as Department)
            }
            className="min-h-12 w-full rounded-lg border border-white/10 bg-cine-black/70 px-4 text-base text-cine-text-primary outline-none transition focus:border-cine-red focus:shadow-red-glow-sm"
          >
            {departments.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <CinematicButton
          className="min-h-12 w-full"
          type="submit"
          disabled={!trimmedName}
        >
          Continue to voting
        </CinematicButton>
      </form>
    </div>
  );
}
