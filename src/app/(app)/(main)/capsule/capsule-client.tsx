"use client";

import { Archive, History, Hourglass } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { CapsuleBuryModal } from "@/components/capsule/capsule-bury-modal";
import { CapsuleCard } from "@/components/capsule/capsule-card";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface CapsuleClientProps {
  initialCapsules: any[];
  profileId: string;
  collegeName?: string;
}

export function CapsuleClient({ initialCapsules, profileId }: CapsuleClientProps) {
  const { data, mutate, error } = useSWR<{ capsules: any[] }>("/api/capsules", fetcher, {
    fallbackData: { capsules: initialCapsules },
  });

  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedCapsuleForBury, setSelectedCapsuleForBury] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const capsules = data?.capsules || initialCapsules;

  const filteredCapsules = capsules.filter((c: any) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "SEALED") return !c.isUnlocked;
    if (activeFilter === "UNLOCKED") return c.isUnlocked;
    return c.category === activeFilter;
  });

  function handleOpenBuryModal(id: string, title: string) {
    setSelectedCapsuleForBury({ id, title });
  }

  function handleEntryBuried() {
    mutate();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col min-h-screen pb-24 border-x border-border/20">
      {/* Sticky Header */}
      <header className="sticky top-12 lg:top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <Hourglass className="size-5 text-amber-500" />
            <span>Campus Time Capsule</span>
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
          {[
            { id: "ALL", label: "All Capsules" },
            { id: "SEALED", label: "Sealed Vaults" },
            { id: "UNLOCKED", label: "Unlocked Museum" },
            { id: "CONVOCATION", label: "Convocation" },
            { id: "BATCH_MEMORIES", label: "Batch Memories" },
            { id: "PREDICTIONS", label: "Predictions" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setActiveFilter(f.id);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0",
                activeFilter === f.id
                  ? "bg-foreground text-background font-black shadow-xs"
                  : "bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Intro Feature Banner */}
      <div className="p-4">
        <div className="rounded-3xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500">
            <Archive className="size-4" />
            <span>Unique Institutional Vault</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-foreground">
            Bury predictions & letters for your future campus self.
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Entries stay hidden from other students in CampusLoop until the target date, then become part of
            a shared campus memory wall. Only add something you are comfortable revealing at unlock time.
          </p>
        </div>
      </div>

      {error ? (
        <div role="alert" className="mx-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <History className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">Capsules couldn’t refresh</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Showing the last available list where possible. Try again to fetch the latest entries and unlock states.
            </p>
            <button
              type="button"
              onClick={() => void mutate()}
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-background px-3 text-xs font-bold text-foreground ring-1 ring-border transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {/* Capsules Stream */}
      <div className="px-4 space-y-4">
        {filteredCapsules.map((capsule: any) => (
          <CapsuleCard
            key={capsule.id}
            capsule={capsule}
            currentUserId={profileId}
            onOpenBuryModal={handleOpenBuryModal}
          />
        ))}

        {filteredCapsules.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <History className="size-10 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No capsules in this category</h3>
            <p className="text-xs text-muted-foreground">
              Check back soon as your college batch creates new milestone vaults!
            </p>
          </div>
        )}
      </div>

      {/* Bury Memory Modal */}
      {selectedCapsuleForBury && (
        <CapsuleBuryModal
          isOpen={!!selectedCapsuleForBury}
          onClose={() => setSelectedCapsuleForBury(null)}
          capsuleId={selectedCapsuleForBury.id}
          capsuleTitle={selectedCapsuleForBury.title}
          onEntryBuried={handleEntryBuried}
        />
      )}
    </div>
  );
}
