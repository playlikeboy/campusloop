"use client";

import * as React from "react";
import { Check, ShieldCheck, Sparkles, User, Users } from "lucide-react";

export interface MembershipTier {
  title: string;
  badge?: string | null;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  buttonText: string;
  isPrimary?: boolean;
  features: string[];
}

export interface VoxelMembershipTiersProps {
  heading?: string;
  subheading?: string;
  tiers?: MembershipTier[];
  className?: string;
  onSelectTier?: (tierTitle: string) => void;
}

const DEFAULT_TIERS: MembershipTier[] = [
  {
    title: "Casual Explorer",
    badge: null,
    price: "$0",
    period: "forever",
    description: "For prospective students and curious visitors exploring campuses across the nation.",
    icon: User,
    buttonText: "Start Exploring",
    isPrimary: false,
    features: [
      "Search 1,350+ indexed college hubs",
      "Browse public campus feeds & posts",
      "View upcoming campus festivals & talks",
    ],
  },
  {
    title: "Verified Student",
    badge: "Most Popular",
    price: "100% Free",
    period: "with .edu / .ac ID",
    description: "The core verified experience designed exclusively for enrolled campus students.",
    icon: ShieldCheck,
    buttonText: "Verify Student ID",
    isPrimary: true,
    features: [
      "Anonymous confessions & campus polls",
      "Full Academic Vault (PYQs & Notes)",
      "Campus Match & Secret Crush deck",
      "Verified student badge & encrypted DMs",
      "Earn Karma Points & level up clout",
    ],
  },
  {
    title: "Club & Society Lead",
    badge: null,
    price: "Free",
    period: "for registered clubs",
    description: "Built for student council, cultural teams, and hackathon organizers to mobilize campus.",
    icon: Users,
    buttonText: "Register Your Club",
    isPrimary: false,
    features: [
      "Dedicated Club & Society Hub profile",
      "Campus-wide broadcast announcements",
      "Event ticketing & attendee check-ins",
      "Co-organizer team management",
    ],
  },
];

export function VoxelMembershipTiers({
  heading = "Find Your Way To Get Involved",
  subheading = "Pick the access tier that matches your campus journey and start connecting.",
  tiers = DEFAULT_TIERS,
  className = "",
  onSelectTier,
}: VoxelMembershipTiersProps) {
  return (
    <section className={`relative w-full overflow-hidden rounded-3xl bg-[#0b1510] py-16 px-4 text-white sm:px-6 lg:px-8 ${className}`}>
      {/* Voxel starry dusk sky gradient and pixel stars */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1510] via-[#0f2219] to-[#0b1510]" />
        <span className="absolute top-12 left-[10%] size-2 rounded-xs bg-[#22c55e]/40 animate-pulse" />
        <span className="absolute top-20 right-[15%] size-2.5 rounded-xs bg-emerald-300/30" />
        <span className="absolute top-36 left-[30%] size-1.5 rounded-xs bg-white/40" />
        <span className="absolute bottom-24 right-[25%] size-2 rounded-xs bg-amber-400/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        {/* Section Heading Tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3.5 py-1 text-xs font-black text-emerald-400 mb-3">
          <Sparkles className="size-3.5" />
          <span>Verified Student Access</span>
        </div>
        <h2 className="font-black uppercase tracking-tight text-2xl sm:text-4xl lg:text-5xl text-white">
          {heading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-xs text-stone-300 sm:text-sm">
          {subheading}
        </p>

        {/* 3 Clean Voxel Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 text-left items-stretch sm:mt-16 md:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.title}
                className={`relative flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-7 text-stone-900 shadow-2xl transition-all duration-300 ${
                  tier.isPrimary
                    ? "ring-4 ring-[#22c55e] md:-translate-y-2.5 shadow-emerald-500/20"
                    : "hover:-translate-y-1"
                }`}
              >
                {/* Popular Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 right-6 rounded-full bg-[#22c55e] px-3 py-1 font-black text-[10px] uppercase tracking-wider text-white shadow-md">
                    {tier.badge}
                  </div>
                )}

                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-2xl ${
                        tier.isPrimary ? "bg-[#22c55e]/15 text-[#16a34a]" : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-stone-900">{tier.title}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-1.5 border-b border-stone-100 pb-4">
                    <span className="font-black text-3xl tracking-tight text-stone-900">{tier.price}</span>
                    <span className="font-semibold text-stone-500 text-xs">/ {tier.period}</span>
                  </div>

                  <p className="mt-3 min-h-[36px] text-stone-600 text-xs leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="mt-5 space-y-2.5 border-t border-stone-100 pt-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 font-medium text-stone-700 text-xs">
                        <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#16a34a]">
                          <Check className="size-3" strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-8 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectTier?.(tier.title)}
                    className={`flex w-full cursor-pointer items-center justify-center rounded-2xl py-3.5 font-black text-xs transition-all active:scale-95 ${
                      tier.isPrimary
                        ? "bg-[#22c55e] text-white shadow-emerald-500/30 shadow-lg hover:bg-[#16a34a]"
                        : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                    }`}
                  >
                    <span>{tier.buttonText}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
