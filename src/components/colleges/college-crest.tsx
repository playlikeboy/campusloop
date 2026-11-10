"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function collegeInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "CL"
  );
}

/** "Indian Institute of Technology Delhi, Hauz Khas" -> "IIT Delhi" for tight spots. */
export function shortCollegeName(name: string) {
  return name
    .split(",")[0]
    .replace(/Indian Institute of Technology/i, "IIT")
    .replace(/National Institute of Technology/i, "NIT")
    .replace(/Birla Institute of Technology/i, "BIT")
    .trim();
}

const SIZES = {
  sm: "size-10 text-xs",
  md: "size-12 text-sm",
  lg: "size-20 text-xl sm:size-24",
} as const;

/** College logo on a white tile, with initials when there is no logo or it fails to load. */
export function CollegeCrest({
  name,
  logoUrl,
  size = "sm",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-surface p-1",
        SIZES[size],
        className
      )}
    >
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-contain"
        />
      ) : (
        <span aria-hidden="true" className="font-display font-bold text-brand-text">
          {collegeInitials(name)}
        </span>
      )}
    </div>
  );
}
