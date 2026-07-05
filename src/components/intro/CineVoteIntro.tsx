"use client";

import { useEffect, useMemo, useState } from "react";
import { introPosters } from "@/data/introPosters";

const INTRO_SEEN_KEY = "CINEVOTE_INTRO_SEEN";
const INTRO_DURATION_MS = 4200;
const FADE_DURATION_MS = 260;
const REDUCED_MOTION_DURATION_MS = 850;
const ALWAYS_SHOW_INTRO = true;
const INTRO_COLUMNS = 4;

const rotationPattern = [-8, 5, -3, 8, 6, -5, 4, -7, -4, 7, -6, 5];
const shiftPattern = [-32, 10, 34, -12, 22, -18, 12, 28, -12, 18, -20, 8];

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
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [backgroundFading, setBackgroundFading] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const tiles = useMemo(
    () =>
      introPosters.map((src, index) => ({
        src,
        row: Math.floor(index / INTRO_COLUMNS),
        col: index % INTRO_COLUMNS,
        rotate: rotationPattern[index % rotationPattern.length],
        shift: shiftPattern[index % shiftPattern.length],
      })),
    [],
  );
  const rowIndexes = useMemo(
    () => Array.from(new Set(tiles.map((tile) => tile.row))),
    [tiles],
  );

  useEffect(() => {
    if (hasSeenIntro()) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setReducedMotion(prefersReducedMotion);
    setVisible(true);

    const timers = prefersReducedMotion
      ? [
          window.setTimeout(() => setExiting(true), 620),
          window.setTimeout(() => {
            markIntroSeen();
            setVisible(false);
          }, REDUCED_MOTION_DURATION_MS),
        ]
      : [
          window.setTimeout(() => setLogoVisible(true), 2300),
          window.setTimeout(() => setBackgroundFading(true), 2820),
          window.setTimeout(() => setExiting(true), 3940),
          window.setTimeout(() => {
            markIntroSeen();
            setVisible(false);
          }, INTRO_DURATION_MS),
        ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  if (!visible) {
    return null;
  }

  const skipIntro = () => {
    markIntroSeen();
    setExiting(true);
    window.setTimeout(() => setVisible(false), FADE_DURATION_MS);
  };

  return (
    <div
      className={`cine-intro fixed inset-0 z-[120] overflow-hidden bg-black text-white ${
        exiting ? "cine-intro--exit" : ""
      } ${backgroundFading ? "cine-intro--background-fade" : ""} ${
        reducedMotion ? "cine-intro--reduced" : ""
      }`}
      aria-label="CineVote intro"
      role="dialog"
      aria-modal="true"
    >
      {!reducedMotion ? (
        <div className="cine-intro__scene">
          <div className="cine-intro__red-glow" aria-hidden="true" />
          <div className="cine-intro__wall" aria-hidden="true">
            {rowIndexes.map((row) => (
              <div
                className="cine-intro__row"
                data-row={row}
                key={row}
                style={
                  {
                    "--row-y": `${
                      (row - (rowIndexes.length - 1) / 2) * 17
                    }vh`,
                    "--row-x": `${row % 2 === 0 ? -8 : 8}vw`,
                    "--row-delay": `${row * 28}ms`,
                  } as React.CSSProperties
                }
              >
                {tiles
                  .filter((tile) => tile.row === row)
                  .map((tile, index) => {
                    const tileIndex = index + row * INTRO_COLUMNS;

                    return (
                      <div
                        className="cine-intro__poster"
                        key={tile.src}
                        style={
                          {
                            "--poster-rotate": `${tile.rotate}deg`,
                            "--poster-shift": `${tile.shift}px`,
                            "--poster-start-x": `${
                              (1.5 - tile.col) * 54
                            }px`,
                            "--poster-start-y": `${
                              ((rowIndexes.length - 1) / 2 - tile.row) * 32
                            }px`,
                            "--poster-delay": `${row * 38 + index * 30}ms`,
                          } as React.CSSProperties
                        }
                      >
                        {!failedImages[tileIndex] ? (
                          <img
                            alt=""
                            draggable={false}
                            src={tile.src}
                            onError={() =>
                              setFailedImages((current) => ({
                                ...current,
                                [tileIndex]: true,
                              }))
                            }
                          />
                        ) : (
                          <span aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
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

      <button className="cine-intro__skip" type="button" onClick={skipIntro}>
        Skip
      </button>
    </div>
  );
}
