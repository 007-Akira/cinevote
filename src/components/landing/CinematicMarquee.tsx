type CinematicMarqueeProps = {
  items?: string[];
  className?: string;
};

const defaultItems = [
  "Choose the movie",
  "Own the night",
  "Vote now",
];

export function CinematicMarquee({
  items = defaultItems,
  className = "",
}: CinematicMarqueeProps) {
  const loopItems = [...items, ...items];

  return (
    <div
      className={`relative overflow-hidden border-y border-cine-red/30 bg-cine-black/55 py-3 text-cine-text-secondary shadow-[0_0_40px_rgb(229_9_20_/_0.12)] ${className}`}
    >
      <div className="flex w-max animate-[cine-marquee_20s_linear_infinite] gap-5 whitespace-nowrap px-4">
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="font-anton text-lg uppercase tracking-normal sm:text-xl"
          >
            {item}
            <span className="ml-5 text-cine-red">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
