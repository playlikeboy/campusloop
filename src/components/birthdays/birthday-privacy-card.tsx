"use client";

import { Cake, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BirthdayPrivacyCardProps {
  dob?: string | null;
  isPrivate?: boolean;
  isSaving: boolean;
  onToggle: () => void;
}

/** Your own birthday and who can see it. */
export function BirthdayPrivacyCard({ dob, isPrivate, isSaving, onToggle }: BirthdayPrivacyCardProps) {
  return (
    <section
      aria-label="Your birthday"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg">
        <Cake aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{dob ? `Your birthday: ${dob}` : "Add your birthday"}</p>
        <p className="text-sm text-fg-muted">
          {!dob
            ? "So classmates can wish you on the day."
            : isPrivate
              ? "Hidden. Only you can see it."
              : "Shown to other students on CampusLoop."}
        </p>
      </div>
      {dob ? (
        <Button variant="outline" size="sm" loading={isSaving} onClick={onToggle}>
          {isPrivate ? "Show it" : "Hide it"}
        </Button>
      ) : (
        <Button asChild size="sm">
          <Link href="/profile/edit">
            <Plus aria-hidden="true" />
            Add birthday
          </Link>
        </Button>
      )}
    </section>
  );
}
