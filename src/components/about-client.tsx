"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Globe, Heart, ShieldCheck, Sparkles, Users } from "lucide-react";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";

const PILLARS = [
  {
    icon: Users,
    title: "Students",
    description: "Every member is a verified college student with an institutional .ac.in or .edu address.",
  },
  {
    icon: Globe,
    title: "Campus",
    description: "Built around your physical university grounds, hostels, gates, and student culture.",
  },
  {
    icon: Heart,
    title: "Connection",
    description: "Meet classmates, find project partners, and share candid thoughts safely.",
  },
  {
    icon: BookOpen,
    title: "Resources",
    description: "Free peer-contributed lecture notes, lab manuals, and 5-year solved PYQs.",
  },
  {
    icon: Sparkles,
    title: "Communities",
    description: "Student-run clubs, hackathon squads, technical chapters, and cultural fests.",
  },
  {
    icon: Compass,
    title: "Discovery",
    description: "Explore trends and authentic student life across 1,350+ colleges in India.",
  },
];

export function AboutClient() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MinimalLandingNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              <span>Founded at BIT Mesra</span>
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Built by students,
              <br />
              <span className="text-primary">for students.</span>
            </h1>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              CampusLoop is the verified digital layer of college life in India — connecting your classrooms, clubs, resources, and peers without the noise of commercial social media.
            </p>
          </div>

          {/* Voxel Trust Artwork Card */}
          <div className="mt-10 overflow-hidden rounded-3xl border border-border/70 bg-card p-3 sm:p-4 shadow-xl shadow-primary/5">
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden rounded-2xl bg-muted/30">
              <Image
                src="/campusloop/marketing/voxel/trust.webp"
                alt="Voxel 3D university campus with students collaborating peacefully in the central plaza"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1000px"
                className="object-cover object-center"
              />
            </div>
            <div className="mt-3 px-3 pb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Campus Plaza • Voxel Architecture</span>
              <span className="text-primary font-semibold">CampusLoop Foundation</span>
            </div>
          </div>

          {/* Six Focus Areas */}
          <div className="mt-16">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                What drives CampusLoop
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Six simple principles shaping our platform every single day.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-foreground">{pillar.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Origin Note */}
          <div className="mt-16 rounded-3xl border border-border/60 bg-muted/20 p-6 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="text-base font-bold text-foreground">Why we started</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                College life in India was scattered across fragmented WhatsApp groups, unverified Telegram channels, and outdated institutional portals. We created CampusLoop so every campus has a single, verified, trusted home.
              </p>
            </div>
            <div className="mt-5 sm:mt-0 shrink-0">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-primary/95 transition-all"
              >
                <span>Join CampusLoop</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <CleanFooter />
    </div>
  );
}
