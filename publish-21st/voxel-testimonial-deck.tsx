"use client";

import * as React from "react";
import { GraduationCap, ShieldCheck, Star } from "lucide-react";

export interface TestimonialItem {
  id: string;
  name: string;
  college: string;
  course: string;
  avatarText: string;
  avatarColor: string;
  stars: number;
  review: string;
  tag: string;
}

export interface VoxelTestimonialDeckProps {
  heading?: string;
  subheading?: string;
  testimonials?: TestimonialItem[];
  className?: string;
}

const DEFAULT_REVIEWS: TestimonialItem[] = [
  {
    id: "1",
    name: "Aarav Sharma",
    college: "BIT Mesra",
    course: "B.Tech CSE '26",
    avatarText: "AS",
    avatarColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    stars: 5,
    review:
      "The Academic Vault saved our entire batch during end-sems. Having verified lecture notes and 5-year solved PYQs from seniors in one place is pure gold.",
    tag: "Academic Vault",
  },
  {
    id: "2",
    name: "Sneha Reddy",
    college: "IIT Bombay",
    course: "B.Des '25",
    avatarText: "SR",
    avatarColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    stars: 5,
    review:
      "Finally a social network where every single member is a real student from an accredited campus. No spam bots, no ads, just genuine college vibes.",
    tag: "Verified Gating",
  },
  {
    id: "3",
    name: "Rohan Varma",
    college: "DTU Delhi",
    course: "B.Tech IT '26",
    avatarText: "RV",
    avatarColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    stars: 5,
    review:
      "Cryptographic confessions allow students to voice hostel infrastructure problems without worrying about peer blowback. Truly transforms campus culture.",
    tag: "Hostel Voice",
  },
];

export function VoxelTestimonialDeck({
  heading = "Loved by Students Across India",
  subheading = "Real thoughts from verified college students collaborating across 1,350+ campus hubs.",
  testimonials = DEFAULT_REVIEWS,
  className = "",
}: VoxelTestimonialDeckProps) {
  return (
    <div className={`w-full max-w-5xl mx-auto p-4 sm:p-6 select-none ${className}`}>
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
          <ShieldCheck className="size-3.5" />
          <span>100% Verified Reviews</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
          {heading}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {subheading}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-3xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              {/* Stars & Tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: item.stars }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-500" />
                  ))}
                </div>
                <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {item.tag}
                </span>
              </div>

              {/* Review Text */}
              <p className="mt-4 text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                &ldquo;{item.review}&rdquo;
              </p>
            </div>

            {/* Author Footer */}
            <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border font-bold text-xs ${item.avatarColor}`}
              >
                {item.avatarText}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs sm:text-sm font-black text-foreground truncate">
                    {item.name}
                  </h4>
                  <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <GraduationCap className="size-3 shrink-0" />
                  <span>
                    {item.college} • {item.course}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoxelTestimonialDeck;
