"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, Users, GitMerge, Settings, Radio, GraduationCap, Menu, X, type LucideIcon } from "lucide-react";
import { ArenaLogo } from "@/components/ArenaLogo";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Arena", icon: Swords },
  { href: "/live", label: "Live Arena", icon: Radio },
  { href: "/relay", label: "Relay (Learning)", icon: GraduationCap },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/patches", label: "Skill Library", icon: GitMerge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ArenaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Close the mobile menu on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  const navItems = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
              active ? "bg-arena-panel2 text-arena-text" : "text-arena-muted hover:bg-arena-panel2/60 hover:text-arena-text"
            }`}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-arena-purpleBright" />}
            <item.icon size={17} className={active ? "text-arena-purpleBright" : ""} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-arena-border bg-arena-panel/40 px-3 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-1">
          <ArenaLogo size={34} />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-[0.06em]">AGENT ARENA</div>
            <div className="text-[10px] text-arena-muted">Competitive agent training</div>
          </div>
        </Link>

        {navItems}

        <div className="mt-auto rounded-xl border border-arena-border bg-arena-panel2/40 p-3.5 text-[11px] leading-relaxed text-arena-muted">
          <span className="font-semibold text-arena-text">Agents compete.</span> Winners teach. Losers evolve.
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-arena-border bg-arena-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <ArenaLogo size={26} />
            <span className="text-sm font-bold tracking-[0.06em]">AGENT ARENA</span>
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation"
            className="grid h-9 w-9 place-items-center rounded-lg border border-arena-border text-arena-text"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-b border-arena-border bg-arena-panel px-4 py-3 lg:hidden">{navItems}</div>
        )}

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
