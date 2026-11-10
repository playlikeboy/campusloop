"use client";

import { ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkAdminAccess } from "./actions";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAccess() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkAdminAccess();
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch {
      setError("Couldn't check your account. Check your connection and try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger-subtle p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <Button type="button" onClick={handleAccess} loading={isLoading} className="w-full">
        {isLoading ? "Checking your account" : "Open admin console"}
        {!isLoading && <ArrowRight aria-hidden />}
      </Button>

      <Button variant="outline" className="w-full" asChild>
        <Link href="/sign-in?returnTo=/admin">
          <LogIn aria-hidden /> Sign in with a different account
        </Link>
      </Button>
    </div>
  );
}
