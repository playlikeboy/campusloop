"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { NativeSelect } from "../merchant-filters";
import { readError, rupees } from "../merchant-utils";
import { PhotoPicker } from "../photo-picker";

/** Saves an inspection, then moves the booking to its next status. Both must succeed. */
async function inspectThenAdvance(bookingId: string, inspection: Record<string, unknown>, status: string) {
  const insp = await fetch(`/api/merchant/bikes/bookings/${bookingId}/inspection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inspection),
  });
  if (!insp.ok) throw new Error(await readError(insp, "Couldn't save the checklist. Try again."));
  const res = await fetch(`/api/merchant/bikes/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok)
    throw new Error(await readError(res, "Checklist saved, but the booking didn't update. Try again."));
}

const CHECKS = [
  { key: "frontOk", label: "Front, brakes and mirrors are fine" },
  { key: "rearOk", label: "Back, seat and mudguard are fine" },
  { key: "tyresOk", label: "Tyres have air and grip" },
  { key: "lightsOk", label: "Lights and indicators work" },
] as const;
type CheckKey = (typeof CHECKS)[number]["key"];

interface DialogProps {
  open: boolean;
  bookingId: string;
  onClose: () => void;
  onDone: () => unknown;
}

export function HandoverDialog({ open, bookingId, onClose, onDone }: DialogProps) {
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    frontOk: true,
    rearOk: true,
    tyresOk: true,
    lightsOk: true,
  });
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState("FULL");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sounds.send();
    setSaving(true);
    try {
      await inspectThenAdvance(
        bookingId,
        {
          type: "PICKUP_HANDOVER",
          ...checks,
          odometerKm: Number.parseInt(odometer, 10) || null,
          fuelLevel: fuel,
          photos,
        },
        "ACTIVE"
      );
      haptics.success();
      await onDone();
      toast.success("Ride started");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the ride. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hand over the bike</DialogTitle>
          <DialogDescription>Check the bike with the student before giving the keys.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-1">
            <legend className="mb-1 text-sm font-semibold text-fg">Checklist</legend>
            {CHECKS.map((c) => (
              <label key={c.key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-fg">
                <Checkbox
                  checked={checks[c.key]}
                  onCheckedChange={(v) => setChecks((p) => ({ ...p, [c.key]: Boolean(v) }))}
                />
                {c.label}
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Odometer (km)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </FormField>
            <FormField label="Fuel">
              <NativeSelect value={fuel} onChange={(e) => setFuel(e.target.value)}>
                <option value="FULL">Full</option>
                <option value="THREE_QUARTER">3/4</option>
                <option value="HALF">Half</option>
                <option value="QUARTER">1/4</option>
                <option value="RESERVE">Reserve</option>
              </NativeSelect>
            </FormField>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-fg">Photos</p>
            <p className="text-sm text-fg-muted">Photos help if there's a damage question later.</p>
            <PhotoPicker photos={photos} onChange={setPhotos} max={6} />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Keys handed over, start ride
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReturnDialog({
  open,
  bookingId,
  deposit,
  onClose,
  onDone,
}: DialogProps & { deposit?: number }) {
  const [damaged, setDamaged] = useState(false);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (damaged && !notes.trim()) {
      toast.error("Write what's damaged so the student and our team can see it.");
      return;
    }
    sounds.send();
    setSaving(true);
    try {
      const ok = !damaged;
      await inspectThenAdvance(
        bookingId,
        {
          type: "RETURN_CHECK",
          frontOk: ok,
          rearOk: ok,
          tyresOk: ok,
          lightsOk: ok,
          hasDamage: damaged,
          damageNotes: notes.trim() || undefined,
          photos,
        },
        damaged ? "DISPUTED" : "RETURNED"
      );
      haptics.success();
      await onDone();
      toast.success(damaged ? "Damage reported. Our team will review it." : "Bike is back");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the return. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check the returned bike</DialogTitle>
          <DialogDescription>Look for any new damage before you return the deposit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SegmentedControl
            fullWidth
            aria-label="Bike condition"
            value={damaged ? "damage" : "fine"}
            onChange={(v) => setDamaged(v === "damage")}
            options={[
              { value: "fine", label: "No new damage" },
              { value: "damage", label: "Found damage" },
            ]}
          />
          {damaged && (
            <FormField label="What's damaged" required hint="The student and our team will see this.">
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Scratch on the left side, broken mirror"
              />
            </FormField>
          )}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-fg">Photos</p>
            <PhotoPicker photos={photos} onChange={setPhotos} max={6} />
          </div>
          <Button type="submit" variant={damaged ? "danger" : "primary"} className="w-full" loading={saving}>
            {damaged
              ? "Report damage and hold deposit"
              : `Confirm return${deposit ? ` (deposit ${rupees(deposit)})` : ""}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
