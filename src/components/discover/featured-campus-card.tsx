"use client";

import { ArrowUpRight, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { College } from "@/hooks/use-colleges";
import { cn } from "@/lib/utils";

interface FeaturedCampusCardProps {
  college: College;
  index: number;
}

const CAMPUS_COLORS = [
  "border-sky-500/20 bg-sky-500/[0.03]",
  "border-emerald-500/20 bg-emerald-500/[0.03]",
  "border-amber-500/20 bg-amber-500/[0.03]",
  "border-rose-500/20 bg-rose-500/[0.03]",
  "border-teal-500/20 bg-teal-500/[0.03]",
  "border-primary/20 bg-primary/[0.03]",
];

const CAMPUS_GLOWS = [
  "hover:border-sky-500/40 hover:bg-sky-500/[0.07]",
  "hover:border-emerald-500/40 hover:bg-emerald-500/[0.07]",
  "hover:border-amber-500/40 hover:bg-amber-500/[0.07]",
  "hover:border-rose-500/40 hover:bg-rose-500/[0.07]",
  "hover:border-teal-500/40 hover:bg-teal-500/[0.07]",
  "hover:border-primary/40 hover:bg-primary/[0.07]",
];

export function FeaturedCampusCard({ college, index }: FeaturedCampusCardProps) {
  return (
    <Link
      href={`/college/${college.slug || college.id}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 shadow-2xs",
        "hover:-translate-y-0.5 hover:shadow-md",
        CAMPUS_COLORS[index % CAMPUS_COLORS.length],
        CAMPUS_GLOWS[index % CAMPUS_GLOWS.length]
      )}
    >
      <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-primary/[0.03] blur-xl" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {college.name}
          </h3>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
            <MapPin className="size-2.5 shrink-0" />
            {college.state}
            {college.district ? `, ${college.district}` : ""}
          </p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background/50 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </span>
      </div>

      {college.postCount !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold bg-background/50 rounded-lg px-2.5 py-1.5 w-fit">
          <Users className="size-3" />
          {college.postCount} {college.postCount === 1 ? "post" : "posts"} in the loop
        </div>
      )}
    </Link>
  );
}
