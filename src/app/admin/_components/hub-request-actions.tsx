"use client";

import { Check, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideHubRequest } from "../inbox-actions";

export function HubRequestActions({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const decide = (d: "APPROVED" | "REJECTED") =>
    start(async () => {
      try {
        await decideHubRequest(id, d);
        toast.success(
          d === "APPROVED" ? `Approved. Add ${name} in Colleges if it isn't listed yet.` : "Request declined"
        );
      } catch {
        toast.error("Couldn't update the request. Refresh and try again.");
      }
    });
  return (
    <div className="flex shrink-0 gap-1.5">
      <Button size="sm" disabled={pending} onClick={() => decide("APPROVED")} aria-label={`Approve ${name}`}>
        <Check aria-hidden /> Approve
      </Button>
      <Button
        size="icon-sm"
        variant="secondary"
        disabled={pending}
        onClick={() => decide("REJECTED")}
        aria-label={`Decline ${name}`}
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}
