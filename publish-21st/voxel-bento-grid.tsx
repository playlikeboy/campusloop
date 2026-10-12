"use client";

import * as React from "react";
import { ArrowUpRight, BookOpen, Heart, Shield, Sparkles, Zap } from "lucide-react";

export interface BentoCardItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colSpan?: 1 | 2;
  stat?: string;
  statLabel?: string;
  badge?: string;
}

export interface VoxelBentoGridProps {
  heading?: string;
  subheading?: string;
  badgeText?: string;
  items?: BentoCardItem[];
  className?: string;
}

const DEFAULT_ITEMS: BentoCardItem[] = [
  {
    id: "identity",
    title: "100% Student Verified",
    tag: "Security",
    description:
      "Gated strictly by institutional university emails (.edu, .ac.in). Zero bots, recruiters, or commercial ads.",
    icon: Shield,
    colSpan: 2,
    stat: "1,350+",
    statLabel: "Colleges Onboarded",
    badge: "Verified Gating",
  },
  {
    id: "vault",
    title: "Academic Vault",
    tag: "Academics",
    description: "Peer-reviewed semester lecture notes, lab manuals, and 5-year solved previous year question papers.",
    icon: BookOpen,
    colSpan: 1,
    stat: "45K+",
    statLabel: "Study Materials",
  },
  {
    id: "anon",
    title: "Cryptographic Anonymity",
    tag: "Confessions",
    description: "Speak freely about hostel life and campus queries. Identity decoupled before database writes.",
    icon: Heart,
    colSpan: 1,
    badge: "Sealed Escrow",
  },
  {
    id: "communities",
    title: "Clubs & Societies Hub",
    tag: "Campus Life",
    description:
      "Centralized announcements, hackathon squads, cultural fests, and technical chapters in one unified timeline.",
    icon: Sparkles,
    colSpan: 2,
    stat: "12K+",
    statLabel: "Active Circles",
    badge: "Real-Time Radar",
  },
];

export function VoxelBentoGrid({
  heading = "Engineered for College Life",
  subheading = "Everything you need to thrive on campus, packaged into an isometric bento experience.",
  badgeText = "Voxel Architecture",
  items = DEFAULT_ITEMS,
  className = "",
}: VoxelBentoGridProps) {
  return (
    <section className={`w-full max-w-5xl mx-auto p-4 sm:p-6 select-none ${className}`}>
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        {badgeText && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
            <Zap className="size-3.5" />
            <span>{badgeText}</span>
          </div>
        )}
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
          {heading}
        </h2>
        {subheading && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {subheading}
          </p>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isSpan2 = item.colSpan === 2;

          return (
            <div
              key={item.id}
              className={`group relative rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg flex flex-col justify-between ${
                isSpan2 ? "sm:col-span-2" : "sm:col-span-1"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Icon className="size-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {item.badge}
                      </span>
                    )}
                    <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {item.tag}
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 text-base sm:text-lg font-black tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.stat && (
                <div className="mt-6 flex items-baseline justify-between border-t border-border/40 pt-4">
                  <div>
                    <span className="font-mono text-xl sm:text-2xl font-black text-foreground">
                      {item.stat}
                    </span>
                    <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                      {item.statLabel}
                    </span>
                  </div>

                  <div className="flex size-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-x-1 transition-all">
                    <ArrowUpRight className="size-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default VoxelBentoGrid;
