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
        if (
          !window.confirm(`Remove ${name}'s access to your CampusLoop account? You'll be signed out of it.`)
        )
          return;
        start(async () => {
          try {
            await revokeConnectedApp(clientId);
            toast.success(`${name} no longer has access`);
          } catch {
            toast.error("Couldn't remove access. Check your connection and try again.");
          }
        });
      }}
      className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-danger transition-ui hover:bg-danger-subtle disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Remove access
    </button>
  );
}
