"use client";

import { BadgeCheck, Globe, GraduationCap, Loader2, Mail, School, Server, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createOauthApp, updateOauthApp } from "@/app/(app)/(main)/developer/apps/actions";
import type { AppInput } from "@/lib/oauth/app-input";
import { cn } from "@/lib/utils";
import { AgentPromptButtons } from "./agent-prompt-buttons";
import { CopyField } from "./copy-field";

const field = "mt-1 w-full rounded-xl bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const PREVIEW = [
  { l: "Name, username and profile photo", icon: UserRound },
  { l: "Verified-student status", icon: BadgeCheck },
  { l: "College", icon: School },
  { l: "Branch, degree and year", icon: GraduationCap },
  { l: "Email address", icon: Mail },
];

type Form = Omit<AppInput, "redirectUris"> & { redirectUris: string };

const empty: Form = { name: "", description: "", homepageUrl: "", logoUrl: "", privacyUrl: "", termsUrl: "", type: "CONFIDENTIAL", redirectUris: "" };

/** Register or edit a Login with CampusLoop app, with a live consent-screen preview. */
export function AppForm({ appId, initial }: { appId?: string; initial?: AppInput }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(initial ? { ...initial, redirectUris: initial.redirectUris.join("\n") } : empty);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ clientId: string; secret: string | null } | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (appId) {
      const r = await updateOauthApp(appId, f);
      setBusy(false);
      if (!r.ok) return void toast.error(r.error);
      toast.success("Saved");
      router.refresh();
      return;
    }
    const r = await createOauthApp(f);
    setBusy(false);
    if (!r.ok) return void toast.error(r.error);
    setCreated({ clientId: r.clientId, secret: r.secret });
  }

  if (created) {
    return (
      <section className="rounded-3xl bg-card/70 p-6 shadow-sm">
        <h2 className="text-xl font-black text-foreground">Your app is ready</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {created.secret ? "Copy the client secret now. For your security it is shown only once; you can rotate it later." : "Browser and mobile apps use PKCE instead of a secret."}
        </p>
        <div className="mt-5 space-y-4">
          <CopyField label="Client ID" value={created.clientId} />
          {created.secret && <CopyField label="Client secret" value={created.secret} secret />}
        </div>
        <div className="mt-5">
          <AgentPromptButtons keys={{ appName: f.name, clientId: created.clientId, clientSecret: created.secret, publicClient: !created.secret, redirectUris: f.redirectUris.split(/[\s,]+/).filter(Boolean) }} />
        </div>
        <Link href={`/developer/apps/${created.clientId}`} className="mt-6 inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90">
          Continue to setup guide
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <section className="space-y-4 rounded-3xl bg-card/60 p-5 shadow-2xs">
          <h2 className="text-lg font-bold text-foreground">About your app</h2>
          <label className="block text-sm font-semibold">Name
            <input value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={60} required placeholder="e.g. HackFest 2026" className={cn(field, "h-11 text-base")} />
          </label>
          <label className="block text-sm font-semibold">Short description <span className="font-normal text-muted-foreground">(shown to admins reviewing access)</span>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={300} rows={2} className={cn(field, "resize-y py-2")} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {([["homepageUrl", "Website"], ["logoUrl", "Logo image URL"], ["privacyUrl", "Privacy policy"], ["termsUrl", "Terms of service"]] as const).map(([k, l]) => (
              <label key={k} className="block text-sm font-semibold">{l}
                <input value={f[k]} onChange={(e) => set(k, e.target.value)} type="url" placeholder="https://" className={cn(field, "h-10")} />
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-card/60 p-5 shadow-2xs">
          <h2 className="text-lg font-bold text-foreground">How it signs in</h2>
          {!appId && (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="App type">
              {([
                ["CONFIDENTIAL", Server, "Web app with a server", "Next.js, Node, Django, Laravel... Keeps a client secret."],
                ["PUBLIC", Smartphone, "Browser or mobile app", "SPA, React Native, Flutter. Uses PKCE, no secret."],
              ] as const).map(([v, Icon, l, d]) => (
                <button key={v} type="button" role="radio" aria-checked={f.type === v} onClick={() => set("type", v)} className={cn("rounded-2xl p-4 text-left ring-1 transition-colors cursor-pointer", f.type === v ? "bg-primary/10 ring-primary" : "bg-muted/40 ring-transparent hover:bg-muted/60")}>
                  <Icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 text-sm font-bold text-foreground">{l}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
                </button>
              ))}
            </div>
          )}
          <label className="block text-sm font-semibold">Redirect URIs <span className="font-normal text-muted-foreground">(one per line, exact match)</span>
            <textarea value={f.redirectUris} onChange={(e) => set("redirectUris", e.target.value)} rows={3} required placeholder={"https://yourapp.com/api/auth/callback/campusloop\nhttp://localhost:3000/api/auth/callback/campusloop"} className={cn(field, "resize-y py-2 font-mono text-[13px]")} />
          </label>
        </section>

      </div>

      <aside>
        <div className="sticky top-6 space-y-4">
          <div className="rounded-3xl bg-card/80 p-5 shadow-sm" aria-label="Consent screen preview">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students will see</p>
            <div className="mt-3 flex items-center gap-2">
              {f.logoUrl ? <img src={f.logoUrl} alt="" className="size-9 rounded-xl object-cover" /> : <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{(f.name || "A").charAt(0).toUpperCase()}</span>}
              <p className="min-w-0 truncate font-bold text-foreground">Sign in to {f.name || "your app"}</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {PREVIEW.map((p) => (
                <li key={p.l} className="flex items-center gap-2"><p.icon className="size-4 text-primary" aria-hidden />{p.l}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Students see only the scopes your app asks for, and approve them once.</p>
            {f.homepageUrl && <p className="mt-3 flex items-center gap-1 truncate text-xs text-muted-foreground"><Globe className="size-3.5" aria-hidden />{f.homepageUrl.replace(/^https?:\/\//, "")}</p>}
          </div>
          <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 cursor-pointer">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} {appId ? "Save changes" : "Create app"}
          </button>
        </div>
      </aside>
    </form>
  );
}
