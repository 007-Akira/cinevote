"use client";

import { useEffect, useState } from "react";

type PollStatus = {
  isOpen: boolean;
  eventStatus: string;
  pollStartsAt: string | null;
  pollClosesAt: string | null;
  eventDate: string | null;
  serverNow: string;
};

export function PollCountdown() {
  const [pollStatus, setPollStatus] = useState<PollStatus | null>(null);
  const [hasStatusError, setHasStatusError] = useState(false);
  const [browserNow, setBrowserNow] = useState(() => Date.now());
  const [statusReceivedAt, setStatusReceivedAt] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;

    async function loadPollStatus() {
      try {
        const response = await fetch("/api/poll/status", { cache: "no-store" });
        const payload = (await response.json()) as PollStatus | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload ? payload.error : "Could not load poll status.",
          );
        }

        if (isMounted) {
          const receivedAt = Date.now();
          setPollStatus(payload as PollStatus);
          setStatusReceivedAt(receivedAt);
          setBrowserNow(receivedAt);
        }
      } catch {
        if (isMounted) {
          setHasStatusError(true);
        }
      }
    }

    void loadPollStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      !pollStatus?.isOpen ||
      !pollStatus.pollStartsAt ||
      !pollStatus.pollClosesAt
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setBrowserNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pollStatus]);

  const countdownState = getCountdownState({
    pollStatus,
    hasStatusError,
    serverNow: getSyncedServerNow(pollStatus, browserNow, statusReceivedAt),
  });

  return (
    <section
      className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center overflow-hidden px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20"
      id="PollCountdown"
    >
      <div
        aria-hidden="true"
        className="absolute -top-36 left-1/2 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-cine-red/10 blur-[110px]"
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-8 bg-cine-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cine-red">
              {countdownState.statusLabel}
            </span>
            <span className="h-px w-8 bg-cine-red" />
          </div>
          <h2 className="text-center font-anton text-4xl uppercase leading-none text-white sm:text-5xl">
            {countdownState.title}
          </h2>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-0 h-px animate-pulse bg-cine-red shadow-red-glow"
        />

        {countdownState.timeRemaining ? (
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            <TimeBox
              value={countdownState.timeRemaining.days}
              label="Days"
              delay="0s"
            />
            <TimeBox
              value={countdownState.timeRemaining.hours}
              label="Hours"
              delay="1s"
            />
            <TimeBox
              value={countdownState.timeRemaining.mins}
              label="Mins"
              delay="2s"
            />
            <TimeBox
              value={countdownState.timeRemaining.secs}
              label="Secs"
              delay="3s"
            />
          </div>
        ) : (
          <div className="relative w-full overflow-hidden border border-cine-red/25 bg-cine-card/70 px-4 py-7 text-center shadow-[0_0_36px_rgb(229_9_20_/_0.16)] backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px animate-[hud-scan_4s_linear_infinite] bg-gradient-to-r from-transparent via-cine-red to-transparent opacity-30"
            />
            <p className="font-anton text-4xl uppercase leading-none text-cine-red drop-shadow-[0_0_18px_rgb(229_9_20_/_0.68)] sm:text-5xl">
              {countdownState.message}
            </p>
            <CornerAccents />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cine-red/30 to-transparent"
        />
      </div>
    </section>
  );
}

function TimeBox({
  value,
  label,
  delay,
}: {
  value: number;
  label: string;
  delay: string;
}) {
  return (
    <div className="group relative flex min-h-36 flex-col items-center justify-center overflow-hidden border border-cine-red/25 bg-cine-card/70 p-6 shadow-[0_0_28px_rgb(229_9_20_/_0.12)] backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px animate-[hud-scan_4s_linear_infinite] bg-gradient-to-r from-transparent via-cine-red to-transparent opacity-20"
        style={{ animationDelay: delay }}
      />
      <span className="font-anton text-6xl leading-none text-cine-red drop-shadow-[0_0_10px_rgb(229_9_20_/_0.8)] transition duration-500 group-hover:brightness-125 group-hover:drop-shadow-[0_0_20px_rgb(229_9_20_/_0.9)] sm:text-7xl">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="mt-2 text-sm font-semibold uppercase tracking-widest text-cine-text-secondary">
        {label}
      </span>
      <CornerAccents />
    </div>
  );
}

function CornerAccents() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 size-2 border-l border-t border-cine-red/40"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 right-0 size-2 border-b border-r border-cine-red/40"
      />
    </>
  );
}

function getSyncedServerNow(
  pollStatus: PollStatus | null,
  browserNow: number,
  statusReceivedAt: number,
) {
  if (!pollStatus) {
    return browserNow;
  }

  const serverNow = new Date(pollStatus.serverNow).getTime();

  if (!Number.isFinite(serverNow)) {
    return browserNow;
  }

  return serverNow + (browserNow - statusReceivedAt);
}

function getCountdownState({
  pollStatus,
  hasStatusError,
  serverNow,
}: {
  pollStatus: PollStatus | null;
  hasStatusError: boolean;
  serverNow: number;
}) {
  if (hasStatusError) {
    return getMessageState(
      "POLL SCHEDULE",
      "Poll schedule coming soon.",
      "Status: Awaiting Sync",
    );
  }

  if (!pollStatus) {
    return getMessageState(
      "POLL SCHEDULE",
      "Loading countdown...",
      "Status: Syncing",
    );
  }

  if (!pollStatus.isOpen) {
    return getMessageState("POLL CLOSED", "Poll Closed", "Status: Closed");
  }

  if (!pollStatus.pollStartsAt || !pollStatus.pollClosesAt) {
    return getMessageState(
      "POLL SCHEDULE",
      "Poll schedule coming soon.",
      "Status: Awaiting Sync",
    );
  }

  const startsAt = new Date(pollStatus.pollStartsAt).getTime();
  const closesAt = new Date(pollStatus.pollClosesAt).getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(closesAt)) {
    return getMessageState(
      "POLL SCHEDULE",
      "Poll schedule coming soon.",
      "Status: Awaiting Sync",
    );
  }

  if (serverNow < startsAt) {
    return {
      title: "POLL STARTS IN",
      message: "",
      statusLabel: "Status: Standby",
      timeRemaining: getTimeRemaining(startsAt, serverNow),
    };
  }

  if (serverNow < closesAt) {
    return {
      title: "POLL CLOSES IN",
      message: "",
      statusLabel: "Status: Final Phase",
      timeRemaining: getTimeRemaining(closesAt, serverNow),
    };
  }

  return {
    title: "POLL CLOSED",
    message: "Poll Closed",
    statusLabel: "Status: Closed",
    timeRemaining: null,
  };
}

function getMessageState(title: string, message: string, statusLabel: string) {
  return {
    title,
    message,
    statusLabel,
    timeRemaining: null,
  };
}

function getTimeRemaining(targetTime: number, now: number) {
  const remainingMs = Math.max(0, targetTime - now);

  if (remainingMs === 0) {
    return null;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return { days, hours, mins, secs };
}
