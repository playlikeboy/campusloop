"use client";

import { EllipsisVertical, PlusSquare, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Platform = "ios" | "android";

const STEPS: Record<Platform, { title: string; steps: React.ReactNode[] }> = {
  android: {
    title: "Add CampusLoop to your home screen",
    steps: [
      <>
        Tap <EllipsisVertical className="inline size-4 align-text-bottom" aria-label="the menu button" /> at
        the top right of Chrome.
      </>,
      <>
        Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </>,
    ],
  },
  ios: {
    title: "Add CampusLoop to your home screen",
    steps: [
      <>
        Tap <Share className="inline size-4 align-text-bottom" aria-label="the Share button" /> at the bottom
        of Safari.
      </>,
      <>
        Tap <strong>Add to Home Screen</strong>{" "}
        <PlusSquare className="inline size-4 align-text-bottom" aria-hidden="true" />.
      </>,
      <>
        Tap <strong>Add</strong>.
      </>,
    ],
  },
};

/** Manual install steps for browsers without an install prompt. */
export function PWAInstallSteps({
  platform,
  open,
  onOpenChange,
}: {
  platform: Platform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const content = STEPS[platform];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>It opens full screen, like a normal app.</DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-fg marker:font-semibold marker:text-fg-muted">
          {content.steps.map((step, i) => (
            <li key={i} className="pl-1 leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
        <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
