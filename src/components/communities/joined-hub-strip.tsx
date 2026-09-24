"use client";

import { ArrowRight, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommunityDirectoryItem } from "@/lib/communities/queries";
import { cn, getAvatarUrl } from "@/lib/utils";

interface JoinedHubStripProps {
  communities: CommunityDirectoryItem[];
  onBrowse?: () => void;
}

function isActiveRecently(value: Date | null) {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() < 24 * 60 * 60 * 1000;
}

export function JoinedHubStrip({ communities, onBrowse }: JoinedHubStripProps) {
  const orderedCommunities = [...communities].sort((a, b) => {
    const aActivity = a.latestActivityAt ? new Date(a.latestActivityAt).getTime() : 0;
    const bActivity = b.latestActivityAt ? new Date(b.latestActivityAt).getTime() : 0;
    return bActivity - aActivity || b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <section aria-labelledby="your-hubs-heading" className="px-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p id="your-hubs-heading" className="text-sm font-black tracking-tight text-foreground">
            Your hubs
          </p>
          <p className="text-[11px] text-muted-foreground">Jump back into your campus circles</p>
        </div>
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
        >
          Browse
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {orderedCommunities.map((community) => {
          const active = isActiveRecently(community.latestActivityAt);
          const avatar = getAvatarUrl(community.avatarUrl, community.name);

          return (
            <Link
              key={community.id}
              href={"/app/communities/" + (community.slug || community.id)}
              className="group flex w-16 shrink-0 snap-start flex-col items-center gap-1.5"
              aria-label={"Open c/" + community.name}
            >
              <span
                className={cn(
                  "relative flex size-14 items-center justify-center rounded-full p-0.5 transition-transform group-active:scale-95",
                  active
                    ? "bg-linear-to-tr from-primary via-primary/70 to-emerald-400"
                    : "bg-muted"
                )}
              >
                <span className="flex size-full items-center justify-center rounded-full bg-background p-0.5">
                  <Avatar className="size-full rounded-full">
                    <AvatarImage src={avatar} alt="" className="object-cover" />
                    <AvatarFallback className="bg-muted text-xs font-black">
                      {community.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </span>
                {active && (
                  <span
                    className="absolute bottom-0.5 right-0.5 size-3 rounded-full border-2 border-background bg-primary"
                    aria-label="Recent activity"
                  />
                )}
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-foreground">
                {community.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onBrowse}
          className="group flex w-16 shrink-0 snap-start flex-col items-center gap-1.5 text-left"
          aria-label="Browse more communities"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-dashed border-border/70 bg-muted/30 text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
            <Plus className="size-5" />
          </span>
          <span className="w-full truncate text-center text-[10px] font-bold text-muted-foreground">Discover</span>
        </Link>
      </div>

      {communities.length === 0 && (
        <div className="mt-3 rounded-2xl bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground shadow-2xs">
              <Users className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">Build your first hub list</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Join a club, batch, hobby, or academic circle and it will appear here.
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowse}
              className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-black text-background"
            >
              Explore
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
