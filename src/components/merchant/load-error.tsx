"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Shown when a store screen can't load its data. */
export function LoadError({ what, onRetry }: { what: string; onRetry: () => unknown }) {
  return (
    <EmptyState
      bordered
      icon={WifiOff}
      title={`Couldn't load ${what}`}
      description="Check your internet, then try again."
      action={
        <Button variant="outline" onClick={() => void onRetry()}>
          Try again
        </Button>
      }
    />
  );
}
