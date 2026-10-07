"use client";

import {
  Crown,
  Flame,
  Heart,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface SecretCrushItem {
  id: string;
  targetId: string;
  target: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    branch?: string | null;
    year?: number | null;
  };
  isMutual: boolean;
  matchedAt?: string | null;
  createdAt: string;
}

interface SecretCrushResponse {
  crushes: SecretCrushItem[];
  usedSlots: number;
  maxSlots: number;
  remainingSlots: number;
  receivedCrushesCount: number;
  slotProgress?: {
    isExpanded: boolean;
    maxSlots: number;
    points: number;
    threshold: number;
    pointsNeeded: number;
    progressPercent: number;
  };
}

const fetcher = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<T>;
  });

export function RequestsClient() {
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, mutate, isLoading } = useSWR<SecretCrushResponse>("/api/dating/crush", fetcher);

  const crushes = data?.crushes || [];
  const usedSlots = data?.usedSlots || 0;
  const maxSlots = data?.maxSlots || 5;
  const receivedCrushesCount = data?.receivedCrushesCount || 0;
  const slotProgress = data?.slotProgress;

  const displaySlotCount = maxSlots <= 5 ? maxSlots : Math.min(maxSlots, Math.max(usedSlots + 2, 5));
  const slots = Array.from({ length: displaySlotCount }, (_, i) => crushes[i] || null);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const users = (await res.json()) as UserProfile[];
        const existingTargetIds = new Set(crushes.map((c) => c.targetId));
        setSearchResults(users.filter((u) => !existingTargetIds.has(u.id)));
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddCrush(targetId: string) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dating/crush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });

      const resData = (await res.json()) as { error?: string; matched?: boolean };
      if (!res.ok) {
        throw new Error(resData.error || "Failed to add crush");
      }

      if (resData.matched) {
        sounds.match();
        haptics.match();
        toast.success("MUTUAL MATCH! You both secretly liked each other!");
      } else {
        sounds.archive();
        haptics.success();
        toast.success("Locked into your vault! Intent is 100% hidden unless mutual.");
      }

      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add crush");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveCrush(crushId: string) {
    sounds.tap();
    haptics.light();
    setRemovingId(crushId);
    try {
      const res = await fetch(`/api/dating/crush?id=${crushId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to remove crush");
      }
      toast.success("Slot freed up");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 sm:px-4 text-foreground select-none">
      <div className="flex-1 py-2 space-y-4">
        {/* Banner: Mystery Incoming Counter */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-card to-pink-500/10 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">
                <ShieldCheck className="size-3" /> Zero Knowledge Vault
              </span>
              <h2 className="mt-2 text-base font-black tracking-tight text-foreground">
                {receivedCrushesCount > 0 ? (
                  <>
                    <span className="text-purple-600 dark:text-purple-400">{receivedCrushesCount}</span>{" "}
                    classmate{receivedCrushesCount > 1 ? "s have" : " has"} a secret crush on you!
                  </>
                ) : (
                  "Nobody knows until it's mutual"
                )}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Add your campus crushes. They will NEVER be notified unless they also add you to their vault!
              </p>
            </div>
            <div className="size-11 rounded-2xl bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Lock className="size-5" />
            </div>
          </div>
        </div>

        {/* Slot Progress / LP Clout */}
        {slotProgress && (
          <div className="rounded-2xl border border-border/50 bg-card/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1 text-foreground">
                <Crown className="size-3.5 text-amber-500" />
                <span>Vault Capacity: {usedSlots}/{maxSlots} Slots</span>
              </span>
              <span className="text-[11px] text-muted-foreground">{slotProgress.points} LP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${slotProgress.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Secret Crush Slots List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Your Secret Crushes ({usedSlots}/{maxSlots})
            </span>
          </div>

          <div className="space-y-2">
            {slots.map((item, index) => {
              if (!item) {
                return (
                  <button
                    key={`empty-${index}`}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setShowSearchModal(true);
                    }}
                    className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-dashed border-border/70 hover:border-purple-500/60 bg-muted/20 hover:bg-purple-500/5 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground group-hover:text-purple-600 transition-colors">
                        <Plus className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                          Empty Crush Slot #{index + 1}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">Tap to search and add a classmate</p>
                      </div>
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    item.isMutual
                      ? "border-pink-500/50 bg-pink-500/10 shadow-sm"
                      : "border-border/60 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-11 shrink-0 ring-1 ring-border/50">
                      <AvatarImage src={item.target.avatarUrl || undefined} />
                      <AvatarFallback className="bg-purple-500/20 text-purple-700 font-bold">
                        {item.target.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-black text-foreground truncate">
                          {item.target.displayName}
                        </p>
                        {item.isMutual && (
                          <span className="rounded-full bg-pink-600 text-white text-[9px] font-black px-2 py-0.5">
                            Mutual Match!
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        @{item.target.username} {item.target.branch ? `· ${item.target.branch}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.isMutual ? (
                      <Link
                        href="/chat"
                        className="flex size-8 items-center justify-center rounded-xl bg-pink-600 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <MessageSquare className="size-4" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveCrush(item.id)}
                        disabled={removingId === item.id}
                        aria-label="Remove crush"
                        className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Classmate Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-purple-600" />
                <h3 className="text-sm font-black text-foreground">Lock A Secret Crush</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="size-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search classmate by name or handle..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/60 bg-background text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2 min-h-[160px] max-h-[300px]">
              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin text-purple-600" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs font-bold">
                          {user.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{user.displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCrush(user.id)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black shrink-0 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                    >
                      Lock In
                    </button>
                  </div>
                ))
              ) : searchQuery ? (
                <p className="text-center py-8 text-xs text-muted-foreground">No students found</p>
              ) : (
                <p className="text-center py-8 text-xs text-muted-foreground">Type a student&apos;s name or username to search</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
