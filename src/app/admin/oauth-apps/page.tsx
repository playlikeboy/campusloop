import { desc, eq } from "drizzle-orm";
import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { oauthClients, userProfiles } from "@/db/schema";
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
    .orderBy(desc(oauthClients.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Developer apps"
        category="Requests"
        icon={KeyRound}
        description={`${rows.length} Login with CampusLoop apps. Every scope is available instantly; suspend any app that misuses student data, and mark CampusLoop's own products as ecosystem apps.`}
      />
      <ul className="space-y-3">
        {rows.map(({ app, owner }) => {
          return (
            <li key={app.id} className="rounded-2xl bg-card/60 p-4 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-foreground">
                    {app.name}
                    {app.isFirstParty && <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">Ecosystem</span>}
                    {app.status === "SUSPENDED" && <span className="ml-2 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive">Suspended</span>}
                  </p>
                  <p className="text-xs text-muted-foreground"><code className="font-mono">{app.id}</code> · {app.type} · {app.usersCount} users · by {owner?.displayName ?? "CampusLoop"}{owner?.username ? ` (@${owner.username})` : ""}</p>
                  {app.description && <p className="mt-1 text-sm text-foreground">{app.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Redirects: {app.redirectUris.join(", ")}
                    {app.privacyUrl && <> · <a href={app.privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">privacy</a></>}
                    {app.homepageUrl && <> · <a href={app.homepageUrl} target="_blank" rel="noopener noreferrer" className="underline">site</a></>}
                  </p>
                  {app.reviewNote && <p className="mt-1 text-xs text-muted-foreground">Note: {app.reviewNote}</p>}
                </div>
                <AppReviewActions id={app.id} status={app.status} reviewStatus={app.reviewStatus} isFirstParty={app.isFirstParty} hasSensitive={false} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
