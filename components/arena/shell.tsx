"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, Users, GitMerge, Settings, type LucideIcon } from "lucide-react";
import { ArenaLogo } from "@/components/ArenaLogo";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Arena", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/patches", label: "Skill Library", icon: GitMerge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ArenaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-arena-border bg-arena-panel/60 px-4 py-5 lg:flex">
        <Link href="/" className="mb-7 flex items-center gap-2.5">
          <ArenaLogo size={34} />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-[0.06em]">AGENT ARENA</div>
            <div className="text-[10px] text-arena-muted">Competitive agent training</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-arena-purple/15 text-arena-text"
                    : "text-arena-muted hover:bg-arena-panel2 hover:text-arena-text"
                }`}
              >
                <item.icon size={17} className={active ? "text-arena-purpleBright" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-arena-border bg-arena-panel2/50 p-3 text-[11px] leading-relaxed text-arena-muted">
          <span className="font-semibold text-arena-text">Agents compete.</span> Winners teach. Losers evolve.
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Mobile brand bar */}
        <div className="flex items-center gap-2 border-b border-arena-border px-5 py-3 lg:hidden">
          <ArenaLogo size={26} />
          <span className="text-sm font-bold tracking-[0.06em]">AGENT ARENA</span>
        </div>
        <main className="mx-auto max-w-6xl px-5 py-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
