"use client";

import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const CAMPUSES = [
  { name: "IIT Bombay", count: "2.4k online", state: "Maharashtra" },
  { name: "BITS Pilani", count: "1.8k online", state: "Rajasthan" },
  { name: "VIT Vellore", count: "4.2k online", state: "Tamil Nadu" },
  { name: "Delhi University", count: "5.1k online", state: "Delhi" },
  { name: "BIT Mesra", count: "1.2k online", state: "Jharkhand" },
  { name: "SRM Kattankulathur", count: "3.3k online", state: "Tamil Nadu" },
  { name: "NIT Trichy", count: "950 online", state: "Tamil Nadu" },
  { name: "MIT Manipal", count: "2.8k online", state: "Karnataka" },
  { name: "IIT Delhi", count: "1.9k online", state: "Delhi" },
  { name: "DTU Delhi", count: "1.6k online", state: "Delhi" },
  { name: "IIT Kharagpur", count: "2.2k online", state: "West Bengal" },
  { name: "Thapar University", count: "1.4k online", state: "Punjab" },
];

export function CampusTicker() {
  return (
    <div className="py-6 sm:py-8 border-y border-border/40 bg-card/40 backdrop-blur-md overflow-hidden relative select-none">
      {/* Subtle edge fades */}
      <div className="absolute left-0 inset-y-0 w-16 sm:w-32 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-16 sm:w-32 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-3">
        {/* Infinite scrolling track */}
        <div className="flex items-center gap-3 animate-marquee shrink-0">
          {[...CAMPUSES, ...CAMPUSES].map((c, i) => (
            <Link
              key={`${c.name}-${i}`}
              href="/colleges"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/50 bg-background/80 hover:bg-background hover:border-primary/40 transition-all text-xs font-bold text-foreground shrink-0 shadow-2xs group cursor-pointer"
            >
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{c.name}</span>
              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                {c.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
