"use client";

import {
  Heart,
  MessageCircle,
  MessageCircleHeart,
  School,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CuteCatEmpty } from "@/components/ui/cute-illustrations";
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
  institution?: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
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
  const { data, isLoading } = useSWR<MatchesResponse>("/api/dating/matches", fetcher, {
    revalidateOnFocus: true,
  });

  const matches = data?.matches ?? [];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 sm:px-4 text-foreground select-none">
      <div className="flex-1 py-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border/40">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-3xl border border-border/80 bg-card p-8 my-4 shadow-2xs">
            <CuteCatEmpty size={100} className="mb-1" />
            <div className="space-y-1.5 max-w-xs">
              <h3 className="font-heading font-bold text-base text-foreground">No mutual matches yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you and another classmate both swipe right on each other, you&apos;ll be able to chat here!
              </p>
            </div>
            <div className="pt-2">
              <Link href="/dating">
                <Button size="default">
                  <Sparkles className="size-3.5" />
                  <span>Keep Swiping</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* New Matches Horizontal Scroll */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Recent Matches ({matches.length})
                </span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {matches.map((m) => {
                  const chatHref = m.conversationId ? `/chat/${m.conversationId}` : "/chat";
                  return (
                    <Link
                      key={m.id}
                      href={chatHref}
                      className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                    >
                      <div className="relative size-14 rounded-full ring-2 ring-pink-500/80 ring-offset-2 ring-offset-background p-0.5 group-hover:scale-105 transition-transform">
                        <Avatar className="size-full">
                          <AvatarImage src={m.user.avatarUrl ?? getAvatarUrl(m.user.avatarUrl, m.user.username)} />
                          <AvatarFallback className="bg-pink-500/20 text-pink-600 font-black text-sm">
                            {m.user.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                      </div>
                      <span className="text-[11px] font-bold text-foreground truncate max-w-[64px] text-center">
                        {m.user.displayName.split(" ")[0]}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Match Conversations List */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                All Conversations
              </span>
              <div className="divide-y divide-border/30 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden">
                {matches.map((m) => {
                  const chatHref = m.conversationId ? `/chat/${m.conversationId}` : "/chat";
                  return (
                    <Link
                      key={m.id}
                      href={chatHref}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-11 shrink-0 ring-1 ring-border/50">
                          <AvatarImage src={m.user.avatarUrl ?? getAvatarUrl(m.user.avatarUrl, m.user.username)} />
                          <AvatarFallback className="bg-pink-500/15 text-pink-600 font-black">
                            {m.user.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-black text-foreground truncate group-hover:text-pink-600 transition-colors">
                              {m.user.displayName}
                            </p>
                            {m.user.year && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                · Yr {m.user.year}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <School className="size-3 shrink-0" />
                            <span>
                              {m.user.branch || m.user.institution?.name?.split(",")[0] || "Verified Student"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex size-8 items-center justify-center rounded-full bg-pink-500/10 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-all shadow-2xs">
                          <MessageCircle className="size-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
