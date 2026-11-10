"use client";

import { Heart, HeartCrack, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CrushSearchDialog } from "./crush-search-dialog";
import { CrushSlotRow, EmptyCrushSlot } from "./crush-slot-row";
import { useSecretCrush } from "./use-secret-crush";

/**
 * Secret Crush: pick up to 5 students. Nobody is told unless the feeling is mutual.
 * Used on /crush and on the Campus Match "Crush" tab.
 */
export function SecretCrushPanel({ onNavigate }: { onNavigate?: () => void }) {
  const crush = useSecretCrush();
  const [searchOpen, setSearchOpen] = useState(false);
  const excludeIds = useMemo(() => new Set(crush.crushes.map((c) => c.targetId)), [crush.crushes]);

  if (crush.isLoading && !crush.data) return <SecretCrushSkeleton />;

  if (crush.error && !crush.data) {
    return (
      <EmptyState
        icon={HeartCrack}
        title="Couldn't load your crushes"
        description="Check your connection and try again."
        action={<Button onClick={crush.reload}>Try again</Button>}
      />
    );
  }

  const emptySlots = Math.max(0, crush.maxSlots - crush.crushes.length);

  return (
    <div className="space-y-4">
      {crush.receivedCount > 0 && (
        <p className="flex items-center gap-2.5 rounded-lg bg-crush-subtle px-4 py-3 text-sm font-medium text-crush-text">
          <Heart className="size-4 shrink-0 fill-current" aria-hidden="true" />
          {crush.receivedCount === 1
            ? "1 student has a crush on you. Add yours to see if it's them."
            : `${crush.receivedCount} students have a crush on you. Add yours to see if it's them.`}
        </p>
      )}

      <section aria-labelledby="crush-list-title" className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="crush-list-title" className="text-base font-semibold text-fg">
            Your crushes{" "}
            <span className="font-normal text-fg-muted tabular-nums">
              {crush.usedSlots}/{crush.maxSlots}
            </span>
          </h2>
          <Button variant="crush" size="sm" onClick={() => setSearchOpen(true)} disabled={!crush.canAdd}>
            <Plus />
            Add crush
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {crush.crushes.map((c) => (
            <CrushSlotRow
              key={c.id}
              crush={c}
              removing={crush.removingId === c.id}
              onRemove={() => void crush.remove(c.id)}
              onNavigate={onNavigate}
            />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <EmptyCrushSlot key={`empty-${i}`} onAdd={() => setSearchOpen(true)} disabled={!crush.canAdd} />
          ))}
        </ul>
      </section>

      <p className="text-sm text-fg-muted">
        {crush.attemptsLeft > 0
          ? `You can add ${crush.attemptsLeft} more ${crush.attemptsLeft === 1 ? "person" : "people"} this week. Removing someone doesn't give the add back.`
          : "You've used all your adds for this week. Check back in a few days."}
      </p>

      <CrushSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        excludeIds={excludeIds}
        submitting={crush.submitting}
        onPick={(u) => crush.add(u.id, u.displayName)}
      />
    </div>
  );
}

export function SecretCrushSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your crushes">
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
