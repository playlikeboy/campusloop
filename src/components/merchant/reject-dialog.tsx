"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Reject order #1042?" */
  title: string;
  placeholder?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}

/** Asks for a short reason before rejecting an order or booking. The student sees the reason. */
export function RejectDialog({
  open,
  onOpenChange,
  title,
  placeholder = "For example: item is out of stock",
  loading,
  onConfirm,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>The student will see your reason.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) void onConfirm(reason.trim());
          }}
        >
          <FormField label="Reason" required>
            <Textarea
              autoFocus
              rows={3}
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
            />
          </FormField>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={loading} disabled={!reason.trim()}>
              Reject
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
