"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CuteCatSuccess, CuteSparkle } from "@/components/ui/cute-illustrations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface CuteLandingCTAProps {
  isAuthenticated?: boolean;
}

export function CuteLandingCTA({ isAuthenticated = false }: CuteLandingCTAProps) {
  return (
    <section className="relative py-12 sm:py-20 bg-background select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-canvas/40 via-card to-card p-8 sm:p-14 text-center shadow-md">
          {/* Subtle Ambient Decorative Sparkles */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-6 left-8 opacity-60">
              <CuteSparkle size={20} className="text-primary" />
            </div>
            <div className="absolute bottom-8 right-10 opacity-60">
              <CuteSparkle size={24} className="text-primary" />
            </div>
          </div>

          <div className="relative z-10 max-w-xl mx-auto space-y-5">
            {/* Cute Cat Success Mascot */}
            <div className="flex justify-center mb-2">
              <CuteCatSuccess size={110} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <ShieldCheck className="size-3.5" />
              <span>Free Forever · Verified College Students</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
              Your college circle is already here.
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
              Join thousands of verified peers across 1,350+ Indian colleges. Spill tea, swap solved PYQs, and find your people.
            </p>

            {/* Main Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={isAuthenticated ? "/feeds" : "/sign-up"}
                onClick={() => {
                  sounds.pop();
                  haptics.medium();
                }}
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-bold gap-2 shadow-sm">
                  <Zap className="size-4" />
                  <span>{isAuthenticated ? "Enter Campus Loop" : "Claim Your Campus Loop Profile"}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>

              <Link
                href="/colleges"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="w-full sm:w-auto"
              >
                <Button variant="secondary" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-bold gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  <span>Find Your College Hub</span>
                </Button>
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground font-semibold pt-1">
              Takes 45 seconds · Gated by institutional email &amp; student ID · Zero spam
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
