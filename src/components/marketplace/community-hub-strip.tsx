"use client";

import {
  ArrowUpRight,
  BookOpen,
  Car,
  Gamepad2,
  Home,
  Info,
  PackageSearch,
  ShoppingBag,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export type HubTabType =
  | "all"
  | "discussions"
  | "lost_found"
  | "marketplace"
  | "gaming"
  | "rideshare"
  | "housing"
  | "academics";

export const COMMUNITY_HUBS = [
  {
    id: "lost_found" as HubTabType,
    title: "Lost & Found",
    tagline: "Keys, IDs, earphones & misplaced items",
    tag: "Recovery",
    href: "/lost-and-found",
    icon: PackageSearch,
    gradient: "bg-brand-subtle",
    border: "group-hover:border-brand-subtle-border",
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    iconColor: "text-brand-text",
  },
  {
    id: "marketplace" as HubTabType,
    title: "Buy & Sell",
    tagline: "Cycles, coolers, books & dorm gear",
    tag: "Student P2P",
    href: "/buy-and-sell",
    icon: ShoppingBag,
    gradient: "bg-brand-subtle",
    border: "group-hover:border-brand-subtle-border",
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    iconColor: "text-brand-text",
  },
  {
    id: "gaming" as HubTabType,
    title: "Gaming Arena",
    tagline: "Valorant, BGMI & Esports lobbies",
    tag: "Lobbies",
    href: "/gaming",
    icon: Gamepad2,
    gradient: "bg-brand-subtle",
    border: "group-hover:border-brand-subtle-border",
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    iconColor: "text-brand-text",
  },
  {
    id: "rideshare" as HubTabType,
    title: "Ride Share",
    tagline: "Station & airport cab pooling",
    tag: "Cab Pool",
    href: "/rideshare",
    icon: Car,
    gradient: "bg-brand-subtle",
    border: "group-hover:border-brand-subtle-border",
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    iconColor: "text-brand-text",
  },
  {
    id: "housing" as HubTabType,
    title: "Housing & Flats",
    tagline: "PGs, rooms & student flatmates",
    tag: "Room Finder",
    href: "/housing",
    icon: Home,
    gradient: "bg-brand-subtle",
    border: "group-hover:border-brand-subtle-border",
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    iconColor: "text-brand-text",
  },
  {
    id: "academics" as HubTabType,
    title: "Notes & PYQs",
    tagline: "Semester exam papers & notes",
    tag: "Academic Vault",
    href: "/academics",
    icon: BookOpen,
    gradient: "bg-brand-subtle",
    border: "group-hover:border-brand-subtle-border",
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    iconColor: "text-brand-text",
  },
];

export function CommunityHubStrip() {
  function handleCardClick() {
    sounds.tap();
    haptics.light();
  }

  return (
    <section className="space-y-3 px-4 pt-4 pb-2 select-none">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-success-subtle text-success flex items-center justify-center">
            <Users2 className="size-3.5" />
          </div>
          <h2 className="text-xs font-bold text-foreground">
            Community Campus Utilities
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
            Community Maintained
          </span>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground">6 Dedicated Student Services</span>
      </div>

      {/* Community Disclaimer Notice */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/40 text-[11px] text-muted-foreground">
        <Info className="size-3.5 shrink-0 text-primary" />
        <p className="leading-snug">
          Maintained by the student community. CampusLoop provides direct access links to these peer-to-peer
          spaces.
        </p>
      </div>

      {/* Spacious 2-Column Mobile / 3-Column Tablet Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {COMMUNITY_HUBS.map((hub) => {
          const Icon = hub.icon;
          return (
            <Link
              key={hub.id}
              href={hub.href}
              onClick={handleCardClick}
              className={cn(
                "group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-[opacity,transform] duration-200 cursor-pointer overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] bg-card/85 hover:bg-card border-border/50",
                hub.border
              )}
            >
              {/* Card Ambient Gradient */}
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-40 group-hover:opacity-100",
                  hub.gradient
                )}
              />

              {/* Top Row: Icon + Tag & Arrow */}
              <div className="relative z-10 flex items-start justify-between w-full mb-3">
                <div
                  className={cn(
                    "size-9 sm:size-10 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105",
                    hub.badgeColor
                  )}
                >
                  <Icon className="size-4.5 sm:size-5" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                    {hub.tag}
                  </span>
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>

              {/* Bottom Row: Title & Tagline */}
              <div className="relative z-10 space-y-1 min-w-0 w-full">
                <h3 className="text-xs sm:text-sm font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                  {hub.title}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                  {hub.tagline}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
