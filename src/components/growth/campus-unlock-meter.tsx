"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/stickers";
import type { CampusStats } from "@/lib/growth/campus-stats";

/**
 * Shown on a college's own confessions until enough verified students have
 * joined. The count is the live number of verified students from that
 * college; colleges already at the threshold never see it.
 */
export function CampusUnlockMeter({ campus }: { campus: CampusStats }) {
  const left = Math.max(0, campus.threshold - campus.students);
  const percent = Math.min(100, Math.round((campus.students / campus.threshold) * 100));

  return (
    <Sticker flat className="mx-3 my-4 space-y-4 p-5 sm:mx-4">
      <h2 className="sticker-caption text-2xl text-fg">
        Confessions at {campus.shortName} go live at {campus.threshold} students
      </h2>
      <div className="space-y-2">
        <div
          className="relative h-3 overflow-hidden rounded-sm bg-poll-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={campus.threshold}
          aria-valuenow={campus.students}
          aria-label={`${campus.students} of ${campus.threshold} students joined`}
        >
          <div className="poll-fill absolute inset-0 bg-poll-fill-chosen" style={{ "--fill": percent } as CSSProperties} />
        </div>
        <p className="flex items-baseline justify-between gap-3 text-sm text-fg-muted">
          <span>
            <span className="font-semibold tabular-nums text-fg">
              {campus.students}/{campus.threshold}
            </span>{" "}
            verified students joined
          </span>
          <span className="tabular-nums">{left} to go</span>
        </p>
      </div>
      <p className="text-sm text-fg-muted">
        Until then, read confessions from all colleges. Every friend who joins with their college email gets you
        both 50 Loop Points.
      </p>
      <Button asChild className="w-full sm:w-auto">
        <Link href="/invites">
          <UserPlus aria-hidden="true" />
          Invite friends from {campus.shortName}
        </Link>
      </Button>
    </Sticker>
  );
}
