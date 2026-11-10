"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSecretCrush } from "./use-secret-crush";

interface SecretCrushButtonProps {
  targetId: string;
  targetName: string;
  className?: string;
  iconOnly?: boolean;
}

/** Profile action: add this person as a secret crush after a short confirm. */
export function SecretCrushButton({ targetId, targetName, className, iconOnly }: SecretCrushButtonProps) {
  const [open, setOpen] = useState(false);
  const crush = useSecretCrush(open);
  const alreadyAdded = crush.crushes.some((c) => c.targetId === targetId);
  const loaded = !!crush.data;

  let note = `${targetName} is only told if they add you too.`;
  if (alreadyAdded) note = `${targetName} is already on your crush list.`;
  else if (loaded && !crush.canAdd)
    note =
      crush.attemptsLeft > 0
        ? `Your list is full (${crush.maxSlots} people). Remove someone first.`
        : "You've used all your adds for this week. Check back in a few days.";
  else if (loaded)
    note += ` You can add ${crush.attemptsLeft} more ${crush.attemptsLeft === 1 ? "person" : "people"} this week.`;

  return (
    <>
      <Button
        variant="outline"
        size={iconOnly ? "icon" : "sm"}
        onClick={() => setOpen(true)}
        className={cn("text-crush-text", className)}
        aria-label={`Add ${targetName} as a secret crush`}
      >
        <Heart className="fill-current" />
        {!iconOnly && <span className="hidden text-fg sm:inline">Secret crush</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {targetName} as a secret crush?</DialogTitle>
            <DialogDescription>{note}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              variant="crush"
              className="sm:flex-1"
              loading={crush.submitting}
              disabled={!loaded || alreadyAdded || !crush.canAdd}
              onClick={async () => {
                if (await crush.add(targetId, targetName)) setOpen(false);
              }}
            >
              Add secret crush
            </Button>
            <Button variant="ghost" className="sm:flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
          <Link
            href="/crush"
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            See your crush list
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
