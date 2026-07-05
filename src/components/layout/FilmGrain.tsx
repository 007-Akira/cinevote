export function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.13] mix-blend-screen sm:opacity-[0.075]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0 1px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.34) 0 1px, transparent 1px), linear-gradient(115deg, transparent 0 48%, rgba(255,255,255,0.16) 49% 50%, transparent 51% 100%)",
        backgroundSize: "4px 4px, 7px 7px, 13px 13px",
      }}
    />
  );
}
