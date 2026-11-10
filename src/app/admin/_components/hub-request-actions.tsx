"use client";

import { Check, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { decideHubRequest } from "../inbox-actions";

export function HubRequestActions({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const decide = (d: "APPROVED" | "REJECTED") =>
    start(async () => {
      try {
        await decideHubRequest(id, d);
        toast.success(d === "APPROVED" ? `Approved. Add ${name} in Colleges if it isn't listed yet.` : "Request declined");
      } catch {
        toast.error("Could not update the request");
      }
    });
  return (
    <div className="flex shrink-0 gap-1.5">
      <button type="button" disabled={pending} onClick={() => decide("APPROVED")} aria-label={`Approve ${name}`} className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer">
        <Check className="size-3.5" aria-hidden /> Approve
      </button>
      <button type="button" disabled={pending} onClick={() => decide("REJECTED")} aria-label={`Decline ${name}`} className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer">
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
