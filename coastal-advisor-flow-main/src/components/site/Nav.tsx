import { useEffect, useState } from "react";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", href: "#top" },
  { label: "Advisory", href: "#advisory" },
  { label: "Technology", href: "#technology" },
  { label: "Impact", href: "#impact" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        className={cn(
          "mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-full px-4 py-3 transition-all duration-500 sm:px-6",
          solid ? "panel" : "border border-transparent",
        )}
      >
        <a href="#top" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-lime">
            <Waves className="h-4.5 w-4.5 text-primary-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold leading-none">
              SaltGuard
            </span>
            <span className="block truncate text-[11px] tracking-widest text-muted-foreground">
              COASTAL ADVISOR
            </span>
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-6">
          <ul className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="story-link transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            className="shrink-0 rounded-full bg-gradient-lime px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-105"
          >
            Get Advisory
          </a>
        </div>
      </nav>
    </header>
  );
}
