"use client";

import { ArrowLeft, Building2, CheckCircle2, GraduationCap, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CollegeRequestClient() {
  const [collegeName, setCollegeName] = useState("");
  const [emailPattern, setEmailPattern] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/college-index-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName, emailPattern, state, district }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) throw new Error(data.error || "Could not submit request");
      setSubmitted(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to CampusLoop
        </Link>

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
          <div className="border-b border-border/50 bg-muted/30 p-6 sm:p-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="size-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Is your college missing?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Tell us the official student email domain. We&apos;ll review the institution and add its email pattern to the CampusLoop college index.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 text-center sm:p-8">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="mt-4 text-xl font-black">Request received</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Thanks. We&apos;ve received the college and email-domain details and will review the request.
              </p>
              <Link href="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">
                Back to CampusLoop
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
              <div className="space-y-1.5">
                <label htmlFor="college-name" className="text-sm font-bold">College / University *</label>
                <Input
                  id="college-name"
                  value={collegeName}
                  onChange={(event) => setCollegeName(event.target.value)}
                  placeholder="e.g. Birla Institute of Technology, Mesra"
                  required
                  minLength={3}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email-pattern" className="text-sm font-bold">Official student email domain *</label>
                <Input
                  id="email-pattern"
                  value={emailPattern}
                  onChange={(event) => setEmailPattern(event.target.value)}
                  placeholder="e.g. bitmesra.ac.in"
                  required
                  className="h-11 rounded-xl"
                />
                <p className="text-xs leading-5 text-muted-foreground">CampusLoop will treat this as the verified pattern, e.g. *@bitmesra.ac.in.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="state" className="text-sm font-bold">State</label>
                  <Input id="state" value={state} onChange={(event) => setState(event.target.value)} placeholder="Jharkhand" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="district" className="text-sm font-bold">City / District</label>
                  <Input id="district" value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Ranchi" className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <div className="flex gap-3">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Please use the official college domain, not a personal Gmail/Yahoo address. This request does not automatically create or verify a college hub.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl font-black">
                <Send className="size-4" />
                {submitting ? "Submitting…" : "Request college indexing"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
