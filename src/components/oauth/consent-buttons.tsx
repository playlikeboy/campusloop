"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

/** Allow / Cancel for the consent form, with a pending state so a double tap cannot submit twice. */
export function ConsentButtons({ appName }: { appName: string }) {
  const { pending, data } = useFormStatus();
  const choice = data?.get("decision");
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="submit"
        name="decision"
        value="deny"
        disabled={pending}
        className="h-12 rounded-2xl bg-muted/70 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 cursor-pointer"
      >
        {pending && choice === "deny" ? <Loader2 className="mx-auto size-4 animate-spin" aria-label="Cancelling" /> : "Cancel"}
      </button>
      <button
        type="submit"
        name="decision"
        value="allow"
        disabled={pending}
        aria-label={`Allow ${appName}`}
        className="h-12 rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
      >
        {pending && choice === "allow" ? <Loader2 className="mx-auto size-4 animate-spin" aria-label="Continuing" /> : "Allow"}
      </button>
    </div>
  );
}
