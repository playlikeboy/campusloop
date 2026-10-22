"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { revokeConnectedApp } from "@/app/(app)/(main)/settings/connected-apps/actions";

export function RevokeButton({ clientId, name }: { clientId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove ${name}'s access to your CampusLoop account? You'll be signed out of it.`)) return;
        start(async () => {
          try {
            await revokeConnectedApp(clientId);
            toast.success(`${name} no longer has access`);
          } catch {
            toast.error("Could not remove access. Try again.");
          }
        });
      }}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60 cursor-pointer"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Remove access
    </button>
  );
}
