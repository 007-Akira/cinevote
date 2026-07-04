import { movies } from "@/data/movies";

const cardTransforms = [
  "rotate-[-8deg]",
  "translate-x-10 translate-y-8 rotate-[6deg]",
  "-translate-x-5 translate-y-16 rotate-[-2deg]",
  "translate-x-16 translate-y-24 rotate-[10deg]",
];

export function PosterStack() {
  const featuredMovies = movies.slice(0, 4);

  return (
    <div className="relative mx-auto h-[26rem] w-full max-w-xs sm:h-[31rem] sm:max-w-sm lg:mx-0">
      <div className="absolute inset-x-6 bottom-2 h-20 rounded-full bg-cine-red/30 blur-3xl" />
      {featuredMovies.map((movie, index) => (
        <article
          key={movie.id}
          className={`absolute left-1/2 top-6 flex aspect-[2/3] w-40 -translate-x-1/2 flex-col justify-between overflow-hidden rounded-lg border border-white/15 bg-cine-card bg-cover bg-center p-4 shadow-2xl shadow-black/70 sm:w-52 ${cardTransforms[index]}`}
          style={{
            zIndex: featuredMovies.length - index,
            backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.78)), url(${movie.posterUrl})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgb(255_255_255_/_0.2),transparent_34%)]" />
          <div className="relative flex items-center justify-between text-[0.65rem] font-bold uppercase text-cine-text-secondary">
            <span>CINEVOTE</span>
            <span>{movie.genre}</span>
          </div>
          <div className="relative">
            <p className="text-xs uppercase text-cine-text-muted">
              Candidate {index + 1}
            </p>
            <h2 className="mt-1 font-anton text-3xl leading-none text-cine-text-primary">
              {movie.title}
            </h2>
          </div>
        </article>
      ))}
    </div>
  );
}
