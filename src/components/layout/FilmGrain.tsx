export function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.075] mix-blend-screen"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.42) 0 1px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.28) 0 1px, transparent 1px)",
        backgroundSize: "4px 4px, 7px 7px",
      }}
    />
  );
}
