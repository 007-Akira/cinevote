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
  { href: "/tickets", label: "Tickets" },
  { href: "/admin", label: "Admin" },
];

export function TopBar({ navItems = defaultNavItems }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-cine-black/72 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 sm:justify-between sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 font-anton text-2xl leading-none text-cine-text-primary"
          aria-label="CineVote home"
        >
          Cine<span className="text-cine-red">Vote</span>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="-mr-4 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain pr-4 [scrollbar-width:none] sm:mr-0 sm:flex-none sm:overflow-visible sm:pr-0 [&::-webkit-scrollbar]:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-cine-text-muted transition hover:bg-white/[0.08] hover:text-cine-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-red"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
