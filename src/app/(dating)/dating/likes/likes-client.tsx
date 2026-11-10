"use client";

import { Heart, HeartCrack, School, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { formatStudyYear } from "@/components/dating/crush-types";
import { DatingMatchModal } from "@/components/dating/dating-match-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

type Admirer = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  photo: string | null;
  year: number | null;
  institutionName: string | null;
};

type MatchResult = {
  matched: boolean;
  conversationId?: string;
  matchedUser?: { displayName: string; avatarUrl: string | null };
};

export function LikesClient() {
  const { data, error, isLoading, mutate } = useSWR<{ likes: Admirer[] }>("/api/dating/likes", fetcher);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const likes = data?.likes ?? [];

  async function respond(admirer: Admirer, direction: "LIKE" | "PASS") {
    void mutate({ likes: likes.filter((l) => l.id !== admirer.id) }, { revalidate: false });
    try {
      const res = await fetch("/api/dating/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: admirer.id, direction }),
      });
      if (!res.ok) throw new Error();
      if (direction === "LIKE") {
        const result = (await res.json()) as MatchResult;
        if (result.matched) setMatchResult(result);
      }
    } catch {
      toast.error("That didn't go through. Check your connection and try again.");
    }
    void mutate();
  }

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading likes">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-3/4 w-full rounded-lg" />
        ))}
      </div>
    );
  } else if (error && !data) {
    body = (
      <EmptyState
        icon={HeartCrack}
        title="Couldn't load your likes"
        description="Check your connection and try again."
        action={<Button onClick={() => void mutate()}>Try again</Button>}
      />
    );
  } else if (likes.length === 0) {
    body = (
      <EmptyState
        icon={Heart}
        title="No likes yet"
        description="When someone likes you, they show up here."
        action={
          <Button variant="crush" asChild>
            <Link href="/matching">Start swiping</Link>
          </Button>
        }
      />
    );
  } else {
    body = (
      <>
        <p className="mb-3 text-sm text-fg-muted">Like them back to match and start chatting.</p>
        <ul className="grid grid-cols-2 gap-3">
          {likes.map((admirer) => {
            const year = formatStudyYear(admirer.year);
            return (
              <li key={admirer.id} className="relative overflow-hidden rounded-lg bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={admirer.photo ?? getAvatarUrl(admirer.avatarUrl, admirer.username)}
                  alt={admirer.displayName}
                  className="aspect-3/4 w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 space-y-2 p-2.5 text-white">
                  <div className="px-0.5">
                    <p className="truncate text-sm font-semibold">{admirer.displayName}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-white/80">
                      {admirer.institutionName ? (
                        <>
                          <School className="size-3 shrink-0" aria-hidden="true" />
                          {admirer.institutionName.split(",")[0]}
                        </>
                      ) : (
                        year
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => void respond(admirer, "PASS")}
                      aria-label={`Pass on ${admirer.displayName}`}
                      className="flex-1"
                    >
                      <X />
                    </Button>
                    <Button
                      variant="crush"
                      size="icon"
                      onClick={() => void respond(admirer, "LIKE")}
                      aria-label={`Like ${admirer.displayName} back`}
                      className="flex-1"
                    >
                      <Heart className="fill-current" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-2">
      {body}
      <DatingMatchModal matchResult={matchResult} onClose={() => setMatchResult(null)} />
    </div>
  );
}
