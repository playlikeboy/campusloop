"use client";

import { Heart, School, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { DatingMatchModal } from "@/components/dating/dating-match-modal";
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
  const { data, isLoading, mutate } = useSWR<{ likes: Admirer[] }>("/api/dating/likes", fetcher);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const likes = data?.likes ?? [];

  async function swipe(admirer: Admirer, direction: "LIKE" | "PASS") {
    // Optimistically remove the card
    void mutate({ likes: likes.filter((l) => l.id !== admirer.id) }, { revalidate: false });
    try {
      const res = await fetch("/api/dating/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: admirer.id, direction }),
      });
      if (res.ok && direction === "LIKE") {
        const result = (await res.json()) as MatchResult;
        if (result.matched) setMatchResult(result);
      }
    } catch {
      toast.error("Something went wrong");
    }
    void mutate();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 sm:px-4 text-foreground select-none">
      <div className="flex-1 py-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-3/4 rounded-2xl overflow-hidden relative border border-border/30">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : likes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="size-16 rounded-3xl bg-pink-500/10 text-pink-600 flex items-center justify-center border border-pink-500/20 shadow-xs">
              <Heart className="size-8 fill-pink-500 text-pink-500" />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-base font-black text-foreground">No pending admirers</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep swiping on the campus deck or upload fresh photos to appear on more classmate screens!
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/dating"
                className="text-xs font-black text-white bg-pink-600 hover:bg-pink-700 px-5 py-2.5 rounded-full shadow-md shadow-pink-600/20 active:scale-95 transition-all"
              >
                Start Swiping
              </Link>
              <Link
                href="/profile/edit"
                className="text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/60 px-4 py-2.5 rounded-full border border-border/40 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {likes.map((admirer) => (
              <div
                key={admirer.id}
                className="relative overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-md group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={admirer.photo ?? getAvatarUrl(admirer.avatarUrl, admirer.username)}
                  alt={admirer.displayName}
                  className="aspect-3/4 w-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
                  <div>
                    <p className="truncate text-sm font-black text-white">
                      {admirer.displayName}
                      {admirer.year ? ` · Yr ${admirer.year}` : ""}
                    </p>
                    {admirer.institutionName && (
                      <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-white/70">
                        <School className="size-2.5 shrink-0" /> {admirer.institutionName.split(",")[0]}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => swipe(admirer, "PASS")}
                      aria-label={`Pass on ${admirer.displayName}`}
                      className="flex h-8.5 flex-1 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-92 cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => swipe(admirer, "LIKE")}
                      aria-label={`Match with ${admirer.displayName}`}
                      className="flex h-8.5 flex-1 items-center justify-center rounded-xl bg-pink-600 text-white shadow-sm transition-all hover:bg-pink-700 active:scale-92 cursor-pointer"
                    >
                      <Heart className="size-4 fill-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DatingMatchModal matchResult={matchResult} onClose={() => setMatchResult(null)} />
    </div>
  );
}
