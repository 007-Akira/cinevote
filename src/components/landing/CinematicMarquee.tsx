type CinematicMarqueeProps = {
  items?: string[];
};

const defaultItems = [
  "Student Choice",
  "Campus Screening",
  "One Vote Per Device",
  "Live Turnout",
];

export function CinematicMarquee({
  items = defaultItems,
}: CinematicMarqueeProps) {
  const loopItems = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-cine-red/30 bg-cine-black/50 py-3 text-cine-text-secondary">
      <div className="flex w-max animate-[cine-marquee_24s_linear_infinite] gap-8 whitespace-nowrap px-4">
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="font-anton text-lg uppercase tracking-normal"
          >
            {item}
            <span className="ml-8 text-cine-red">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
