"use client";

import {
  ArrowRight,
  Eye,
  Scissors,
  Shirt,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { InstagramIcon } from "@/components/ui/social-icons";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface MarketplaceComingSoonOverlayProps {
  collegeName?: string;
}

const PILLARS = [
  {
    name: "Zomato for Campus",
    service: "Late-Night Canteens & Meals",
    description:
      "Hostel room delivery up to 4 AM. Maggi, chicken rolls, cold coffee, burgers, and midnight snacks from verified campus food stalls.",
    icon: UtensilsCrossed,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    tag: "Food & Canteens",
  },
  {
    name: "Blinkit for Campus",
    service: "10-Minute Dorm Essentials",
    description:
      "Midnight instant delivery for stationery, lab manuals, notebooks, phone chargers, toiletries, hygiene kits & energy drinks.",
    icon: Zap,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    tag: "Quick Commerce",
  },
  {
    name: "TumbleDry for Campus",
    service: "Hostel Doorstep Laundry",
    description:
      "Doorstep room pickup, industrial washing, steam pressing, and neat wardrobe folding with live status tracking & zero lost clothes.",
    icon: Shirt,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    tag: "Laundry & Dry Clean",
  },
  {
    name: "UrbanClap for Campus",
    service: "Student Services & Rentals",
    description:
      "Pre-booked barber slots, bike & electric scooter rentals, hostel room deep cleans, cycle puncture repair & appliance fixes.",
    icon: Scissors,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    tag: "Salon & Services",
  },
];

export function MarketplaceComingSoonOverlay({ collegeName }: MarketplaceComingSoonOverlayProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <aside
        aria-label="Marketplace status announcement"
        className="fixed bottom-20 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-40 flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border border-primary/30 bg-background/95 backdrop-blur-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-primary" />
          </span>
          <span className="text-foreground font-bold">Marketplace Coming Soon</span>
          <span className="hidden md:inline text-muted-foreground">· Zomato, Blinkit, TumbleDry &amp; UrbanClap in one app</span>
        </div>
        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.light();
            setIsDismissed(false);
          }}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-all cursor-pointer text-[11px]"
        >
          <Sparkles className="size-3" />
          <span>View Vision</span>
        </button>
      </aside>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-background/80 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Background glow ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 bg-primary/15 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative w-full max-w-2xl rounded-3xl border border-border/60 bg-card/95 shadow-2xl p-5 sm:p-8 backdrop-blur-2xl my-auto space-y-6">
        {/* Top Header Pill & Dismiss Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary" />
            </span>
            <Sparkles className="size-3.5" />
            <span>Feature Coming Soon</span>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              setIsDismissed(true);
            }}
            className="flex size-8 items-center justify-center rounded-full border border-border/50 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Preview Marketplace Background"
            aria-label="Preview background"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Hero Title & Vision Statement */}
        <div className="space-y-2 text-left">
          <h1
            id="marketplace-overlay-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-[1.15]"
          >
            Imagine Zomato, Blinkit, TumbleDry &amp; UrbanClap — all at one place.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            We are building the all-in-one student living infrastructure. Night canteens, dorm grocery delivery, doorstep laundry, and campus services tailored exclusively for {collegeName || "your college"}.
          </p>
        </div>

        {/* 4 Pillars Grid (Zomato / Blinkit / TumbleDry / UrbanClap) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.name}
                className="group relative rounded-2xl border border-border/50 bg-background/60 hover:bg-background/90 p-4 transition-all duration-200 hover:shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl border shrink-0",
                        pillar.bg,
                        pillar.color
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-black text-foreground">{pillar.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/30">
                    {pillar.tag}
                  </span>
                </div>

                <div className="space-y-1 pl-0.5">
                  <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {pillar.service}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions & Next Steps */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <Link
              href="/feeds"
              onClick={() => {
                sounds.tap();
                haptics.success();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <span>Explore Verified Campus Feed</span>
              <ArrowRight className="size-3.5" />
            </Link>

            <a
              href="https://www.instagram.com/campusloop.space/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                sounds.tap();
                haptics.medium();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <InstagramIcon className="size-3.5 fill-current" />
              <span>Partner With Us / DM on Instagram</span>
            </a>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Store className="size-3 text-primary" />
              <span>Rollout Phase 1 · Pilot live at select college campuses</span>
            </span>

            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setIsDismissed(true);
              }}
              className="inline-flex items-center gap-1 hover:text-foreground font-semibold underline underline-offset-4 cursor-pointer transition-colors"
            >
              <Eye className="size-3" />
              <span>Preview Demo Storefront</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
