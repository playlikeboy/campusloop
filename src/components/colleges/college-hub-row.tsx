"use client";

import { MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { VerifiedSticker } from "@/components/ui/stickers";
import { cn } from "@/lib/utils";
import { CollegeCrest } from "./college-crest";

export interface CollegeItem {
  id: string;
  slug?: string | null;
  name: string;
  state: string | null;
  district: string | null;
  website: string | null;
  yearOfEstablishment: number | null;
  aisheCode: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  nirfRank?: number | null;
  description?: string | null;
  websiteDomain?: string | null;
  postCount?: number;
  /** True only when the college has a verified student email domain. Rows show the mint sticker for it. */
  verified?: boolean;
}

/** One college as a list row: crest, name, place and email domain. */
export function CollegeHubRow({
  college,
  rank,
  trailing,
}: {
  college: CollegeItem;
  /** Optional standings position. */
  rank?: number;
  trailing?: React.ReactNode;
}) {
  const location = [college.district, college.state].filter(Boolean).join(", ") || "India";

  return (
    <Link
      href={`/college/${college.slug || college.id}`}
      className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-ui hover:bg-surface-muted"
    >
      {typeof rank === "number" && (
        <span
          className={cn(
            "w-6 shrink-0 text-center font-display font-bold tabular-nums",
            rank <= 3 ? "text-brand-text" : "text-fg-subtle"
          )}
        >
          {rank}
        </span>
      )}

      <CollegeCrest name={college.name} logoUrl={college.logoUrl} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="min-w-0 truncate font-semibold leading-tight text-fg group-hover:text-brand-text">
            {college.name}
          </h3>
          {college.verified ? (
            <VerifiedSticker size="sm" label="Verified" className="shrink-0 shadow-none" />
          ) : null}
          {college.nirfRank ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-fg-muted">
              <Trophy className="size-3" aria-hidden="true" />
              NIRF {college.nirfRank}
            </span>
          ) : null}
        </div>

        <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-fg-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{location}</span>
          {college.websiteDomain ? (
            <span className="hidden shrink-0 font-mono text-xs sm:inline">@{college.websiteDomain}</span>
          ) : null}
        </p>
      </div>

      {trailing && <div className="shrink-0 pl-2 text-right">{trailing}</div>}
    </Link>
  );
}
