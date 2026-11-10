"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { NativeSelect } from "../merchant-filters";
import { readError, toLocalInputValue } from "../merchant-utils";

interface BlockDatesDialogProps {
  open: boolean;
  bikeId?: string;
  bikeName?: string;
  onClose: () => void;
  onSaved: () => unknown;
}

function defaults() {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: toLocalInputValue(start), end: toLocalInputValue(end) };
}

/** Stops students booking a bike between two times (repairs or personal use). */
export function BlockDatesDialog({ open, bikeId, bikeName, onClose, onSaved }: BlockDatesDialogProps) {
  const [reason, setReason] = useState<"MAINTENANCE" | "MERCHANT_BLOCKED">("MAINTENANCE");
  const [start, setStart] = useState(defaults().start);
  const [end, setEnd] = useState(defaults().end);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = defaults();
    setStart(d.start);
    setEnd(d.end);
    setNotes("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bikeId) return;
    if (new Date(end) <= new Date(start)) {
      toast.error("The end time has to be after the start time.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/merchant/bikes/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bikeId,
          startAt: new Date(start).toISOString(),
          endAt: new Date(end).toISOString(),
          reason,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't block those dates. Try again."));
      haptics.success();
      await onSaved();
      toast.success("Dates blocked");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't block those dates. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Block dates</DialogTitle>
          <DialogDescription>
            {bikeName
              ? `${bikeName} can't be booked in this time.`
              : "This bike can't be booked in this time."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Why">
            <NativeSelect value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
              <option value="MAINTENANCE">Repair or service</option>
              <option value="MERCHANT_BLOCKED">Not available</option>
            </NativeSelect>
          </FormField>
          <FormField label="From" required>
            <Input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
          </FormField>
          <FormField label="To" required>
            <Input type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
          </FormField>
          <FormField label="Note">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Oil change" />
          </FormField>
          <Button type="submit" className="w-full" loading={saving}>
            Block dates
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
