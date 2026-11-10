"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface StoreOpenSwitchProps {
  isOpen: boolean;
  onChanged: () => unknown;
  className?: string;
}

/** "Taking orders" switch. Students can't order while it's off. */
export function StoreOpenSwitch({ isOpen, onChanged, className }: StoreOpenSwitchProps) {
  const [saving, setSaving] = useState(false);

  async function toggle(next: boolean) {
    if (saving) return;
    sounds.tap();
    haptics.light();
    setSaving(true);
    try {
      const res = await fetch("/api/merchant/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: next }),
      });
      if (!res.ok) throw new Error();
      await onChanged();
      toast.success(next ? "You're open. Students can order now." : "You're closed. New orders are paused.");
    } catch {
      toast.error("Couldn't change your store status. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-border bg-surface py-1.5 pr-2 pl-4",
        className
      )}
    >
      <span className="text-sm font-semibold text-fg">{isOpen ? "Taking orders" : "Closed"}</span>
      <Switch checked={isOpen} disabled={saving} onCheckedChange={(v) => void toggle(Boolean(v))} />
    </label>
  );
}
