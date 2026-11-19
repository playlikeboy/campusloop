"use client";

import { Radio, Users, VenetianMask } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { useCampusStats } from "./use-campus-stats";

function ProofChip({
  icon: Icon,
  href,
  live,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  live?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-3 text-xs font-semibold text-fg-muted transition-ui",
    href && "hover:bg-surface-sunken hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );
  const body = (
    <>
      {live ? (
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-verified opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-verified" />
        </span>
      ) : (
        <Icon className="size-3.5" aria-hidden="true" />
      )}
      <span className="tabular-nums">{children}</span>
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <span className={className}>{body}</span>
  );
}

/**
 * Real-time campus proof under the feed header: who is online, confessions
 * today, students who joined. A chip only appears when its count is above
 * zero, so it never says anything that isn't true right now.
 */
export function SocialProofChips({ className }: { className?: string }) {
  const { campus } = useCampusStats();
  if (!campus) return null;

  const chips: React.ReactNode[] = [];
  if (campus.onlineNow > 1) {
    chips.push(
      <ProofChip key="online" icon={Radio} live>
        {campus.onlineNow} online now
      </ProofChip>
    );
  }
  if (campus.confessionsToday > 0) {
    chips.push(
      <ProofChip key="confessions" icon={VenetianMask} href="/confessions?scope=CAMPUS">
        {campus.confessionsToday} {campus.confessionsToday === 1 ? "confession" : "confessions"} today
      </ProofChip>
    );
  }
  if (campus.students > 1) {
    chips.push(
      <ProofChip key="students" icon={Users} href="/invites">
        {campus.students} from {campus.shortName}
      </ProofChip>
    );
  }
  if (chips.length === 0) return null;

  return (
    <div
      className={cn("no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2", className)}
      aria-label={`Live at ${campus.shortName}`}
    >
      {chips}
    </div>
  );
}
