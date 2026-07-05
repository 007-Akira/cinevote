"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CinematicButton } from "@/components/ui/CinematicButton";
import { FilmGrain } from "@/components/layout/FilmGrain";
import { TopBar } from "@/components/layout/TopBar";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not sign in.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Could not sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden safe-bottom-lg">
      <FilmGrain />
      <TopBar />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_5%,rgb(229_9_20_/_0.24),transparent_24rem),radial-gradient(circle_at_95%_38%,rgb(233_188_182_/_0.09),transparent_20rem)]"
      />

      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl place-items-center px-4 py-10 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="glass-card red-trace-border w-full max-w-md rounded-lg p-5 shadow-glass sm:p-7"
        >
          <p className="w-fit rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold uppercase text-cine-text-secondary">
            Organizer access
          </p>
          <h1 className="mt-4 font-anton text-5xl leading-none text-cine-text-primary sm:text-6xl">
            Admin
          </h1>
          <p className="mt-3 text-sm leading-6 text-cine-text-secondary">
            Sign in to monitor voting, export results, and control the poll.
          </p>

          <label
            htmlFor="admin-password"
            className="mt-7 block text-sm font-semibold text-cine-text-primary"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-black/45 px-4 text-base text-cine-text-primary outline-none transition placeholder:text-cine-text-muted focus:border-cine-red/70 focus:ring-2 focus:ring-cine-red/25"
            required
          />

          {error ? (
            <p className="mt-4 rounded-lg border border-cine-red/40 bg-cine-red/10 px-3 py-2 text-sm font-medium text-cine-text-secondary">
              {error}
            </p>
          ) : null}

          <CinematicButton
            type="submit"
            className="mt-6 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </CinematicButton>
        </form>
      </section>
    </main>
  );
}
