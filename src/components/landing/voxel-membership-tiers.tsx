import Link from "next/link";
import { Check, ShieldCheck, User, Users, Zap } from "lucide-react";

interface VoxelMembershipTiersProps {
  isAuthenticated?: boolean;
}

export function VoxelMembershipTiers({ isAuthenticated = false }: VoxelMembershipTiersProps) {
  const tiers = [
    {
      title: "Freshman Explorer",
      badge: null,
      price: "₹0",
      period: "forever",
      description: "For prospective students and curious freshmen exploring universities across India.",
      icon: User,
      buttonText: isAuthenticated ? "Open Feed" : "Start Exploring",
      buttonHref: isAuthenticated ? "/feeds" : "/sign-up",
      isPrimary: false,
      features: [
        "Search 1,350+ indexed Indian college hubs",
        "Browse public campus hubs & fest calendars",
        "View department roadmaps & syllabus guides",
      ],
    },
    {
      title: "Verified Student",
      badge: "Most Popular",
      price: "100% Free",
      period: "with .ac.in or Student ID",
      description: "The core verified sanctuary designed exclusively for currently enrolled college students.",
      icon: ShieldCheck,
      buttonText: isAuthenticated ? "Enter Campus" : "Claim Verified Handle",
      buttonHref: isAuthenticated ? "/feeds" : "/sign-up",
      isPrimary: true,
      features: [
        "Uncensored anonymous confessions & polls",
        "Full Academic Vault (45K+ PYQs & Notes)",
        "Campus Match & Secret Crush swipe deck",
        "Verified campus handle & private DMs",
        "Earn Loop Points (LP) & level up status",
      ],
    },
    {
      title: "Club & Society Lead",
      badge: "For Leaders",
      price: "Free",
      period: "for recognized clubs",
      description: "Power tools for student societies, coding chapters, and fest teams to mobilize campus.",
      icon: Users,
      buttonText: "Register Your Society",
      buttonHref: "/communities",
      isPrimary: false,
      features: [
        "Dedicated Club & Society Hub on timeline",
        "Campus-wide broadcast announcements",
        "Recruit freshmen & manage fest events",
        "Co-organizer team management",
      ],
    },
  ];

  return (
    <section id="membership" className="relative py-12 sm:py-20 md:py-24 bg-[#0b1510] text-white overflow-hidden select-none">
      {/* Voxel starry dusk sky gradient and pixel blocks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1510] via-[#0f2219] to-[#0b1510]" />
        {/* Floating dusk stars / voxel blocks */}
        <span className="absolute top-12 left-[10%] size-2 rounded-xs bg-[#22c55e]/40 animate-pulse" />
        <span className="absolute top-20 right-[15%] size-2.5 rounded-xs bg-emerald-300/30" />
        <span className="absolute top-36 left-[30%] size-1.5 rounded-xs bg-white/40" />
        <span className="absolute bottom-24 right-[25%] size-2 rounded-xs bg-amber-400/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Heading */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1 text-xs font-bold text-white mb-3 shadow-xs">
          <Zap className="size-3.5 text-primary" />
          <span>Zero Paywalls • 100% Student-Only</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl text-white leading-[1.08]">
          ALWAYS 100% FREE FOR STUDENTS.
          <br />
          <span className="text-primary-foreground/90">CHOOSE YOUR ACCESS TIER.</span>
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-stone-300 max-w-lg mx-auto">
          No credit cards. No corporate sponsorships. Just student verification to keep out spammers and bots.
        </p>

        {/* 3 Clean Cards */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left items-stretch">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.title}
                className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-7 text-stone-900 shadow-xl transition-all duration-300 ${
                  tier.isPrimary
                    ? "ring-4 ring-primary md:-translate-y-2.5 shadow-primary/20"
                    : "hover:-translate-y-1"
                }`}
              >
                {/* Popular Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                    {tier.badge}
                  </div>
                )}

                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-2xl ${
                        tier.isPrimary ? "bg-primary/15 text-primary" : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900">{tier.title}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-1.5 border-b border-stone-100 pb-4">
                    <span className="text-3xl font-black tracking-tight text-stone-900">{tier.price}</span>
                    <span className="text-xs font-semibold text-stone-500">/ {tier.period}</span>
                  </div>

                  <p className="mt-3 text-xs text-stone-600 leading-relaxed min-h-[36px]">
                    {tier.description}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="mt-5 space-y-2.5 border-t border-stone-100 pt-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                        <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-8 pt-2">
                  <Link
                    href={tier.buttonHref}
                    className={`flex w-full items-center justify-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 min-h-[44px] text-xs font-bold transition-all cursor-pointer ${
                      tier.isPrimary
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-900 active:scale-95"
                    }`}
                  >
                    <span>{tier.buttonText}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
