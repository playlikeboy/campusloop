"use client";

import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Community } from "@/hooks/use-communities";
import { fetcher } from "@/lib/api";
import { initialOf } from "@/lib/utils";

/** Three communities the student has not joined yet, shown inside the feed. */
export function InlineCommunitiesWidget() {
  const { data: allCommunities, isLoading } = useSWR<Community[]>(
    "/api/communities?limit=10&sort=popular",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 20000,
    }
  );

  const suggestedCommunities = useMemo(() => {
    if (!allCommunities || allCommunities.length === 0) return [];
    const unjoined = allCommunities.filter((c) => !c.isMember);
    const pool = unjoined.length > 0 ? unjoined : allCommunities;
    return pool.slice(0, 3);
  }, [allCommunities]);

  if (isLoading && (!allCommunities || allCommunities.length === 0)) {
    return (
      <div className="space-y-3 px-4 py-3 motion-safe:animate-pulse" aria-hidden>
        <div className="h-4 w-36 rounded-md bg-surface-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="size-10 shrink-0 rounded-full bg-surface-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-surface-muted" />
              <div className="h-3 w-24 rounded bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestedCommunities.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2 px-4 py-3" aria-labelledby="feed-communities-heading">
      <div className="flex items-center justify-between gap-3">
        <h3 id="feed-communities-heading" className="flex items-center gap-2 text-base font-bold text-fg">
          <Users className="size-4 text-fg-muted" aria-hidden />
          Communities to join
        </h3>
        <Link
          href="/communities"
          className="flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
        >
          See all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <ul className="divide-y divide-border">
        {suggestedCommunities.map((comm) => {
          const displaySlug = comm.slug || comm.name.toLowerCase().replace(/\s+/g, "-");
          const memberCount = comm.membersCount ?? comm.memberCount ?? comm.members?.length ?? 0;
          const initialLetter = initialOf(comm.name || displaySlug, "C");

          return (
            <li key={comm.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-10 shrink-0 rounded-full">
                  {comm.avatarUrl && <AvatarImage src={comm.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-surface-muted text-sm font-bold text-fg">
                    {initialLetter}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/communities/${comm.id}`}
                    className="block truncate text-sm font-semibold text-fg hover:underline"
                  >
                    {comm.name}
                  </Link>
                  <p className="truncate text-sm text-fg-muted">
                    {memberCount} {memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <JoinCommunityButton communityId={comm.id} initialIsMember={Boolean(comm.isMember)} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
