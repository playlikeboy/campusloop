"use client";

import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteOauthApp, rotateOauthSecret } from "@/app/(app)/(main)/developer/apps/actions";
import { AgentPromptButtons } from "./agent-prompt-buttons";
import { CopyField } from "./copy-field";

/** Client ID, secret rotation (shown once) and delete for an app the developer owns. */
export function AppCredentials({
  id,
  type,
  secretLast4,
  isFirstParty,
  appName,
  redirectUris,
}: {
  id: string;
  type: string;
  secretLast4: string | null;
  isFirstParty: boolean;
  appName: string;
  redirectUris: string[];
}) {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState<"rotate" | "delete" | null>(null);

  async function rotate() {
    if (!window.confirm("Create a new secret? The current one stops working immediately.")) return;
    setBusy("rotate");
    const r = await rotateOauthSecret(id);
    setBusy(null);
    if (!r.ok) return void toast.error(r.error);
    setSecret(r.secret);
  }

  async function remove() {
    if (!window.confirm("Delete this app? Every student signed in with it is signed out. This cannot be undone.")) return;
    setBusy("delete");
    const r = await deleteOauthApp(id);
    if (!r.ok) {
      setBusy(null);
      return void toast.error(r.error);
    }
    toast.success("App deleted");
    router.push("/developer");
  }

  return (
    <section className="space-y-4 rounded-3xl bg-card/60 p-5 shadow-2xs">
      <h2 className="text-lg font-bold text-foreground">Credentials</h2>
      <CopyField label="Client ID" value={id} />
      {type === "CONFIDENTIAL" ? (
        secret ? (
          <div>
            <CopyField label="New client secret (shown once)" value={secret} secret />
            <p className="mt-1 text-xs text-muted-foreground">Store it in your server's environment variables now.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Client secret ending in <code className="font-mono text-foreground">{secretLast4 ?? "????"}</code></p>
            <button type="button" onClick={rotate} disabled={busy !== null} className="inline-flex h-10 items-center gap-2 rounded-xl bg-muted/70 px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60 cursor-pointer">
              {busy === "rotate" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} Rotate secret
            </button>
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">Browser and mobile apps have no secret. Always send a PKCE code_challenge.</p>
      )}
      <AgentPromptButtons keys={{ appName, clientId: id, clientSecret: secret, redirectUris, publicClient: type !== "CONFIDENTIAL" }} />
      {!isFirstParty && (
        <button type="button" onClick={remove} disabled={busy !== null} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60 cursor-pointer">
          {busy === "delete" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />} Delete app
        </button>
      )}
    </section>
  );
}
