"use client";

import { ArrowUpRight, Flame, Heart, Radio, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function CampusVibeGrid() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 select-none relative">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <Flame className="size-3.5" />
            <span>Built For Campus Culture</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Everything your college needs. Nothing it doesn&apos;t.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto font-medium">
            Designed from the ground up for how Indian college students live, talk, connect, and study.
          </p>
        </div>

        {/* 4 Visual Pillars Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 24h Stories */}
          <Link
            href="/app/stories/new"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="neo-card p-5 rounded-[28px] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="size-11 rounded-2xl bg-linear-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5 shadow-xs">
                <div className="size-full rounded-[14px] bg-card flex items-center justify-center">
                  <Radio className="size-5 text-rose-500 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                  Campus Stories
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  24-hour visual vibes that self-destruct. No lingering digital footprints.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/30 text-xs font-bold text-primary">
              <span>Share a Vibe</span>
              <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Campus Match / Dating */}
          <Link
            href="/app/dating"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="neo-card p-5 rounded-[28px] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="size-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                <Heart className="size-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                  Campus Match
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Swipe deck exclusively for verified students within your campus radius.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/30 text-xs font-bold text-rose-500">
              <span>Find Crushes</span>
              <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Communities & Sub-Hubs */}
          <Link
            href="/app/communities"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="neo-card p-5 rounded-[28px] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="size-11 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                <Users className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                  Communities
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Join hackathon pods, music bands, gaming squads, and student clubs.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/30 text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>Browse Clubs</span>
              <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Loop Points & Clout */}
          <Link
            href="/app"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="neo-card p-5 rounded-[28px] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="size-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Trophy className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                  Loop Points (LP)
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Earn campus clout for top answers, verified notes, and community impact.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/30 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Clout Leaderboard</span>
              <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
