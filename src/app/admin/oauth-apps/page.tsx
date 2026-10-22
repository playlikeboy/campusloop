import { desc, eq, sql } from "drizzle-orm";
import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { oauthClients, userProfiles } from "@/db/schema";
import { SENSITIVE_SCOPES } from "@/lib/oauth/config";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AppReviewActions } from "./app-review-actions";

export const metadata: Metadata = { title: "Login with CampusLoop apps" };
export const dynamic = "force-dynamic";

export default async function AdminOauthAppsPage() {
  const { db } = await resolveAdminSession();
  const rows = await db
    .select({ app: oauthClients, owner: { username: userProfiles.username, displayName: userProfiles.displayName } })
    .from(oauthClients)
    .leftJoin(userProfiles, eq(userProfiles.id, oauthClients.ownerProfileId))
    .orderBy(sql`case when ${oauthClients.reviewStatus} = 'PENDING' then 0 else 1 end`, desc(oauthClients.createdAt))
    .limit(200);
  const pending = rows.filter((r) => r.app.reviewStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Login with CampusLoop apps"
        category="Integrations & Studio"
        icon={KeyRound}
        description={`${rows.length} registered apps, ${pending} waiting for review. Approve college, academic or email access only when the app clearly needs it and has a privacy policy.`}
      />
      <ul className="space-y-3">
        {rows.map(({ app, owner }) => {
          const sensitive = app.requestedScopes.filter((s) => SENSITIVE_SCOPES.includes(s));
          return (
            <li key={app.id} className="rounded-2xl bg-card/60 p-4 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-foreground">
                    {app.name}
                    {app.isFirstParty && <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">Ecosystem</span>}
                    {app.status === "SUSPENDED" && <span className="ml-2 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive">Suspended</span>}
                    {app.reviewStatus === "PENDING" && <span className="ml-2 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">Needs review</span>}
                  </p>
                  <p className="text-xs text-muted-foreground"><code className="font-mono">{app.id}</code> · {app.type} · {app.usersCount} users · by {owner?.displayName ?? "CampusLoop"}{owner?.username ? ` (@${owner.username})` : ""}</p>
                  {app.description && <p className="mt-1 text-sm text-foreground">{app.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Redirects: {app.redirectUris.join(", ")}
                    {sensitive.length > 0 && <> · Requests: <strong>{sensitive.join(", ")}</strong></>}
                    {app.privacyUrl && <> · <a href={app.privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">privacy</a></>}
                    {app.homepageUrl && <> · <a href={app.homepageUrl} target="_blank" rel="noopener noreferrer" className="underline">site</a></>}
                  </p>
                  {app.reviewNote && <p className="mt-1 text-xs text-muted-foreground">Note: {app.reviewNote}</p>}
                </div>
                <AppReviewActions id={app.id} status={app.status} reviewStatus={app.reviewStatus} isFirstParty={app.isFirstParty} hasSensitive={sensitive.length > 0} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
