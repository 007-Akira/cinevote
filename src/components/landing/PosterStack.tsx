const posters = [
  {
    title: "Interstellar",
    meta: "Sci-Fi",
    className: "rotate-[-8deg] bg-[linear-gradient(160deg,#2a0508,#e50914_46%,#070707)]",
  },
  {
    title: "The Dark Knight",
    meta: "Action",
    className:
      "translate-x-10 translate-y-8 rotate-[6deg] bg-[linear-gradient(160deg,#030303,#111113_44%,#7f050c)]",
  },
  {
    title: "Whiplash",
    meta: "Drama",
    className:
      "-translate-x-5 translate-y-16 rotate-[-2deg] bg-[linear-gradient(160deg,#13090a,#4d0509_48%,#e9bcb6)]",
  },
];

export function PosterStack() {
  return (
    <div className="relative mx-auto h-[23rem] w-full max-w-xs sm:h-[28rem] sm:max-w-sm lg:mx-0">
      <div className="absolute inset-x-6 bottom-2 h-20 rounded-full bg-cine-red/30 blur-3xl" />
      {posters.map((poster, index) => (
        <article
          key={poster.title}
          className={`absolute left-1/2 top-8 flex aspect-[2/3] w-44 -translate-x-1/2 flex-col justify-between overflow-hidden rounded-lg border border-white/15 p-4 shadow-2xl shadow-black/70 sm:w-56 ${poster.className}`}
          style={{ zIndex: posters.length - index }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgb(255_255_255_/_0.25),transparent_35%),linear-gradient(180deg,transparent,rgb(0_0_0_/_0.76))]" />
          <div className="relative flex items-center justify-between text-[0.65rem] font-bold uppercase text-cine-text-secondary">
            <span>CINEVOTE</span>
            <span>{poster.meta}</span>
          </div>
          <div className="relative">
            <p className="text-xs uppercase text-cine-text-muted">
              Candidate {index + 1}
            </p>
            <h2 className="mt-1 font-anton text-3xl leading-none text-cine-text-primary">
              {poster.title}
            </h2>
          </div>
        </article>
      ))}
    </div>
  );
}
