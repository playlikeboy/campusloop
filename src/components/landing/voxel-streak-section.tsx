import Image from "next/image";
import { Flame, Trophy } from "lucide-react";

export function VoxelStreakSection() {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-24 overflow-hidden bg-background">
      {/* Decorative voxel floating squares */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-10 left-[15%] size-3 rounded-xs bg-[#22c55e]/25 animate-pulse" />
        <span className="absolute top-28 right-[12%] size-3.5 rounded-xs bg-amber-400/25" />
        <span className="absolute bottom-20 left-[10%] size-4 rounded-xs bg-emerald-400/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Heading */}
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
          GROW YOUR CAMPUS
          <br />
          <span className="text-[#16a34a]">WITH EVERY CONNECTION.</span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Engage a little every day, earn Loop Points (LP), and complete campus missions to turn college life into a thriving, lasting community.
        </p>

        {/* 2 Symmetrical Stat Pills matching Image 1 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {/* Streak Pill */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-md shadow-amber-500/5 backdrop-blur-sm transition-all hover:scale-105">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Flame className="size-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground">12 Days</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Current Streak</p>
            </div>
          </div>

          {/* Level Pill */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-md shadow-blue-500/5 backdrop-blur-sm transition-all hover:scale-105">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
              <Trophy className="size-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground">Level 38</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Campus LP</p>
            </div>
          </div>
        </div>

        {/* 3 Cute Voxel Characters Illustration */}
        <div className="relative mt-10 sm:mt-14 mx-auto max-w-2xl">
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-b from-background via-emerald-50/20 to-emerald-100/30 p-2 shadow-xl">
            <Image
              src="/campusloop/marketing/voxel/cute-students-trio.webp"
              alt="Three cute voxel college student characters standing together on grass blocks"
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-contain object-bottom transition-transform duration-500 hover:scale-102"
            />
            {/* Subtle bottom grass tint blend */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-emerald-600/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
