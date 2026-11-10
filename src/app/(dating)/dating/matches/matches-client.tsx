"use client";

import { HeartCrack, MessageCircle, MessageCircleHeart } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { formatStudyYear, initials } from "@/components/dating/crush-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Sticker } from "@/components/ui/stickers";
import { fetcher } from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

interface MatchedUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  branch?: string | null;
  year?: number | null;
  interests?: string[] | null;
  institution?: { id: string; name: string; slug?: string | null } | null;
}

interface MatchItem {
  id: string;
  matchedAt: string;
  user: MatchedUser;
  conversationId?: string | null;
}

interface MatchesResponse {
  matches: MatchItem[];
  totalCount: number;
}

export function MatchesClient() {
  const { data, error, isLoading, mutate } = useSWR<MatchesResponse>("/api/dating/matches", fetcher, {
    revalidateOnFocus: true,
  });
  const matches = data?.matches ?? [];

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <div className="divide-y divide-border rounded-lg border border-border" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (error && !data) {
    body = (
      <EmptyState
        icon={HeartCrack}
        title="Couldn't load your matches"
        description="Check your connection and try again."
        action={<Button onClick={() => void mutate()}>Try again</Button>}
      />
    );
  } else if (matches.length === 0) {
    body = (
      <EmptyState
        icon={MessageCircleHeart}
        title="No matches yet"
        description="When you and someone both like each other, you can chat here."
        action={
          <Button asChild>
            <Link href="/matching">Start swiping</Link>
          </Button>
        }
      />
    );
  } else {
    const total = data?.totalCount ?? matches.length;
    body = (
      <>
        <Sticker tone="crush" className="mb-4 inline-flex items-baseline gap-1.5 px-3.5 py-2">
          <span className="sticker-caption text-2xl tabular-nums">{total}</span>
          <span className="text-sm font-semibold">{total === 1 ? "match" : "matches"}</span>
        </Sticker>
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {matches.map((m) => {
          const detail =
            [m.user.branch, formatStudyYear(m.user.year)].filter(Boolean).join(" · ") ||
            m.user.institution?.name?.split(",")[0];
          return (
            <li key={m.id}>
              <Link
                href={m.conversationId ? `/chat/${m.conversationId}` : "/chat"}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <Avatar className="size-12 shrink-0">
                  <AvatarImage src={getAvatarUrl(m.user.avatarUrl, m.user.username)} alt="" />
                  <AvatarFallback className="bg-crush-subtle font-semibold text-crush-text">
                    {initials(m.user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{m.user.displayName}</p>
                  {detail && <p className="truncate text-xs text-fg-muted">{detail}</p>}
                </div>
                <MessageCircle className="size-5 shrink-0 text-crush-text" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
        </ul>
      </>
    );
  }

  return <div className="mx-auto w-full max-w-lg flex-1 px-4 py-2">{body}</div>;
}
