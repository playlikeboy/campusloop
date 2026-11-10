"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { NativeSelect } from "../merchant-filters";
import { readError } from "../merchant-utils";

interface BikeEditDialogProps {
  bike: any | null;
  onClose: () => void;
  onSaved: () => unknown;
}

/** Change a bike's status, prices and deposit. */
export function BikeEditDialog({ bike, onClose, onSaved }: BikeEditDialogProps) {
  const [status, setStatus] = useState("AVAILABLE");
  const [daily, setDaily] = useState("");
  const [hourly, setHourly] = useState("");
  const [deposit, setDeposit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!bike) return;
    setStatus(bike.status);
    setDaily(String(bike.dailyPrice ?? ""));
    setHourly(String(bike.hourlyPrice ?? ""));
    setDeposit(String(bike.securityDeposit ?? ""));
  }, [bike]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!bike) return;
    setSaving(true);
    try {
      const res = await fetch("/api/merchant/bikes/fleet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bike.id,
          status,
          dailyPrice: Number.parseInt(daily, 10) || bike.dailyPrice,
          hourlyPrice: Number.parseInt(hourly, 10) || bike.hourlyPrice,
          securityDeposit: Number.parseInt(deposit, 10) || bike.securityDeposit,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't save the bike. Try again."));
      haptics.success();
      await onSaved();
      toast.success("Bike saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the bike. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(bike)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{bike?.name}</DialogTitle>
          <DialogDescription>{bike?.registrationNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Status">
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="RENTED">Rented out</option>
              <option value="MAINTENANCE">In repair (can't be booked)</option>
            </NativeSelect>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Per day (₹)" required>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                required
                value={daily}
                onChange={(e) => setDaily(e.target.value)}
              />
            </FormField>
            <FormField label="Per hour (₹)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={hourly}
                onChange={(e) => setHourly(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Deposit (₹)">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" loading={saving}>
            Save bike
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
