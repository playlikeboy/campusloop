"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PLAY_REPORT_REASONS, type PlayReportReason } from "@/constants/play";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Flag button that reports a DP entry or meme. Three reports hide it for everyone. */
export function PlayReportButton({
  targetType,
  targetId,
  label,
  onReported,
  className,
}: {
  targetType: "DP_ENTRY" | "MEME";
  targetId: string;
  label: string;
  onReported?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PlayReportReason>("INAPPROPRIATE");
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      await apiRequest("/api/play/report", "POST", { targetType, targetId, reason });
      toast.success("Thanks. We'll take a look.");
      setOpen(false);
      onReported?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send the report.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={() => setOpen(true)}
        className={cn("text-fg-muted", className)}
      >
        <Flag aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report this</DialogTitle>
            <DialogDescription>They won't know who reported. Three reports hide it at once.</DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2">
            <legend className="sr-only">Reason</legend>
            {PLAY_REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm transition-ui",
                  reason === r.value ? "border-brand bg-brand-subtle text-brand-text" : "border-border text-fg"
                )}
              >
                <input
                  type="radio"
                  name={`report-${targetId}`}
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 accent-brand"
                />
                {r.label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={send} loading={sending}>
              Send report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
