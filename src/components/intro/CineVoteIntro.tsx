"use client";

import { useEffect, useMemo, useState } from "react";
import { introPosters } from "@/data/introPosters";

const INTRO_SEEN_KEY = "CINEVOTE_INTRO_SEEN";
const INTRO_DURATION_MS = 4000;
const REDUCED_MOTION_DURATION_MS = 850;
const ALWAYS_SHOW_INTRO = true;
const INTRO_ROWS = 5;
const POSTERS_PER_ROW = 10;
const MOBILE_POSTERS_PER_ROW = 8;

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "true");
  } catch {
    // Storage may be unavailable in private or restricted contexts.
  }
}

function hasSeenIntro() {
  if (ALWAYS_SHOW_INTRO) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function CineVoteIntro() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [tunnelCleared, setTunnelCleared] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobileIntro, setMobileIntro] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const rows = useMemo(
    () => {
      const postersPerRow = mobileIntro
        ? MOBILE_POSTERS_PER_ROW
        : POSTERS_PER_ROW;

      return Array.from({ length: INTRO_ROWS }, (_, rowIndex) =>
        Array.from({ length: postersPerRow }, (_, posterIndex) => ({
          src: introPosters[
            (rowIndex * postersPerRow + posterIndex) % introPosters.length
          ],
          id: `${rowIndex}-${posterIndex}`,
          emphasis: (rowIndex + posterIndex) % 3,
        })),
      );
    },
    [mobileIntro],
  );

  useEffect(() => {
    if (hasSeenIntro()) {
      const hideTimer = window.setTimeout(() => setVisible(false), 0);

      return () => window.clearTimeout(hideTimer);
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const prefersMobileIntro = window.matchMedia(
      "(max-width: 640px), (pointer: coarse)",
    ).matches;

    const clearAt = prefersMobileIntro ? 3200 : 2860;
    const logoAt = prefersMobileIntro ? 3360 : 3100;
    const exitAt = prefersMobileIntro ? 3760 : 3740;
    const doneAt = prefersMobileIntro ? 4050 : INTRO_DURATION_MS;
    const timers = prefersReducedMotion
      ? [
          window.setTimeout(() => {
            setReducedMotion(prefersReducedMotion);
            setMobileIntro(prefersMobileIntro);
          }, 0),
          window.setTimeout(() => setExiting(true), 620),
          window.setTimeout(() => {
            markIntroSeen();
            setVisible(false);
          }, REDUCED_MOTION_DURATION_MS),
        ]
      : [
          window.setTimeout(() => {
            setReducedMotion(prefersReducedMotion);
            setMobileIntro(prefersMobileIntro);
          }, 0),
          window.setTimeout(() => setTunnelCleared(true), clearAt),
          window.setTimeout(() => setLogoVisible(true), logoAt),
          window.setTimeout(() => setExiting(true), exitAt),
          window.setTimeout(() => {
            markIntroSeen();
            setVisible(false);
          }, doneAt),
        ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`cine-intro fixed inset-0 z-[120] overflow-hidden bg-black text-white ${
        exiting ? "cine-intro--exit" : ""
      } ${tunnelCleared ? "cine-intro--tunnel-cleared" : ""} ${
        reducedMotion ? "cine-intro--reduced" : ""
      } ${mobileIntro ? "cine-intro--mobile" : ""}`}
      aria-label="CineVote intro"
      role="dialog"
      aria-modal="true"
    >
      {!reducedMotion ? (
        <div className="cine-intro__scene">
          <div className="cine-intro__red-glow" aria-hidden="true" />
          <div className="cine-intro__wall" aria-hidden="true">
            {rows.map((row, rowIndex) => (
              <div
                className="cine-intro__poster-row"
                key={rowIndex}
                style={
                  {
                    "--intro-row-y": `${(rowIndex - 2) * 17}vh`,
                    "--intro-row-shift": `${rowIndex % 2 === 0 ? -10 : 10}vw`,
                    "--intro-row-scale": `${1 + Math.abs(rowIndex - 2) * 0.08}`,
                  } as React.CSSProperties
                }
              >
                <div className="cine-intro__poster-track">
                  {row.map((poster) => (
                    <div
                      className="cine-intro__poster"
                      data-emphasis={poster.emphasis}
                      key={poster.id}
                    >
                      {!failedImages[poster.id] ? (
                        <img
                          alt=""
                          decoding="async"
                          draggable={false}
                          fetchPriority={rowIndex < 2 ? "high" : "auto"}
                          loading={rowIndex < 2 ? "eager" : "lazy"}
                          src={poster.src}
                          onError={() =>
                            setFailedImages((current) => ({
                              ...current,
                              [poster.id]: true,
                            }))
                          }
                        />
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="cine-intro__shade" aria-hidden="true" />
          <div className="cine-intro__grain" aria-hidden="true" />
        </div>
      ) : null}

      <div
        className={`cine-intro__brand ${
          logoVisible || reducedMotion ? "cine-intro__brand--visible" : ""
        }`}
      >
        <p className="cine-intro__logo">CINEVOTE</p>
        <p className="cine-intro__subtitle">CHOOSE THE MOVIE. OWN THE NIGHT.</p>
      </div>
    </div>
  );
}
