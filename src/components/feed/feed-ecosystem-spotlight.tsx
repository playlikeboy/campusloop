"use client";

import { ArrowRight, Bot, Code2, ExternalLink, Heart, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ECOSYSTEM_HIGHLIGHTS = [
  {
    id: "dsaloop",
    name: "DSALoop",
    tagline: "Coding & System Design",
    description: "185+ company problem tracks, pattern-first DSA sheets, and a 28-chapter system design primer.",
    href: "https://dsaloop.campusloop.space",
    isExternal: true,
    badge: "Flagship",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: Code2,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "baby",
    name: "baby",
    tagline: "AI Reflection Journal",
    description: "Meet Kumo, an empathetic AI companion for mindful student reflections with zero ads or noise.",
    href: "https://baby.campusloop.space",
    isExternal: true,
    badge: "AI Companion",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    icon: Heart,
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    id: "campus-ai",
    name: "Campus AI",
    tagline: "24/7 Syllabus Copilot",
    description: "Instant syllabus roadmaps, exam cheatsheets, and academic problem walkthroughs.",
    href: "/ai",
    isExternal: false,
    badge: "Campus AI",
    badgeClass: "bg-primary/15 text-primary",
    icon: Bot,
    iconBg: "bg-primary/10 text-primary",
  },
  {
    id: "mcp-portal",
    name: "Developer MCP",
    tagline: "Cursor & Claude Context",
    description: "Query campus notes, events, and resources directly inside Cursor and Claude via Model Context Protocol.",
    href: "/developer",
    isExternal: false,
    badge: "MCP Tooling",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: Terminal,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

export function FeedEcosystemSpotlight({ className }: { className?: string }) {
  return (
    <section className={cn("py-4", className)} aria-label="CampusLoop Ecosystem Apps">
      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-foreground">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">CampusLoop Ecosystem</span>
          <span className="hidden sm:inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            Student Suite
          </span>
        </div>
        <Link
          href="/ecosystem"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Explore All <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <ul className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {ECOSYSTEM_HIGHLIGHTS.map((app) => {
          const Icon = app.icon;
          const CardContent = (
            <div className="group flex h-full flex-col justify-between rounded-2xl bg-card/60 p-4 shadow-2xs transition-all hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", app.iconBg)}>
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase", app.badgeClass)}>
                    {app.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {app.name}
                    </h3>
                    {app.isExternal && <ExternalLink className="size-3 text-muted-foreground" aria-hidden />}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">{app.tagline}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-foreground/80 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
                <span>Open app</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </div>
          );

          return (
            <li key={app.id} className="w-64 shrink-0 snap-start">
              {app.isExternal ? (
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full focus-visible:outline-none"
                >
                  {CardContent}
                </a>
              ) : (
                <Link href={app.href} className="block h-full focus-visible:outline-none">
                  {CardContent}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
