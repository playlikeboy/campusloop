"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] page error:", error);
  }, [error]);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-lg border border-border bg-surface p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-subtle text-danger">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <h1 className="mt-4 text-xl text-fg">This page didn&apos;t load</h1>
      <p className="mt-2 text-sm text-fg-muted">
        A data source sent back an error. Nothing was changed. Try again, or go back to the inbox.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-fg-subtle">Error code: {error.digest}</p>}
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button onClick={reset}>
          <RefreshCw aria-hidden /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to inbox</Link>
        </Button>
      </div>
    </div>
  );
}
