"use client";

import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Car,
  GraduationCap,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface UtilityNeed {
  need: string;
  solution: string;
  description: string;
  href: string;
  actionText: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  badge: string;
}

const UTILITY_NEEDS: UtilityNeed[] = [
  {
    need: "Need a PYQ or notes?",
    solution: "Find it in the Vault.",
    description:
      "Handwritten lecture notes, cheatsheets, and 5-year solved end-sem papers curated by fellow students.",
    href: "/academics",
    actionText: "Open Academic Vault",
    icon: GraduationCap,
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    badge: "Academics",
  },
  {
    need: "Need a teammate?",
    solution: "Build your pod.",
    description:
      "Find hackathon coders, UI designers, and project collaborators across branches in your college.",
    href: "/communities",
    actionText: "Browse Communities",
    icon: Users,
    tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    badge: "Clubs & Teams",
  },
  {
    need: "What's happening tonight?",
    solution: "Check campus events.",
    description:
      "College fests, club demo nights, open mics, and technical workshops with live RSVP.",
    href: "/events",
    actionText: "See Live Events",
    icon: CalendarDays,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badge: "Happenings",
  },
  {
    need: "Lost your student ID?",
    solution: "Report & recover.",
    description:
      "Misplaced college IDs, hostel keys, earbuds, and calculators tagged directly to your campus.",
    href: "/lost-and-found",
    actionText: "Lost & Found Hub",
    icon: Search,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    badge: "Recovery",
  },
  {
    need: "Selling a cycle or book?",
    solution: "List on marketplace.",
    description:
      "Trade course textbooks, dorm coolers, mattresses, and bicycles student-to-student with verified peers.",
    href: "/buy-and-sell",
    actionText: "Buy & Sell",
    icon: ShoppingBag,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badge: "Peer Trade",
  },
  {
    need: "Need a flatmate or PG?",
    solution: "Find verified housing.",
    description:
      "Verified student roommates, hostels, PGs, and shared flat listings walking distance from campus gates.",
    href: "/housing",
    actionText: "Housing & Flats",
    icon: Building2,
    tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    badge: "Living",
  },
  {
    need: "Heading to the station?",
    solution: "Pool an auto or cab.",
    description:
      "Split rides to railway stations, airports, and weekend trips with classmates taking the same route.",
    href: "/rideshare",
    actionText: "Ride Pooling",
    icon: Car,
    tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    badge: "Commute",
  },
  {
    need: "Finding a campus spot?",
    solution: "Navigate Campus Atlas.",
    description:
      "Find lecture halls, computer centers, student canteens, and physical campus amenities easily.",
    href: "/atlas",
    actionText: "Open Atlas",
    icon: MapPin,
    tone: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    badge: "Campus Map",
  },
];

export function CampusUtilityMatrix() {
  return (
    <section className="border-t border-border/50 py-20 sm:py-28 px-4 sm:px-6 relative select-none">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
            <Sparkles className="size-3.5" />
            <span>Not Just Social Media • Utility First</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            Everything you keep asking your campus groups for.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
            CampusLoop is where you come when you need something solved on campus. Real student utility
            instead of endless scrolling.
          </p>
        </div>

        {/* 8-Card Utility Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {UTILITY_NEEDS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.need}
                href={item.href}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="group flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card hover:bg-muted/40 hover:border-border transition-all duration-200 shadow-2xs hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-10 place-items-center rounded-2xl border ${item.tone}`}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">
                      {item.need}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
                      {item.solution}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border/30 flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  <span>{item.actionText}</span>
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
