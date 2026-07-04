import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

type TopBarProps = {
  navItems?: NavItem[];
};

const defaultNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/live", label: "Live" },
  { href: "/admin", label: "Admin" },
];

export function TopBar({ navItems = defaultNavItems }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-cine-black/72 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-anton text-2xl leading-none text-cine-text-primary"
          aria-label="CineVote home"
        >
          Cine<span className="text-cine-red">Vote</span>
        </Link>
        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-cine-text-muted transition hover:bg-white/[0.08] hover:text-cine-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-red"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
