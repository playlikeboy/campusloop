"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { LegalNav } from "@/components/marketing/legal-nav";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const PILLARS = [
  {
    icon: Users,
    title: "100% Verified Students",
    tag: "Real Peers",
    description:
      "Every single profile is verified via institutional .ac.in or .edu address. No bots, recruiters, or commercial spam.",
  },
  {
    icon: Globe,
    title: "Campus Grounded",
    tag: "Hostel Radar",
    description:
      "Built around physical university grounds, hostel gates, canteens, and local batch culture across India.",
  },
  {
    icon: Heart,
    title: "Authentic Expression",
    tag: "Safe & Candid",
    description:
      "Share genuine confessions, seek advice, or make friends with cryptographic anonymity protecting your identity.",
  },
  {
    icon: BookOpen,
    title: "Academic Vault",
    tag: "Free Study Notes",
    description:
      "Access peer-uploaded semester notes, handwritten lecture summaries, lab manuals, and 5-year solved PYQs.",
  },
  {
    icon: Sparkles,
    title: "Student Communities",
    tag: "Clubs & Fests",
    description:
      "Discover campus fests, technical societies, hackathon teams, and cultural groups in one unified hub.",
  },
  {
    icon: Compass,
    title: "Pan-India Radar",
    tag: "1,350+ Hubs",
    description:
      "Switch between your local campus timeline and the national radar across every accredited college in India.",
  },
];

const STATS = [
  { value: "1,350+", label: "College Hubs", sub: "Indexed across 28 states" },
  { value: "43.3M", label: "Indian Students", sub: "Higher-education community" },
  { value: "100%", label: "Verified Only", sub: "Institutional domain gate" },
  { value: "0", label: "Ad Trackers", sub: "Zero behavioral data selling" },
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
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      <MinimalLandingNavbar />
      <LegalNav />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
              <ShieldCheck className="size-4 text-[#16a34a]" />
              <span>Founded at BIT Mesra • 100% Student Verified</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              Built by students,
              <br />
              <span className="text-[#16a34a]">for students.</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              CampusLoop is the verified digital campus network connecting 43.3 million students across
              1,350+ Indian colleges. We replace cluttered WhatsApp groups and unverified forums with a
              safe, beautiful, and authentic college home.
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
                  No influencers, no corporate ad trackers, no external toxicity. Just you and your
                  verified batchmates sharing inside jokes, exam prep, semester survival tips, and hostel
                  stories.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-[#16a34a]">
                    Verified .ac.in / .edu Only
                  </span>
                  <span className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-500">
                    Hostel Radar
                  </span>
                  <span className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                    Cryptographic Anon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Voxel Stats Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
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
                <span>Core Philosophy</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                What drives CampusLoop
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Six foundational principles guiding every line of code we ship.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="group relative rounded-3xl border border-border/70 bg-card/85 p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {pillar.tag}
                      </span>
                    </div>

                    <h3 className="mt-4 text-sm sm:text-base font-extrabold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
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
