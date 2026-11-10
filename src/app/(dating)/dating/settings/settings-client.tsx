"use client";

import { ChevronRight, HeartCrack, RotateCcw, UserPen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

type Prefs = {
  gender: "DEFAULT" | "MALE" | "FEMALE" | "ALL";
  scope: "GLOBAL" | "CAMPUS";
  sort: "COMPATIBILITY" | "RECENT" | "POPULAR";
  isEnabled?: boolean;
};

type PrefsResponse = {
  preferences: Prefs;
  recommendedGender: "MALE" | "FEMALE" | "ALL";
};

/** 44px segments that wrap long labels instead of overflowing at 360px. */
const SEGMENTS = "*:h-auto *:min-h-11 *:min-w-0 *:px-2 *:py-1.5 *:text-center *:leading-tight *:whitespace-normal";

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsClient() {
  const { data, error, isLoading, mutate } = useSWR<PrefsResponse>("/api/dating/preferences", fetcher);
  const [resetting, setResetting] = useState(false);
  const prefs = data?.preferences;

  async function save(updates: Partial<Prefs>) {
    if (!prefs || !data) return;
    sounds.tap();
    haptics.light();
    void mutate({ ...data, preferences: { ...prefs, ...updates } }, { revalidate: false });
    try {
      const res = await fetch("/api/dating/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Couldn't save. Check your connection and try again.");
    }
    void mutate();
  }

  async function resetSwipes() {
    haptics.medium();
    setResetting(true);
    const res = await fetch("/api/dating/swipe", { method: "DELETE" }).catch(() => null);
    setResetting(false);
    if (res?.ok) toast.success("Skipped profiles will show up again.");
    else toast.error("Couldn't reset. Try again in a moment.");
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 py-2" aria-busy="true">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (!prefs || !data) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-2">
        <EmptyState
          icon={HeartCrack}
          title="Couldn't load your settings"
          description={error ? "Check your connection and try again." : undefined}
          action={<Button onClick={() => void mutate()}>Try again</Button>}
        />
      </div>
    );
  }

  const isEnabled = prefs.isEnabled !== false;
  const gender = prefs.gender === "DEFAULT" ? data.recommendedGender : prefs.gender;

  return (
    <div className="mx-auto w-full max-w-lg flex-1 space-y-7 px-4 py-2 pb-10">
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3.5">
        <span>
          <span className="block text-base font-semibold text-fg">Show my profile</span>
          <span className="block text-sm text-fg-muted">
            {isEnabled ? "People can find you in Campus Match." : "Hidden. New people can't see you."}
          </span>
        </span>
        <Switch checked={isEnabled} onCheckedChange={(on) => void save({ isEnabled: on })} />
      </label>

      <Group title="Who you see">
        <SegmentedControl
          aria-label="Colleges to show"
          fullWidth
          className={SEGMENTS}
          value={prefs.scope}
          onChange={(scope) => void save({ scope })}
          options={[
            { value: "CAMPUS", label: "My college" },
            { value: "GLOBAL", label: "All colleges" },
          ]}
        />
        <SegmentedControl
          aria-label="Show me"
          fullWidth
          className={SEGMENTS}
          value={gender}
          onChange={(g) => void save({ gender: g })}
          options={[
            { value: "FEMALE", label: "Girls" },
            { value: "MALE", label: "Guys" },
            { value: "ALL", label: "Everyone" },
          ]}
        />
      </Group>

      <Group title="Show first">
        <SegmentedControl
          aria-label="Order of profiles"
          fullWidth
          className={SEGMENTS}
          value={prefs.sort}
          onChange={(sort) => void save({ sort })}
          options={[
            { value: "COMPATIBILITY", label: "Same interests" },
            { value: "RECENT", label: "Active" },
            { value: "POPULAR", label: "Popular" },
          ]}
        />
      </Group>

      <Group title="Your profile">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          <Link
            href="/profile/edit"
            className="flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-medium text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <UserPen className="size-5 text-fg-muted" aria-hidden="true" />
            <span className="flex-1">Edit photos and bio</span>
            <ChevronRight className="size-4 text-fg-subtle" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => void resetSwipes()}
            disabled={resetting}
            className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm font-medium text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-60"
          >
            <RotateCcw className="size-5 text-fg-muted" aria-hidden="true" />
            <span className="flex-1">See skipped profiles again</span>
          </button>
        </div>
      </Group>
    </div>
  );
}
