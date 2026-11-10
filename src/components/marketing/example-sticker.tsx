import type * as React from "react";
import { Sticker } from "@/components/ui/stickers";
import { VerifiedSticker } from "@/components/ui/stickers/verified-sticker";

/**
 * The one sticker moment on a marketing hero: a tilted white tile that pops in,
 * showing a labelled example of what a student sees on CampusLoop.
 */
export function ExampleSticker({
  author,
  college,
  children,
}: {
  author: string;
  college: string;
  children: React.ReactNode;
}) {
  return (
    <Sticker tilt="right" pop className="w-full max-w-sm p-5 text-left [--pop-from:8deg]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-sticker-fg">{author}</p>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-fg-muted">
          Example
        </span>
      </div>
      <div className="mt-3 text-base text-sticker-fg">{children}</div>
      <VerifiedSticker size="sm" college={college} className="mt-4 shadow-none" />
    </Sticker>
  );
}
