import { desc, eq } from "drizzle-orm";
import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { oauthClients, userProfiles } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AppReviewActions } from "./app-review-actions";

export const metadata: Metadata = privateMetadata("Developer apps");
export const dynamic = "force-dynamic";

export default async function AdminOauthAppsPage() {
  const { db } = await resolveAdminSession();
  const rows = await db
    .select({
      app: oauthClients,
      owner: { username: userProfiles.username, displayName: userProfiles.displayName },
    })
    .from(oauthClients)
    .leftJoin(userProfiles, eq(userProfiles.id, oauthClients.ownerProfileId))
    .orderBy(desc(oauthClients.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Developer apps"
        icon={KeyRound}
        description="Apps that use Login with CampusLoop. Suspend any app that misuses student data."
        badge={<Badge variant="neutral">{rows.length} apps</Badge>}
      />
      {rows.length === 0 ? (
        <EmptyState icon={KeyRound} title="No developer apps yet" bordered />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {rows.map(({ app, owner }) => (
            <li key={app.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                    {app.name}
                    {app.isFirstParty && <Badge variant="brand">CampusLoop app</Badge>}
                    {app.status === "SUSPENDED" && <Badge variant="danger">Suspended</Badge>}
                  </p>
                  <p className="text-xs text-fg-muted">
                    <code className="font-mono">{app.id}</code> · {app.type} · {app.usersCount} users · by{" "}
                    {owner?.displayName ?? "CampusLoop"}
                    {owner?.username ? ` (@${owner.username})` : ""}
                  </p>
                  {app.description && <p className="text-sm text-fg">{app.description}</p>}
                  <p className="break-all text-xs text-fg-muted">
                    Redirects: {app.redirectUris.join(", ")}
                    {app.privacyUrl && (
                      <>
                        {" · "}
                        <a
                          href={app.privacyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-text underline"
                        >
                          Privacy policy
                        </a>
                      </>
                    )}
                    {app.homepageUrl && (
                      <>
                        {" · "}
                        <a
                          href={app.homepageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-text underline"
                        >
                          Website
                        </a>
                      </>
                    )}
                  </p>
                  {app.reviewNote && <p className="text-xs text-fg-muted">Note: {app.reviewNote}</p>}
                </div>
                <AppReviewActions
                  id={app.id}
                  status={app.status}
                  reviewStatus={app.reviewStatus}
                  isFirstParty={app.isFirstParty}
                  hasSensitive={false}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
