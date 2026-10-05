import Link from "next/link";
import { Check, ShieldCheck, Sparkles, User, Users } from "lucide-react";

interface VoxelMembershipTiersProps {
  isAuthenticated?: boolean;
}

export function VoxelMembershipTiers({ isAuthenticated = false }: VoxelMembershipTiersProps) {
  const tiers = [
    {
      title: "Casual Explorer",
      badge: null,
      price: "₹0",
      period: "forever",
      description: "For prospective students and curious freshmen exploring universities across India.",
      icon: User,
      buttonText: isAuthenticated ? "Open Feed" : "Start Exploring",
      buttonHref: isAuthenticated ? "/feeds" : "/sign-up",
      isPrimary: false,
      features: [
        "Search 1,350+ indexed Indian colleges",
        "Browse public campus hubs & posts",
        "View public student events & fests",
      ],
    },
    {
      title: "Verified Student",
      badge: "Most Popular",
      price: "100% Free",
      period: "with .ac.in / ID",
      description: "The core verified experience designed exclusively for enrolled college students.",
      icon: ShieldCheck,
      buttonText: isAuthenticated ? "Enter Campus" : "Verify College Access",
      buttonHref: isAuthenticated ? "/feeds" : "/sign-up",
      isPrimary: true,
      features: [
        "Uncensored campus confessions & polls",
        "Full Academic Vault (PYQs & Notes)",
        "Campus Match & Secret Crush deck",
        "Verified student badge & DM chats",
        "Earn Loop Points (LP) & level up",
      ],
    },
    {
      title: "Club & Society Lead",
      badge: null,
      price: "Free",
      period: "for verified clubs",
      description: "Tools for student societies, cultural teams, and hackathon organizers to mobilize campus.",
      icon: Users,
      buttonText: "Register Your Club",
      buttonHref: "/communities",
      isPrimary: false,
      features: [
        "Dedicated Club & Society Hub",
        "Campus-wide broadcast announcements",
        "Event ticketing & attendee check-ins",
        "Co-organizer admin roles",
      ],
    },
  ];

  return (
    <section id="membership" className="relative py-20 sm:py-28 bg-[#0b1510] text-white overflow-hidden">
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
        {/* Section Heading matching Image 1 */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1 text-xs font-black text-emerald-400 mb-3">
          <Sparkles className="size-3.5" />
          <span>Verified Student Access</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl text-white">
          FIND YOUR WAY TO GET INVOLVED
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-stone-300 max-w-lg mx-auto">
          Pick the access level that matches your college journey and start connecting with your campus community.
        </p>

        {/* 3 Clean White Cards matching Image 1 */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
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
                  <div className="absolute -top-3.5 right-6 rounded-full bg-[#22c55e] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
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
                  <Link
                    href={tier.buttonHref}
                    className={`flex w-full items-center justify-center rounded-2xl py-3.5 text-xs font-black transition-all cursor-pointer ${
                      tier.isPrimary
                        ? "bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg shadow-emerald-500/30 active:scale-95"
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
