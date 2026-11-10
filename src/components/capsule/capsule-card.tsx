"use client";

import { CalendarClock, Eye, EyeOff, Lock, Plus, Unlock } from "lucide-react";
import { useState } from "react";
import { CapsuleCountdown } from "@/components/capsule/capsule-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { MySealedEntries, OpenedEntries } from "./capsule-entry-list";
import { capsuleCategoryLabel, formatCapsuleDate } from "./capsule-labels";

interface CapsuleCardProps {
  capsule: any;
  currentUserId?: string;
  onOpenBuryModal: (capsuleId: string, capsuleTitle: string) => void;
}

export function CapsuleCard({ capsule, onOpenBuryModal }: CapsuleCardProps) {
  const isUnlocked = Boolean(capsule.isUnlocked);
  const [showEntries, setShowEntries] = useState(isUnlocked);
  const count: number = capsule.totalEntriesBuried ?? capsule.entriesCount ?? 0;
  const entries = capsule.entries ?? [];

  return (
    <Card className="overflow-hidden">
      {capsule.coverImage && (
        <img src={capsule.coverImage} alt="" loading="lazy" className="h-40 w-full object-cover sm:h-48" />
      )}

      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isUnlocked ? "success" : "neutral"}>
            {isUnlocked ? <Unlock className="size-3" aria-hidden /> : <Lock className="size-3" aria-hidden />}
            {isUnlocked ? "Open" : "Closed"}
          </Badge>
          <Badge variant="outline">{capsuleCategoryLabel(capsule.category)}</Badge>
        </div>
        <CardTitle className="text-lg">{capsule.title}</CardTitle>
        {capsule.description && <CardDescription>{capsule.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <CalendarClock className="size-4 shrink-0" aria-hidden />
          {isUnlocked ? "Opened" : "Opens"} {formatCapsuleDate(capsule.targetUnlockDate)}
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {count} {count === 1 ? "entry" : "entries"}
          </span>
        </p>

        {!isUnlocked && <CapsuleCountdown targetDate={capsule.targetUnlockDate} />}

        {!isUnlocked && entries.length > 0 && <MySealedEntries entries={entries} />}

        {isUnlocked && showEntries && <OpenedEntries entries={entries} />}

        <div className="flex justify-end">
          {!isUnlocked ? (
            <Button
              onClick={() => {
                sounds.tap();
                haptics.light();
                onOpenBuryModal(capsule.id, capsule.title);
              }}
            >
              <Plus aria-hidden />
              Add to capsule
            </Button>
          ) : (
            <Button
              variant="secondary"
              aria-expanded={showEntries}
              onClick={() => {
                sounds.tap();
                setShowEntries((v) => !v);
              }}
            >
              {showEntries ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {showEntries ? "Hide entries" : "See entries"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
