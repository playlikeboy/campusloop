import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Bot,
  Building2,
  Cake,
  Calendar,
  Car,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  Hourglass,
  LockKeyhole,
  Map,
  MessageCircle,
  Newspaper,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { SOCIAL_SAME_AS } from "@/constants/social";
import { getPublicStats } from "@/lib/public-stats";

export const metadata: Metadata = {
  title: "About · CampusLoop",
  description:
    "CampusLoop is a verified student network for Indian colleges, built at BIT Mesra by Shaswat Raj: notes and past papers, a campus feed, communities, events and everyday campus services.",
  keywords: [
    "About CampusLoop",
    "Verified Student Network",
    "College Social Network India",
    "Student Community Platform",
    "BIT Mesra",
  ],
  alternates: { canonical: "https://campusloop.space/about" },
  openGraph: {
    title: "About · CampusLoop",
    description: "A verified student network for Indian colleges, built at BIT Mesra by Shaswat Raj.",
    url: "https://campusloop.space/about",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "About CampusLoop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About · CampusLoop",
    description: "A verified student network for Indian colleges, built at BIT Mesra by Shaswat Raj.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const FEATURES = [
  { icon: Users, title: "Campus feed", href: "/feeds", description: "Posts, polls, stories and reels from verified classmates." },
  { icon: GraduationCap, title: "Academic Vault", href: "/academics", description: "Notes, previous-year questions, syllabi and study playlists." },
  { icon: Sparkles, title: "Communities and clubs", href: "/communities", description: "Student clubs, technical societies and interest groups." },
  { icon: Calendar, title: "Events, fests and hackathons", href: "/events", description: "Campus events with details and registration." },
  { icon: Gamepad2, title: "Gaming and esports", href: "/gaming", description: "Lobbies, teammates, scrims and tournaments." },
  { icon: ShoppingBag, title: "Campus marketplace", href: "/marketplace", description: "Food, water, laundry, supermarket and rental services." },
  { icon: Store, title: "Buy and sell", href: "/buy-and-sell", description: "Student-to-student listings." },
  { icon: Building2, title: "Housing and flatmates", href: "/housing", description: "Housing and flatmate options near campus." },
  { icon: Car, title: "Rideshare", href: "/rideshare", description: "Shared rides for commutes, stations and airports." },
  { icon: Search, title: "Lost and found", href: "/lost-and-found", description: "Report or find misplaced IDs, keys and gadgets." },
  { icon: MessageCircle, title: "Confessions", href: "/confessions", description: "Anonymous campus thoughts and questions." },
  { icon: LockKeyhole, title: "Secret Crush", href: "/crush", description: "Revealed only when the interest is mutual. 18+ verified students only." },
  { icon: Heart, title: "Random Loop", href: "/random", description: "Meet another student beyond your usual circles." },
  { icon: Bot, title: "Campus AI assistant", href: "/ai", description: "Help with exploring CampusLoop and study plans." },
  { icon: Map, title: "Atlas", href: "/atlas", description: "Explore college hubs across the network." },
  { icon: Globe, title: "Colleges directory", href: "/colleges", description: "Find your college and its hub." },
  { icon: Newspaper, title: "Articles and roadmaps", href: "/articles", description: "Tutorials, interview prep and learning roadmaps." },
  { icon: MessageCircle, title: "Chat", href: "/chat", description: "Direct messages with other students." },
  { icon: Cake, title: "Birthdays", href: "/birthdays", description: "Keep up with classmates' birthdays." },
  { icon: Hourglass, title: "Time Capsule", href: "/capsule", description: "Batch memories sealed until a future date." },
  { icon: Bookmark, title: "Saved", href: "/saved", description: "Posts and resources you want to find again." },
  { icon: UserRound, title: "Profile and streaks", href: "/profile", description: "Your student profile and activity." },
  { icon: Wrench, title: "Student utilities", href: "/utilities", description: "Small tools for everyday student life." },
  { icon: Terminal, title: "Developer and MCP hub", href: "/developer", description: "Connect AI clients and build on CampusLoop." },
];

export default async function AboutPage() {
  const stats = await getPublicStats();
  const directory = stats.directoryColleges > 0 ? `${stats.directoryColleges.toLocaleString("en-IN")} colleges in our directory` : "colleges across India in our directory";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About CampusLoop",
    url: "https://campusloop.space/about",
    description: "CampusLoop is a verified student network for Indian colleges, built at BIT Mesra.",
    mainEntity: {
      "@type": "Organization",
      name: "CampusLoop",
      legalName: "CampusLoop (not yet incorporated)",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
      founder: { "@type": "Person", name: "Shaswat Raj" },
      sameAs: SOCIAL_SAME_AS,
    },
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">Your campus, verified.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            CampusLoop brings student conversations, study resources, clubs, events and everyday campus
            services into one place that only verified classmates can see.
          </p>
          <p className="mt-4 text-sm font-medium text-fg-muted">Built at BIT Mesra by Shaswat Raj.</p>
        </header>

        <section aria-labelledby="who" className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 id="who" className="text-base font-semibold text-fg">Who it is for</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Students at Indian colleges who join with a college email. Anyone else can look around in Campus
              Preview without a verified tick.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-fg">Where it is live</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Live at BIT Mesra, with {directory}. Hubs open on request.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-fg">How anonymity works</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Anonymous posts never show your name or profile to anyone on CampusLoop. Your identity is
              encrypted separately and can only be recovered by CampusLoop in response to a lawful order or a
              serious safety report, and every such access is logged.
            </p>
          </div>
        </section>

        <section aria-labelledby="features" className="space-y-6">
          <div className="max-w-xl">
            <h2 id="features" className="text-2xl font-bold tracking-tight text-fg">Every part of student life</h2>
            <p className="mt-2 text-sm text-fg-muted">The spaces and tools on CampusLoop today.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-3 flex items-start justify-between gap-2 text-base font-semibold text-fg">
                    <span>{feature.title}</span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="origin" className="rounded-xl border border-border bg-surface p-6 sm:p-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-fg-muted">Birla Institute of Technology, Mesra</p>
            <h2 id="origin" className="text-2xl font-bold tracking-tight text-fg">Why we started in a hostel room</h2>
            <p className="text-sm leading-relaxed text-fg-muted">
              College life in India was scattered across WhatsApp groups, unverified Telegram channels and old
              administrative portals. Students had nowhere to speak freely about campus issues, find real study
              notes or work across batches. CampusLoop gives each campus a verified, trustworthy digital home.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
              >
                Join with college email <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/colleges"
                className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-fg hover:bg-surface-muted"
              >
                <BookOpen className="size-4" aria-hidden /> Find your college
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
