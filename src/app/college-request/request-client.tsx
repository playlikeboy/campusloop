"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

/** Form to ask for a college and its student email domain to be added. */
export function CollegeRequestClient() {
  const [collegeName, setCollegeName] = useState("");
  const [emailPattern, setEmailPattern] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/college-index-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName, emailPattern, state, district }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "We couldn't send your request.");
      setSubmitted(true);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "We couldn't send your request.";
      setError(`${reason} Check your connection and try again.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center sm:p-8" role="status">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-verified-subtle text-verified-text">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl text-fg">Request sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-base text-fg-muted">
          Thanks. We&apos;ll check the college and its email domain, usually within a day.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up" className={buttonVariants({ variant: "primary" })}>
            Sign up with any email for now
          </Link>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-8">
      <FormField label="College name" required>
        <Input
          value={collegeName}
          onChange={(e) => setCollegeName(e.target.value)}
          placeholder="Birla Institute of Technology, Mesra"
          required
          minLength={3}
          autoComplete="organization"
        />
      </FormField>

      <FormField
        label="Student email domain"
        required
        hint="The part after @ in your college email, like bitmesra.ac.in. Not Gmail or Yahoo."
      >
        <Input
          value={emailPattern}
          onChange={(e) => setEmailPattern(e.target.value)}
          placeholder="bitmesra.ac.in"
          required
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="State">
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Jharkhand" />
        </FormField>
        <FormField label="City or district">
          <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ranchi" />
        </FormField>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger-subtle px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting} disabled={submitting} className="w-full">
        {submitting ? "Sending…" : "Send request"}
      </Button>
      <p className="text-sm text-fg-subtle">
        Sending a request doesn&apos;t open a college page right away. We check every domain first.
      </p>
    </form>
  );
}
