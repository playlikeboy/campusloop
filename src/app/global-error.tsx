"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect } from "react";
import { StatusScreen } from "@/components/shells/status-screen";
import { Button } from "@/components/ui/button";

/** Last-resort screen when the root layout itself fails. Renders its own html and body. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-fg antialiased">
        <title>Something went wrong | CampusLoop</title>
        <StatusScreen
          sticker="Oops"
          title="CampusLoop didn't load"
          description="Check your internet and try again."
          action={
            <Button size="lg" onClick={reset} className="w-full sm:w-auto">
              Try again
            </Button>
          }
          secondary={
            <Link href="/" className="font-medium text-brand-text underline-offset-4 hover:underline">
              Go to the home page
            </Link>
          }
          footnote={error.digest ? `Error code: ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
