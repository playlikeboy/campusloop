"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

type Gender = "MALE" | "FEMALE" | "OTHER";

/** Asked once before the deck: Campus Match needs a gender to pick who to show. */
export function GenderGate({ onSaved }: { onSaved: () => Promise<void> | void }) {
  const [gender, setGender] = useState<Gender>("MALE");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender }),
      });
      if (!res.ok) throw new Error();
      await onSaved();
    } catch {
      toast.error("Couldn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="m-auto w-full max-w-sm space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl text-fg">One thing first</h2>
        <p className="text-sm text-fg-muted">
          Tell us your gender so we can show you the right people. You choose who you see in Settings.
        </p>
      </div>
      <SegmentedControl<Gender>
        aria-label="Your gender"
        fullWidth
        className="*:h-11"
        value={gender}
        onChange={setGender}
        options={[
          { value: "MALE", label: "Male" },
          { value: "FEMALE", label: "Female" },
          { value: "OTHER", label: "Other" },
        ]}
      />
      <Button type="submit" className="w-full" loading={saving}>
        Start matching
      </Button>
    </form>
  );
}
