"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Bot,
  Building2,
  Cake,
  Calendar,
  Car,
  Compass,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  Hourglass,
  LockKeyhole,
  Map,
  MapPin,
  MessageCircle,
  Newspaper,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { LegalNav } from "@/components/marketing/legal-nav";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const FEATURES = [
  {
    icon: Users,
    title: "Campus Feed & Social",
    tag: "Connect",
    description: "Share posts, stories and reels, discover campus conversations, explore hashtags and find new people.",
    href: "/feeds",
  },
  {
    icon: GraduationCap,
    title: "Academic Vault",
    tag: "Study",
    description: "Browse and share notes, previous-year questions, syllabi, playlists and study resources.",
    href: "/academics",
  },
  {
    icon: Sparkles,
    title: "Communities & Clubs",
    tag: "Belong",
    description: "Discover student clubs, technical societies, interest groups and communities around campus.",
    href: "/communities",
  },
  {
    icon: Calendar,
    title: "Events, Fests & Hackathons",
    tag: "Join in",
    description: "Explore campus events, workshops, fests and hackathons, and follow event details and registrations.",
    href: "/events",
  },
  {
    icon: Gamepad2,
    title: "Gaming & Esports Arena",
    tag: "Squad up",
    description: "Open gaming lobbies, find teammates, plan scrims, build gamer cards, join tournaments and view brackets and leaderboards.",
    href: "/gaming",
  },
  {
    icon: ShoppingBag,
    title: "Campus Marketplace",
    tag: "Everyday",
    description: "Find campus services for food, water, laundry, supermarket essentials, rentals and orders.",
    href: "/marketplace",
  },
  {
    icon: Store,
    title: "Student Buy & Sell",
    tag: "Exchange",
    description: "Post and discover student-to-student listings for things worth passing on to another batchmate.",
    href: "/buy-and-sell",
  },
  {
    icon: Building2,
    title: "Housing & Flatmates",
    tag: "Find a place",
    description: "Explore housing, flatmate and nearby living options through a campus-focused hub.",
    href: "/housing",
  },
  {
    icon: Car,
    title: "Rideshare & Carpools",
    tag: "Get there",
    description: "Coordinate shared rides for daily commutes, railway stations, airport trips and campus travel.",
    href: "/rideshare",
  },
  {
    icon: Search,
    title: "Lost & Found",
    tag: "Recover",
    description: "Post a lost item or browse reports to help return misplaced IDs, keys, gadgets and essentials.",
    href: "/lost-and-found",
  },
  {
    icon: MessageCircle,
    title: "Campus Confessions",
    tag: "Speak freely",
    description: "Share campus thoughts, stories and questions through the dedicated confessions space.",
    href: "/confessions",
  },
  {
    icon: LockKeyhole,
    title: "Secret Crush Vault",
    tag: "Connections",
    description: "A dedicated space for private-interest signals and discovering mutual campus connections.",
    href: "/crush",
  },
  {
    icon: Heart,
    title: "Random Loop",
    tag: "Meet someone",
    description: "Start a spontaneous conversation and meet another student beyond your usual circles.",
    href: "/random",
  },
  {
    icon: Bot,
    title: "Campus AI Assistant",
    tag: "Ask & explore",
    description: "Get help exploring CampusLoop, thinking through study plans and finding campus information.",
    href: "/ai",
  },
  {
    icon: Map,
    title: "CampusLoop Atlas",
    tag: "Discover",
    description: "Explore college hubs and navigate the wider CampusLoop network.",
    href: "/atlas",
  },
  {
    icon: Globe,
    title: "Colleges Directory",
    tag: "Find your hub",
    description: "Browse college pages and discover the community connected to your institution.",
    href: "/colleges",
  },
  {
    icon: Newspaper,
    title: "Articles & Roadmaps",
    tag: "Read & grow",
    description: "Explore articles, tutorials, interview preparation and student learning roadmaps.",
    href: "/articles",
  },
  {
    icon: MessageCircle,
    title: "Chat & Direct Messages",
    tag: "Keep in touch",
    description: "Continue campus conversations in direct chats with other students.",
    href: "/chat",
  },
  {
    icon: Cake,
    title: "Campus Birthdays",
    tag: "Celebrate",
    description: "Keep up with classmates' birthdays and celebrate your campus community.",
    href: "/birthdays",
  },
  {
    icon: Hourglass,
    title: "Time Capsule",
    tag: "Keep memories",
    description: "Save batch memories for future milestones and moments worth revisiting.",
    href: "/capsule",
  },
  {
    icon: Bookmark,
    title: "Saved Posts & Resources",
    tag: "Come back later",
    description: "Keep useful posts and resources together so you can find them again.",
    href: "/saved",
  },
  {
    icon: UserRound,
    title: "Profiles & Campus Streaks",
    tag: "Your space",
    description: "Manage your student profile and keep track of your ongoing CampusLoop activity.",
    href: "/profile",
  },
  {
    icon: Wrench,
    title: "Student Utilities",
    tag: "Handy tools",
    description: "Find practical tools and small utilities designed to help with student life.",
    href: "/utilities",
  },
  {
    icon: Terminal,
    title: "Developer & MCP Hub",
    tag: "Build with it",
    description: "Explore developer tools and connect compatible AI clients through the CampusLoop MCP hub.",
    href: "/developer",
  },
];

const HIGHLIGHTS = [
  { value: "Connect", label: "Campus Social", sub: "Posts, stories, reels and chat" },
  { value: "Learn", label: "Study Resources", sub: "Notes, PYQs and roadmaps" },
  { value: "Play", label: "Gaming & Esports", sub: "Squads, lobbies and tournaments" },
  { value: "Live", label: "Everyday Campus", sub: "Events, rides and local services" },
];
export function AboutClient() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MinimalLandingNavbar />
      <LegalNav />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
              <ShieldCheck className="size-4 text-[#16a34a]" />
              <span>Born at BIT Mesra • Built around student life</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              Built by students,
              <br />
              <span className="text-[#16a34a]">for students.</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              CampusLoop brings student conversations, study resources, clubs, events, gaming and
              everyday campus services into one connected place. Find your people, discover what's
              happening, and make more of campus life.
            </p>
          </div>

          {/* 3D Voxel Interactive Trio Artwork with Tilt */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/90 to-card/50 p-4 sm:p-8 shadow-xl shadow-primary/5 transition-transform duration-200 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            }}
          >
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-black/40 shadow-inner group">
                <video
                  src="/campusloop/marketing/voxel/videos/gossiping.mp4"
                  poster="/campusloop/marketing/voxel/videos/gossiping_poster.webp"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                  aria-label="Cute 3D voxel college students chatting and gossiping on university lawn"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                <span className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hostel Lore in Motion</span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-bold text-foreground">
                  <GraduationCap className="size-3.5 text-[#16a34a]" />
                  <span>The Campus Collective</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Where authentic college friendships take shape.
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  A home for students to share campus updates, study together, coordinate plans, and
                  find the people and communities that make college life better.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-[#16a34a]">
                    Student Communities
                  </span>
                  <span className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-500">
                    Campus-first
                  </span>
                  <span className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                    Gaming & Esports
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CampusLoop at a glance */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {HIGHLIGHTS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-border/70 bg-card/80 p-5 sm:p-6 text-center shadow-xs transition-all hover:border-primary/40 hover:-translate-y-1"
              >
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#16a34a]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-bold text-foreground">{stat.label}</p>
                <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* 3D Voxel Campus Plaza Architecture Card */}
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card p-3 sm:p-5 shadow-xl shadow-primary/5">
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden rounded-2xl bg-muted/30">
              <Image
                src="/campusloop/marketing/voxel/trust.webp"
                alt="Voxel 3D university campus with students collaborating peacefully in the central plaza"
                fill
                sizes="(max-width: 1024px) 100vw, 1000px"
                className="object-cover object-center"
              />
            </div>
            <div className="mt-3.5 px-3 pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="size-3.5 text-[#16a34a]" />
                <span>Central Campus Plaza • Isometric Voxel Environment</span>
              </span>
              <span className="text-[#16a34a] font-bold">CampusLoop Digital Architecture</span>
            </div>
          </div>

          {/* Six Core Pillars */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" />
                <span>CampusLoop Features</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                One campus. Every part of student life.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Explore the spaces and tools that bring student conversations, study, gaming, events and everyday campus needs together.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.title}
                    href={feature.href}
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                    }}
                    className="group flex h-full min-w-0 flex-col rounded-3xl border border-border/70 bg-card/85 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {feature.tag}
                      </span>
                    </div>

                    <h3 className="mt-3 flex items-start justify-between gap-2 text-sm font-extrabold text-foreground sm:text-base">
                      <span>{feature.title}</span>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </h3>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Origin Note: Born at BIT Mesra */}
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card/90 to-primary/5 p-6 sm:p-10 shadow-xs">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                <MapPin className="size-3.5" />
                <span>Birla Institute of Technology, Mesra</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Why we started in a hostel room
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Indian college life was scattered across cluttered WhatsApp groups, unverified Telegram
                channels, and decade-old administrative portals. Students had nowhere to speak freely about
                campus issues, find genuine study notes, or collaborate across batches. We built CampusLoop
                to give every campus in India a modern, verified, trustworthy digital home.
              </p>
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
                  onClick={() => {
                    sounds.tap();
                    haptics.medium();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#22c55e] hover:bg-[#16a34a] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/25 transition-all"
                >
                  <span>Join Your Campus</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/colleges"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 hover:bg-muted px-4 py-2.5 text-xs font-bold text-foreground transition-all"
                >
                  <Compass className="size-3.5" />
                  <span>Browse 1,350+ Colleges</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CleanFooter />
    </div>
  );
}
