"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Building2,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  ExternalLink,
  Flame,
  Gamepad2,
  GraduationCap,
  Heart,
  Hourglass,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  ShoppingBag,
  Shuffle,
  Sparkles,
  Terminal,
  VenetianMask,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "flagship" | "ai_dev" | "career" | "campus" | "social";

interface EcosystemApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categories: CategoryFilter[];
  badge: string;
  badgeStyle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  highlights: string[];
  href: string;
  isExternal: boolean;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  isFlagship?: boolean;
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: "dsaloop",
    name: "DSALoop",
    tagline: "Pattern-First Coding Interview & System Design Workspace",
    description:
      "Master software engineering campus placements and off-campus drives with high-yield algorithmic patterns, 185+ curated company tracks, Blind 75, Grind 169, and an in-depth 28-chapter system design primer designed for students.",
    categories: ["flagship", "career"],
    badge: "FLAGSHIP SUITE",
    badgeStyle: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: Code2,
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    highlights: [
      "185+ curated company problem tracks (Google, Amazon, Uber, Atlassian, Swiggy)",
      "Pattern-first curriculum: Sliding Window, Two Pointers, Monotonic Queue, Graph DP",
      "28-chapter distributed system design primer with architecture diagrams",
    ],
    href: "https://dsaloop.campusloop.space",
    isExternal: true,
    ctaLabel: "Launch DSALoop",
    isFlagship: true,
  },
  {
    id: "baby",
    name: "baby",
    tagline: "A Calm Sanctuary & Mindful AI Journal That Remembers",
    description:
      "Meet Kumo, your empathetic AI companion and private reflection journal. Built to help students navigate college burnout, exam pressure, and late-night thoughts in a safe space. 100% private by default with zero streaks, zero ads, and zero social noise.",
    categories: ["flagship", "ai_dev"],
    badge: "AI COMPANION",
    badgeStyle: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Heart,
    iconBg: "bg-blue-500/15 border-blue-500/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    highlights: [
      "Meet Kumo: An empathetic context-aware AI friend that remembers your journey",
      "Strictly private & client-encrypted entries with zero public feeds or tracking",
      "Mindful design: No gamification anxiety, no streaks, reflect whenever you need",
    ],
    href: "https://baby.campusloop.space",
    isExternal: true,
    ctaLabel: "Meet Kumo on baby",
    secondaryHref: "https://baby.campusloop.space/about",
    secondaryLabel: "About baby",
    isFlagship: true,
  },
  {
    id: "campus-ai",
    name: "Campus AI Copilot",
    tagline: "Context-Aware Student Reasoning Engine",
    description:
      "Your 24/7 personal campus intelligence agent. Ask questions regarding syllabus breakdowns, placement roadmaps, hostel survival hacks, campus fests, and navigate any CampusLoop resource effortlessly.",
    categories: ["ai_dev", "career"],
    badge: "CAMPUS AI",
    badgeStyle: "bg-primary/15 text-primary border-primary/30",
    icon: Bot,
    iconBg: "bg-primary/10 border-primary/25",
    iconColor: "text-primary",
    highlights: [
      "Trained with deep context on university curricula and Indian college life",
      "Instant study roadmaps, exam syllabus summaries, and revision cheatsheets",
      "Direct integration with the CampusLoop Academic Notes & PYQ Vault",
    ],
    href: "/ai",
    isExternal: false,
    ctaLabel: "Ask Campus AI",
  },
  {
    id: "developer-mcp",
    name: "Developer & MCP Portal",
    tagline: "Connect Cursor, Claude Desktop & AI Agents via MCP",
    description:
      "Bring your university's collective knowledge straight into your editor and AI workflows. Generate personal, revocable MCP server keys to let Cursor, Claude Desktop, and Windsurf query notes, syllabus, and events via official Model Context Protocol.",
    categories: ["ai_dev"],
    badge: "MCP PROTOCOL",
    badgeStyle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Terminal,
    iconBg: "bg-amber-500/10 border-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-400",
    highlights: [
      "Official Model Context Protocol (MCP) server endpoints with zero setup friction",
      "Query academic notes, PYQs, and campus events inside Claude & Cursor",
      "Smart Blocks article publishing API for student tech writers",
    ],
    href: "/developer",
    isExternal: false,
    ctaLabel: "Open Developer Portal",
  },
  {
    id: "campus-atlas",
    name: "Campus Atlas",
    tagline: "Sanity-Powered Campus Knowledge & Reasoning Agent",
    description:
      "A Sanity-backed reasoning directory mapping real campus life. Ask natural language questions about club office-bearers, department locations, lab hours, campus fests, and multi-constraint queries that search engines miss.",
    categories: ["campus"],
    badge: "SANITY AGENT",
    badgeStyle: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    icon: Compass,
    iconBg: "bg-rose-500/10 border-rose-500/25",
    iconColor: "text-rose-600 dark:text-rose-400",
    highlights: [
      "Natural language multi-constraint campus search engine",
      "Verified directories for clubs, faculty, departments, and study spots",
      "Maintained and verified by college student council reps",
    ],
    href: "/atlas",
    isExternal: false,
    ctaLabel: "Explore Atlas",
  },
  {
    id: "random-loop",
    name: "Random Loop",
    tagline: "Instant Real-Time Chat with Verified Peers Across India",
    description:
      "Break out of your daily routine and meet someone unexpected. Connect 1-on-1 for serendipitous real-time chats with verified university students across India in an audio and text environment with zero pre-judgment.",
    categories: ["social"],
    badge: "SERENDIPITY",
    badgeStyle: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: Shuffle,
    iconBg: "bg-purple-500/10 border-purple-500/25",
    iconColor: "text-purple-600 dark:text-purple-400",
    highlights: [
      "Instant peer matching across all Indian universities and institutes",
      "100% verified student network with strict safety guardrails",
      "Completely ephemeral: connect, chat, and choose whether to friend",
    ],
    href: "/random",
    isExternal: false,
    ctaLabel: "Start Random Chat",
  },
  {
    id: "time-capsule",
    name: "Time Capsule",
    tagline: "Batch Memories Locked Securely Until Convocation",
    description:
      "Seal your college moments in a cryptographic time vault. Lock batch photos, letters to your future graduating self, predictions, and confessions scheduled to unlock only on your batch's convocation ceremony.",
    categories: ["campus", "social"],
    badge: "MEMORY VAULT",
    badgeStyle: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    icon: Hourglass,
    iconBg: "bg-indigo-500/10 border-indigo-500/25",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    highlights: [
      "Cryptographic locking mechanism tied to convocation graduation date",
      "Collaborative batch memory boxes for hostel wings and clubs",
      "Guaranteed nostalgia release when convocation day arrives",
    ],
    href: "/capsule",
    isExternal: false,
    ctaLabel: "Enter Time Capsule",
  },
  {
    id: "gaming-arena",
    name: "Gaming & Esports Arena",
    tagline: "Inter-Hostel Scrims, Tournaments & Gaming Lobbies",
    description:
      "The campus competitive gaming arena. Find verified teammates for BGMI, Valorant, FIFA, CS2, host hostel scrims, join inter-college tournaments, and compete on the university esports leaderboards.",
    categories: ["social"],
    badge: "ESPORTS",
    badgeStyle: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
    icon: Gamepad2,
    iconBg: "bg-fuchsia-500/10 border-fuchsia-500/25",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
    highlights: [
      "Hostel lobbies and LFG matchmaking with rank and role filters",
      "Inter-college tournaments with LP rewards and campus leaderboards",
      "Toxic-free student verified lobbies with instant reporting",
    ],
    href: "/gaming",
    isExternal: false,
    ctaLabel: "Join Gaming Arena",
  },
  {
    id: "marketplace",
    name: "Campus Marketplace",
    tagline: "Zero-Brokerage Dorm Commerce, Rentals & Canteens",
    description:
      "The official student marketplace. Buy and sell used textbooks, drafters, scientific calculators, dorm mattresses, bicycles, and order directly from verified campus canteens and student merchants.",
    categories: ["campus"],
    badge: "COMMERCE",
    badgeStyle: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: ShoppingBag,
    iconBg: "bg-emerald-500/10 border-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    highlights: [
      "Zero commission & zero brokerage peer-to-peer student transactions",
      "Safe in-person campus handoffs with verified student identities",
      "Support for student canteen ordering and bike rental fleets",
    ],
    href: "/marketplace",
    isExternal: false,
    ctaLabel: "Browse Marketplace",
  },
  {
    id: "campus-living",
    name: "Campus Living Hub",
    tagline: "Housing, Roommates, Lost & Found, and Rideshare",
    description:
      "All essential campus living utilities in one hub: find verified student PGs and flats, match with compatible roommates, report lost student IDs or keys, and split cabs to airports and railway stations.",
    categories: ["campus"],
    badge: "SERVICES",
    badgeStyle: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    icon: Building2,
    iconBg: "bg-sky-500/10 border-sky-500/25",
    iconColor: "text-sky-600 dark:text-sky-400",
    highlights: [
      "Student-only housing listings with no middleman or brokerage fees",
      "Rideshare cab-splitting to airports, train stations, and weekend trips",
      "Community-powered Lost & Found recovery network",
    ],
    href: "/campus",
    isExternal: false,
    ctaLabel: "Open Living Hub",
  },
  {
    id: "confessions",
    name: "Campus Confessions",
    tagline: "Safe Campus Scoops with Cryptographic Escrow",
    description:
      "Express honest thoughts, campus experiences, and hilarious hostel stories. Identity escrow protects your privacy with strict cryptographic pseudonymity while automated keyword filters protect the community.",
    categories: ["social"],
    badge: "IDENTITY ESCROW",
    badgeStyle: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    icon: VenetianMask,
    iconBg: "bg-rose-500/10 border-rose-500/25",
    iconColor: "text-rose-600 dark:text-rose-400",
    highlights: [
      "Double-sealed identity escrow: express yourself without social anxiety",
      "College-specific timelines, upvoting, and anonymous comment threads",
      "Automated moderation preventing harassment and doxxing",
    ],
    href: "/confessions",
    isExternal: false,
    ctaLabel: "Read Confessions",
  },
  {
    id: "crush-vault",
    name: "Secret Crush Vault",
    tagline: "5-Slot Intent-Hidden Campus Match Vault",
    description:
      "Crushing on someone in your class? Add them to your private 5-slot crush vault. No one ever knows who you picked unless the feeling is mutual, unlocking a direct private match with zero awkwardness.",
    categories: ["social"],
    badge: "ZERO-KNOWLEDGE",
    badgeStyle: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    icon: Lock,
    iconBg: "bg-pink-500/10 border-pink-500/25",
    iconColor: "text-pink-600 dark:text-pink-400",
    highlights: [
      "Zero-knowledge cryptography: zero risk of rejection or awkwardness",
      "Up to 5 private slots that can be modified anytime",
      "Only triggers match notifications upon 100% reciprocal selection",
    ],
    href: "/crush",
    isExternal: false,
    ctaLabel: "Enter Crush Vault",
  },
];

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Apps", icon: Layers },
  { id: "flagship", label: "Flagship Products", icon: Sparkles },
  { id: "ai_dev", label: "AI & Dev Tools", icon: Cpu },
  { id: "career", label: "Career & Prep", icon: GraduationCap },
  { id: "campus", label: "Campus Living", icon: Building2 },
  { id: "social", label: "Social & Fun", icon: Shuffle },
];

export function EcosystemClient() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = useMemo(() => {
    return ECOSYSTEM_APPS.filter((app) => {
      // Category filter
      if (selectedCategory !== "all" && !app.categories.includes(selectedCategory)) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesTagline = app.tagline.toLowerCase().includes(q);
        const matchesDesc = app.description.toLowerCase().includes(q);
        const matchesHighlights = app.highlights.some((h) => h.toLowerCase().includes(q));
        const matchesBadge = app.badge.toLowerCase().includes(q);
        return matchesName || matchesTagline || matchesDesc || matchesHighlights || matchesBadge;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleTabClick = (cat: CategoryFilter) => {
    sounds.tap();
    haptics.light();
    setSelectedCategory(cat);
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text)] pb-24 select-none">
      {/* ─── Hero Header ─── */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-sunken)] to-[var(--surface)] px-4 py-8 sm:px-8 sm:py-12">
        <div className="relative mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-soft-border)] bg-[var(--primary-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--primary)] shadow-2xs">
            <Sparkles className="size-3.5 shrink-0" />
            <span>CampusLoop Suite &amp; Satellite Products</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text)]">
              The CampusLoop Ecosystem
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Purpose-built products, specialized AI companions, pattern-first interview prep suites, and verified campus utilities engineered specifically for Indian university students.
            </p>
          </div>

          {/* ─── Stats Ribbon ─── */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>2 Flagship Products</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <span className="size-2 rounded-full bg-[var(--primary)]" />
              <span>10+ Campus Services</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <ShieldCheck className="size-3.5 text-[var(--primary)]" />
              <span>100% Student Verified</span>
            </div>
          </div>

          {/* ─── Search Bar ─── */}
          <div className="relative max-w-xl pt-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)] pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps by name, pattern, topic, or feature..."
              className="pl-10 pr-9 h-11 rounded-2xl bg-[var(--surface)] border-[var(--border)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Filter Pills Bar ─── */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-4 py-2.5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft-border)] shadow-2xs"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap shrink-0">
            {filteredApps.length} {filteredApps.length === 1 ? "app" : "apps"}
          </span>
        </div>
      </div>

      {/* ─── App Grid ─── */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-8">
        {filteredApps.length === 0 ? (
          <Card className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
              <Search className="size-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-[var(--text)]">No ecosystem apps found</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm">
              We couldn&apos;t find any tools matching &ldquo;{searchQuery}&rdquo;. Try searching for something else or reset your filters.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Reset filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredApps.map((app) => {
              const Icon = app.icon;

              return (
                <Card
                  key={app.id}
                  className={cn(
                    "flex flex-col justify-between rounded-3xl border bg-[var(--surface)] p-5 sm:p-6 transition-all duration-200 hover:shadow-md hover:border-[var(--border-strong)] relative overflow-hidden group",
                    app.isFlagship
                      ? "border-[var(--primary-soft-border)] shadow-xs bg-gradient-to-b from-[var(--surface)] to-[var(--surface-sunken)]/50"
                      : "border-[var(--border)] shadow-2xs"
                  )}
                >
                  {/* Flagship accent line */}
                  {app.isFlagship && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[var(--primary)] to-blue-500" />
                  )}

                  <div className="space-y-4">
                    {/* Header Row: Icon + Badge + Ext indicator */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex size-11 items-center justify-center rounded-2xl border shrink-0 transition-transform group-hover:scale-105 shadow-2xs",
                            app.iconBg
                          )}
                        >
                          <Icon className={cn("size-5.5", app.iconColor)} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-black text-[var(--text)] truncate flex items-center gap-1.5">
                            <span>{app.name}</span>
                            {app.isExternal && (
                              <ArrowUpRight className="size-3.5 text-[var(--text-muted)] shrink-0" />
                            )}
                          </h2>
                          <p className="text-[11px] font-semibold text-[var(--text-secondary)] line-clamp-1">
                            {app.tagline}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0",
                          app.badgeStyle
                        )}
                      >
                        {app.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {app.description}
                    </p>

                    {/* Feature Highlights */}
                    <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                      {app.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action Row */}
                  <div className="pt-5 mt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {app.isExternal ? (
                        <a
                          href={app.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:opacity-95 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                        >
                          <span>{app.ctaLabel}</span>
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : (
                        <Link
                          href={app.href}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:opacity-95 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                        >
                          <span>{app.ctaLabel}</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}

                      {app.secondaryHref && (
                        <a
                          href={app.secondaryHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>{app.secondaryLabel}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {app.isExternal ? "External Suite" : "Native Hub"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── Ecosystem FAQ & Trust Standards ─── */}
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-sunken)] p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[var(--text)]">About the CampusLoop Ecosystem</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Why we build dedicated standalone apps alongside the core campus feed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[var(--text)]">Focused Craft &amp; Zero Bloat</p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Rather than cramming coding editors or long-form journaling into a busy social feed, each product is architected with a dedicated interface tuned for deep work.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[var(--text)]">Unified Verification</p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Your college status, reputation points, and identity trust translate across the entire ecosystem without redundant signups or separate logins.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[var(--text)]">Open Platform &amp; MCP</p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Building an AI agent or a campus club tool? Use the Developer Portal to connect Claude Desktop, Cursor, or your custom agents directly.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
