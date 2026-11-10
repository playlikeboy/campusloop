"use client";

import { Loader2, Pin, Search, Trash2, TrendingUp, User, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchResults {
  posts: Array<{ id: string; label: string; type: string; isAnonymous: boolean; votes: number }>;
  profiles: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    points: number;
  }>;
}

type BoostMode = "NUDGE" | "PROMOTE" | "PIN" | "BURY";

interface BoostRow {
  id: string;
  targetType: "POST" | "PROFILE";
  targetId: string;
  multiplier: number;
  mode: BoostMode;
  scope: "GLOBAL" | "INSTITUTION";
  expiresAt: string | null;
  reason: string | null;
  createdAt: string;
  target: { kind: "POST" | "PROFILE"; label: string; username?: string } | null;
}

type Selection = { kind: "POST"; id: string; label: string } | { kind: "PROFILE"; id: string; label: string };

/**
 * Four honest modes.
 *
 * These are tiers, not just multipliers, because a multiplier alone cannot
 * promote: ranking scores span four orders of magnitude, so scaling a decayed
 * score leaves an old post exactly where it was. Only NUDGE is purely
 * multiplicative, and its description says so.
 */
const MODES: Array<{ mode: BoostMode; label: string; multiplier: number; hint: string }> = [
  { mode: "NUDGE", label: "Nudge", multiplier: 1.6, hint: "Weights the score. Blends in — may not surface." },
  { mode: "PROMOTE", label: "Promote", multiplier: 3, hint: "Ranks above every organic post." },
  { mode: "PIN", label: "Make it viral", multiplier: 8, hint: "Top of the feed, above promoted posts." },
  { mode: "BURY", label: "Bury", multiplier: 0.3, hint: "Sinks below everything, without deleting it." },
];

const DURATIONS = [
  { label: "6 hours", hours: 6 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "Indefinite", hours: 0 },
];

export function FeedBoostsClient() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mode, setMode] = useState<BoostMode>("PROMOTE");
  const [multiplier, setMultiplier] = useState(3);
  const [durationHours, setDurationHours] = useState(24);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading: isSearching } = useSWR<SearchResults>(
    debounced.length >= 2 ? `/api/admin/feed-boosts/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher
  );

  const { data: boostData, mutate } = useSWR<{ boosts: BoostRow[] }>("/api/admin/feed-boosts", fetcher, {
    refreshInterval: 30_000,
  });
  const boosts = boostData?.boosts ?? [];

  async function applyBoost() {
    if (!selection) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/feed-boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: selection.kind,
          targetId: selection.id,
          mode,
          multiplier,
          durationHours,
          reason: reason.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not apply boost");

      const modeLabel = MODES.find((m) => m.mode === mode)?.label ?? mode;
      toast.success(
        `${selection.kind === "POST" ? "Post" : `@${selection.label}`} — ${modeLabel} applied, live within a minute`
      );
      setSelection(null);
      setReason("");
      setQuery("");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not apply boost");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeBoost(id: string) {
    try {
      const res = await fetch(`/api/admin/feed-boosts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Boost removed");
      mutate();
    } catch {
      toast.error("Couldn't remove the boost. Try again.");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <p className="max-w-2xl text-sm text-fg-muted">
        A <span className="font-semibold text-fg">boost</span> raises a post in every feed except Latest and
        Random. A <span className="font-semibold text-fg">pin</span> puts it first everywhere except Random.
        Changes show within a minute.
      </p>

      {/* ── Pick a target ── */}
      <section className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
          <input
            aria-label="Find a post or student"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a post, a student, an @username or an ID"
            className={cn(fieldClassName, "w-full pl-10 pr-4 h-11")}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-fg-muted" />
          )}
        </div>

        {selection ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-subtle-border bg-brand-subtle p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-text">
                {selection.kind === "POST" ? "Post" : "Student"}
              </p>
              <p className="text-sm font-bold text-fg truncate">{selection.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="text-xs font-bold text-fg-muted hover:text-fg cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        ) : (
          results && (
            <div className="space-y-3">
              {results.profiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-fg-muted">Students</p>
                  {results.profiles.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelection({ kind: "PROFILE", id: person.id, label: person.username })}
                      className="w-full flex items-center gap-3 rounded-lg border border-border p-2.5 text-left hover:border-border hover:bg-surface-muted cursor-pointer"
                    >
                      <User className="size-4 text-fg-muted shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-fg truncate">{person.displayName}</span>
                        <span className="block text-xs text-fg-muted">
                          @{person.username} · {person.points} LP
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.posts.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-fg-muted">Posts</p>
                  {results.posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setSelection({ kind: "POST", id: post.id, label: post.label })}
                      className="w-full flex items-center gap-3 rounded-lg border border-border p-2.5 text-left hover:border-border hover:bg-surface-muted cursor-pointer"
                    >
                      <Zap className="size-4 text-fg-muted shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-fg truncate">{post.label}</span>
                        <span className="block text-xs text-fg-muted">
                          {post.type} · {post.votes} votes
                          {post.isAnonymous && " · anonymous"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.posts.length === 0 && results.profiles.length === 0 && (
                <p className="text-xs text-fg-muted py-2">Nothing matches. Try other words.</p>
              )}
            </div>
          )
        )}
      </section>

      {/* ── Configure and apply ── */}
      {selection && (
        <section className="rounded-lg border border-border bg-surface p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-fg mb-2">How hard</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODES.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => {
                    setMode(option.mode);
                    setMultiplier(option.multiplier);
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-ui cursor-pointer",
                    mode === option.mode
                      ? "border-brand bg-brand-subtle ring-1 ring-ring"
                      : "border-border hover:border-border"
                  )}
                >
                  <span className="block text-xs font-bold text-fg">{option.label}</span>
                  <span className="block text-xs text-fg-muted">{option.hint}</span>
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 text-xs text-fg-muted">
              <span className="font-bold text-fg">Weight</span>
              <input
                type="number"
                min={0.01}
                max={25}
                step={0.1}
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className={cn(fieldClassName, "w-24 font-mono h-11")}
              />
              <span>× — orders posts within the same mode. Capped at 25.</span>
            </label>
          </div>

          <div>
            <p className="text-xs font-bold text-fg mb-2">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((duration) => (
                <Chip
                  size="sm"
                  selected={durationHours === duration.hours}
                  key={duration.label}
                  onClick={() => setDurationHours(duration.hours)}
                >
                  {duration.label}
                </Chip>
              ))}
            </div>
          </div>

          <input
            aria-label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (saved with your name)"
            className={cn(fieldClassName, "w-full h-11")}
          />

          <button
            type="button"
            onClick={applyBoost}
            disabled={isSaving}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <TrendingUp className="size-4" />}
            Apply boost
          </button>
        </section>
      )}

      {/* ── Live boosts ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-fg">
          Live boosts {boosts.length > 0 && <span className="text-fg-muted">({boosts.length})</span>}
        </h2>

        {boosts.length === 0 ? (
          <p className="text-xs text-fg-muted rounded-lg border border-dashed border-border p-6 text-center">
            Nothing is boosted right now.
          </p>
        ) : (
          <div className="space-y-2">
            {boosts.map((boost) => (
              <div
                key={boost.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    boost.mode === "BURY"
                      ? "bg-surface-muted text-fg-muted"
                      : "bg-brand-subtle text-brand-text"
                  )}
                >
                  {boost.mode === "PIN" ? <Pin className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-fg truncate">
                    {boost.target?.label ?? <span className="text-fg-muted italic">target deleted</span>}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {boost.targetType === "PROFILE" ? "every post by this student" : "single post"} ·{" "}
                    {boost.mode.toLowerCase()} · {boost.multiplier}× ·{" "}
                    {boost.expiresAt ? `until ${new Date(boost.expiresAt).toLocaleString()}` : "indefinite"}
                    {boost.reason && ` · ${boost.reason}`}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeBoost(boost.id)}
                  title="Remove boost"
                  aria-label="Remove boost"
                  className="hover:bg-danger-subtle hover:text-danger"
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
