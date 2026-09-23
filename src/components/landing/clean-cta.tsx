"use client";

import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface CleanCTAProps {
  isAuthenticated?: boolean;
}

export function CleanCTA({ isAuthenticated = false }: CleanCTAProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative select-none">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 overflow-hidden border border-border/60 bg-linear-to-b from-card via-card/95 to-card/90 shadow-2xl text-center space-y-6">
          {/* Luminous glow circles */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/15 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/15 blur-[100px] pointer-events-none rounded-full" />

          {/* Micro pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-2xs">
            <ShieldCheck className="size-3.5" />
            <span>Verified Student Pass &bull; 100% Free Forever</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-[1.08]">
            Your college loop is already happening.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto font-medium">
            Jump in with your college email. No spam, no gatekeeping, just your campus community.
          </p>

          {/* CTA Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              onClick={() => {
                sounds.tap();
                haptics.medium();
              }}
              className="w-full sm:w-auto h-12 sm:h-13 px-8 rounded-full bg-primary text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? "Launch Your Campus" : "Join Your Campus Now"}</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/colleges"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="w-full sm:w-auto h-12 sm:h-13 px-7 rounded-full border border-border/80 bg-background/80 hover:bg-muted text-xs sm:text-sm font-bold text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <GraduationCap className="size-4 text-primary" />
              <span>Browse All Campuses</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
