"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CAPABILITIES,
  CAPABILITY_INFO,
  type Capability,
  defaultMemberAccess,
  MAX_REVIEW_FIRST_POSTS,
  type MemberAccessSettings,
} from "@/lib/trust";
import { cn } from "@/lib/utils";
import { updateMemberAccess } from "./actions";

function Row({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li className={cn("flex items-center justify-between gap-4 p-4", disabled && "opacity-60")}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {description && <span className="block text-sm text-fg-muted">{description}</span>}
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(Boolean(v))} />
    </li>
  );
}

export function AccessClient({ initial }: { initial: MemberAccessSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(settings) !== saved;
  const off = !settings.membersCanParticipate;

  const setCap = (cap: Capability, value: boolean) =>
    setSettings((s) => ({ ...s, capabilities: { ...s.capabilities, [cap]: value } }));

  async function save() {
    setSaving(true);
    try {
      const next = await updateMemberAccess(settings);
      setSettings(next);
      setSaved(JSON.stringify(next));
      toast.success("Member access saved. It applies everywhere within a minute.");
    } catch {
      toast.error("Couldn't save. Check you're still signed in as an admin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface">
        <ul className="divide-y divide-border">
          <Row
            id="master"
            label="Unverified members can participate"
            description="Off makes every unverified account read-only. Verified students are never affected."
            checked={settings.membersCanParticipate}
            onChange={(v) => setSettings((s) => ({ ...s, membersCanParticipate: v }))}
          />
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="font-sans text-base font-semibold text-fg">Allow unverified members to…</h2>
          <p className="text-sm text-fg-muted">
            A locked action still shows, and tapping it explains how to verify.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {CAPABILITIES.map((cap) => (
            <Row
              key={cap}
              id={`cap-${cap}`}
              label={CAPABILITY_INFO[cap].label.charAt(0).toUpperCase() + CAPABILITY_INFO[cap].label.slice(1)}
              description={CAPABILITY_INFO[cap].note}
              checked={settings.capabilities[cap]}
              disabled={off}
              onChange={(v) => setCap(cap, v)}
            />
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="font-sans text-base font-semibold text-fg">Extra limits on members</h2>
        </div>
        <ul className="divide-y divide-border">
          <Row
            id="strict-limits"
            label="Stricter hourly limits"
            description="Caps posts, comments, messages and votes per member per hour. Limits are in src/lib/rate-limits.ts."
            checked={settings.strictRateLimits}
            disabled={off}
            onChange={(v) => setSettings((s) => ({ ...s, strictRateLimits: v }))}
          />
          <li className={cn("flex flex-wrap items-center justify-between gap-4 p-4", off && "opacity-60")}>
            <label htmlFor="review-first" className="min-w-0">
              <span className="block text-sm font-semibold text-fg">Review a member's first posts</span>
              <span className="block text-sm text-fg-muted">
                Their first posts wait in the Review queue until approved. 0 turns it off.
              </span>
            </label>
            <Input
              id="review-first"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_REVIEW_FIRST_POSTS}
              disabled={off}
              value={settings.reviewFirstPosts}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  reviewFirstPosts: Math.max(0, Math.min(MAX_REVIEW_FIRST_POSTS, Number(e.target.value) || 0)),
                }))
              }
              className="w-24 tabular-nums"
            />
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
        <Button variant="ghost" onClick={() => setSettings(defaultMemberAccess())} disabled={saving}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
