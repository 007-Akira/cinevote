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
  const trackItems = Array.from({ length: 8 }, () => items).flat();
  const loopItems = [...trackItems, ...trackItems];

  return (
    <div
      className={`relative z-20 -mx-6 w-[calc(100%+3rem)] -rotate-[3deg] origin-center overflow-hidden border-y border-cine-red/60 bg-cine-black/88 py-3 text-cine-text-primary shadow-[0_0_34px_rgb(229_9_20_/_0.26)] backdrop-blur-md ${className}`}
    >
      <div className="flex w-max animate-[cine-marquee_28s_linear_infinite] whitespace-nowrap">
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex shrink-0 items-center pl-7 font-anton text-lg uppercase tracking-normal sm:pl-10 sm:text-xl"
          >
            {item}
            <span className="ml-7 text-cine-red sm:ml-10">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
