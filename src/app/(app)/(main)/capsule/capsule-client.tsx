"use client";

import { Hourglass, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { CapsuleBuryModal } from "@/components/capsule/capsule-bury-modal";
import { CapsuleCard } from "@/components/capsule/capsule-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface CapsuleClientProps {
  initialCapsules: any[];
  profileId: string;
  collegeName?: string;
  /** False when the student has no college on their profile yet. */
  hasCollege?: boolean;
}

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "SEALED", label: "Closed" },
  { id: "UNLOCKED", label: "Open" },
  { id: "CONVOCATION", label: "Graduation" },
  { id: "BATCH_MEMORIES", label: "Batch memories" },
  { id: "PREDICTIONS", label: "Predictions" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function CapsuleClient({
  initialCapsules,
  profileId,
  collegeName,
  hasCollege = true,
}: CapsuleClientProps) {
  const { data, mutate, error, isValidating } = useSWR<{ capsules: any[] }>("/api/capsules", fetcher, {
    fallbackData: { capsules: initialCapsules },
  });

  const [activeFilter, setActiveFilter] = useState<FilterId>("ALL");
  const [buryTarget, setBuryTarget] = useState<{ id: string; title: string } | null>(null);

  const capsules = data?.capsules || initialCapsules;
  const filtered = capsules.filter((c: any) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "SEALED") return !c.isUnlocked;
    if (activeFilter === "UNLOCKED") return c.isUnlocked;
    return c.category === activeFilter;
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-4 pb-24">
      <PageHeader
        title="Time capsule"
        description={`Write something for later${collegeName ? ` with ${collegeName.split(",")[0]}` : ""}. Nobody else reads it until the opening date.`}
      >
        <fieldset className="-mx-4 flex min-w-0 gap-2 overflow-x-auto border-0 px-4 no-scrollbar">
          <legend className="sr-only">Filter capsules</legend>
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              selected={activeFilter === f.id}
              onClick={() => {
                sounds.tap();
                haptics.light();
                setActiveFilter(f.id);
              }}
              className="shrink-0"
            >
              {f.label}
            </Chip>
          ))}
        </fieldset>
      </PageHeader>

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md bg-danger-subtle p-3 text-sm"
        >
          <p className="text-fg">Couldn't load the latest capsules. Showing what we had.</p>
          <Button size="sm" variant="secondary" onClick={() => void mutate()} loading={isValidating}>
            <RefreshCw aria-hidden />
            Try again
          </Button>
        </div>
      ) : null}

      {!hasCollege ? (
        <EmptyState
          icon={Hourglass}
          title="Add your college first"
          description="Capsules belong to a college. Add yours to your profile to see them."
          action={
            <Button asChild>
              <Link href="/settings">Go to settings</Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Hourglass}
          title={activeFilter === "ALL" ? "No capsules yet" : "Nothing here"}
          description={
            activeFilter === "ALL"
              ? "When your college starts a capsule, it shows up here."
              : "No capsules match this filter."
          }
          action={
            activeFilter !== "ALL" ? (
              <Button variant="secondary" onClick={() => setActiveFilter("ALL")}>
                Show all
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((capsule: any) => (
            <CapsuleCard
              key={capsule.id}
              capsule={capsule}
              currentUserId={profileId}
              onOpenBuryModal={(id, title) => setBuryTarget({ id, title })}
            />
          ))}
        </div>
      )}

      {buryTarget && (
        <CapsuleBuryModal
          isOpen
          onClose={() => setBuryTarget(null)}
          capsuleId={buryTarget.id}
          capsuleTitle={buryTarget.title}
          onEntryBuried={() => mutate()}
        />
      )}
    </div>
  );
}
