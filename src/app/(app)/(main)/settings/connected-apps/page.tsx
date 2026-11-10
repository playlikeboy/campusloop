import { and, desc, eq, isNull } from "drizzle-orm";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RevokeButton } from "@/components/oauth/revoke-button";
import { getDb } from "@/db";
import { oauthClients, oauthGrants } from "@/db/schema";
import { SCOPES } from "@/lib/oauth/config";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connected apps", robots: { index: false, follow: false } };

const SHORT: Record<string, string> = { profile: "name and photo", student: "verified-student status", college: "college", academic: "branch, degree and year", email: "email", offline_access: "stays signed in" };

export default async function ConnectedAppsPage() {
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) redirect("/sign-in?returnTo=/settings/connected-apps");
  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  const rows = await getDb()
    .select({ grant: oauthGrants, app: oauthClients })
    .from(oauthGrants)
    .innerJoin(oauthClients, eq(oauthClients.id, oauthGrants.clientId))
    .where(and(eq(oauthGrants.profileId, profile.id), isNull(oauthGrants.revokedAt)))
    .orderBy(desc(oauthGrants.lastUsedAt));

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-20">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Settings</Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">Connected apps</h1>
      <p className="mt-1 text-muted-foreground">Websites and apps you signed in to with CampusLoop, and what they can see.</p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-card/60 p-8 text-center shadow-2xs">
          <LogIn className="mx-auto size-8 text-primary" aria-hidden />
          <p className="mt-3 font-semibold text-foreground">No connected apps yet</p>
          <p className="mt-1 text-sm text-muted-foreground">When you use Login with CampusLoop on another site, it shows up here and you can remove it anytime.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map(({ grant, app }) => (
            <li key={grant.id} className="flex flex-wrap items-center gap-3 rounded-3xl bg-card/60 p-4 shadow-2xs">
              {app.logoUrl ? <img src={app.logoUrl} alt="" className="size-11 rounded-xl object-cover" /> : <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{app.name.charAt(0).toUpperCase()}</span>}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold text-foreground">
                  {app.name} {app.isFirstParty && <ShieldCheck className="size-4 text-primary" aria-label="CampusLoop ecosystem app" />}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Can see your {grant.scopes.filter((s) => SHORT[s] && SCOPES[s]).map((s) => SHORT[s]).join(", ") || "sign-in only"}
                </p>
                {grant.lastUsedAt && <p className="text-xs text-muted-foreground">Last used {grant.lastUsedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
              </div>
              <RevokeButton clientId={app.id} name={app.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
