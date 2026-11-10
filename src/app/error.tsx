"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { StatusScreen } from "@/components/shells/status-screen";
import { Button } from "@/components/ui/button";

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col bg-bg text-fg">
      <StatusScreen
        sticker="Oops"
        title="Something went wrong"
        description="This page didn't load. Try again. Nothing you posted was lost."
        action={
          <Button size="lg" onClick={reset} className="w-full sm:w-auto">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        }
        secondary={
          <Link href="/feeds" className="font-medium text-brand-text underline-offset-4 hover:underline">
            Go to your feed
          </Link>
        }
        footnote={error.digest ? `Error code: ${error.digest}` : undefined}
      />
    </main>
  );
}
