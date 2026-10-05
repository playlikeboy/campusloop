import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Flame,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

interface VoxelVocarushHeroProps {
  isAuthenticated?: boolean;
}

export function VoxelVocarushHero({ isAuthenticated = false }: VoxelVocarushHeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-gradient-to-b from-background via-background to-emerald-50/20">
      {/* Floating decorative voxel pixel blocks in background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-12 left-[12%] size-3.5 rounded-xs bg-[#22c55e]/25 animate-bounce [animation-duration:3s]" />
        <span className="absolute top-24 left-[20%] size-2.5 rounded-xs bg-amber-400/30" />
        <span className="absolute top-16 right-[18%] size-3 rounded-xs bg-sky-400/25 animate-pulse" />
        <span className="absolute top-36 right-[10%] size-4 rounded-xs bg-[#22c55e]/20" />
        <span className="absolute top-44 left-[8%] size-3 rounded-xs bg-purple-400/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl max-w-3xl mx-auto leading-[1.08]">
          BUILD YOUR CAMPUS.
          <br />
          <span className="text-[#16a34a]">ONE DAY AT A TIME.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Complete daily missions to connect with verified peers, access lecture notes, earn Loop Points (LP), and build better habits — one semester at a time.
        </p>

        {/* Primary CTA Button */}
        <div className="mt-6 flex justify-center">
          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            className="inline-flex items-center justify-center rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>{isAuthenticated ? "Open Campus Feed" : "Start Exploring"}</span>
          </Link>
        </div>

        {/* Hero Showcase: Smartphone Mockup with 4 Floating Feature Pills */}
        <div className="relative mt-12 sm:mt-16 mx-auto max-w-4xl">
          {/* Voxel Campus Landscape Backdrop */}
          <div className="relative aspect-16/9 w-full overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-t from-emerald-100/40 via-card to-card p-2 shadow-2xl">
            <Image
              src="/campusloop/marketing/voxel/cute-campus-landscape.webp"
              alt="Cute 3D voxel campus landscape with library, clock tower, and students"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1100px"
              className="object-cover object-bottom"
            />
            {/* Top gradient fade into white */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background via-background/80 to-transparent" />
          </div>

          {/* Centered Phone Container */}
          <div className="absolute inset-x-0 top-6 sm:top-10 mx-auto w-full max-w-[290px] sm:max-w-[340px] z-20">
            {/* 4 Floating Symmetrical Action Cards */}
            {/* Top-Left: Quick Pulse */}
            <Link
              href="/feeds"
              className="group absolute -left-12 sm:-left-32 top-6 sm:top-8 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 sm:p-3.5 shadow-xl shadow-pink-500/10 backdrop-blur-md hover:scale-105 hover:border-pink-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[180px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600">
                  <Zap className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs font-black text-foreground">Quick Pulse</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Daily trends</p>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Top-Right: Academic Vault */}
            <Link
              href="/academics"
              className="group absolute -right-12 sm:-right-32 top-6 sm:top-8 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 sm:p-3.5 shadow-xl shadow-amber-500/10 backdrop-blur-md hover:scale-105 hover:border-amber-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[180px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <BookOpen className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs font-black text-foreground">Academic Vault</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">PYQs &amp; Notes</p>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Bottom-Left: Campus Clubs */}
            <Link
              href="/communities"
              className="group absolute -left-12 sm:-left-32 bottom-12 sm:bottom-16 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 sm:p-3.5 shadow-xl shadow-blue-500/10 backdrop-blur-md hover:scale-105 hover:border-blue-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[180px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                  <Users className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs font-black text-foreground">Campus Clubs</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Find societies</p>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Bottom-Right: Events Radar */}
            <Link
              href="/events"
              className="group absolute -right-12 sm:-right-32 bottom-12 sm:bottom-16 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 sm:p-3.5 shadow-xl shadow-rose-500/10 backdrop-blur-md hover:scale-105 hover:border-rose-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[180px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
                  <Flame className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs font-black text-foreground">Events Radar</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Fests &amp; Hackathons</p>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Actual Smartphone Card Body */}
            <div className="rounded-[2.5rem] border-4 border-foreground/15 bg-card p-3 sm:p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
              {/* Phone Speaker Notch */}
              <div className="mx-auto mb-3 h-3.5 w-20 rounded-full bg-muted flex items-center justify-center">
                <span className="size-1.5 rounded-full bg-foreground/30" />
              </div>

              {/* In-app Header */}
              <div className="flex items-center justify-between px-1 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-xs font-black shadow-xs">
                    JR
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground font-semibold">Good Morning,</p>
                    <p className="text-xs font-black text-foreground">Jordan R.</p>
                  </div>
                </div>
                <div className="relative">
                  <Bell className="size-4 text-muted-foreground" />
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-rose-500" />
                </div>
              </div>

              {/* Progress Card */}
              <div className="mt-3 rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-background to-background p-3.5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-md bg-[#22c55e]/20 text-[#16a34a] px-1.5 py-0.5 text-[9px] font-black uppercase">
                      Level 5
                    </span>
                    <h2 className="mt-1 text-xs font-black text-foreground">Computer Science</h2>
                  </div>
                  <div className="size-9 rounded-full border-2 border-[#22c55e] flex items-center justify-center text-[10px] font-black text-[#16a34a]">
                    72%
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground">360 / 500 LP</span>
                  <Link
                    href="/feeds"
                    className="inline-flex items-center gap-1 text-[10px] font-black text-[#16a34a] hover:underline"
                  >
                    Continue Mission →
                  </Link>
                </div>
              </div>

              {/* Week Streak Tracker */}
              <div className="mt-3 rounded-2xl border border-border/50 bg-background/80 p-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>Active Streak</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>12 Days</span>
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between px-1">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, idx) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-muted-foreground">{day}</span>
                      <span
                        className={`size-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                          idx < 5
                            ? "bg-[#22c55e] text-white shadow-xs"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx < 5 ? "✓" : "·"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
