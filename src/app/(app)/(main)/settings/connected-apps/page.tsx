import { and, desc, eq, isNull } from "drizzle-orm";
import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RevokeButton } from "@/components/oauth/revoke-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db";
import { oauthClients, oauthGrants } from "@/db/schema";
import { SCOPES } from "@/lib/oauth/config";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";
export const metadata = privateMetadata("Connected apps");

const SHORT: Record<string, string> = {
  profile: "name and photo",
  student: "verified-student status",
  college: "college",
  academic: "branch, degree and year",
  email: "email",
  offline_access: "stays signed in",
};

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
      <header className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
          <Link href="/settings">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl text-fg">Connected apps</h1>
          <p className="text-sm text-fg-muted">
            Apps you signed in to with CampusLoop, and what they can see.
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={LogIn}
          bordered
          title="No connected apps"
          description="When you use Log in with CampusLoop on another site, it shows up here."
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.map(({ grant, app }) => (
            <li key={grant.id} className="flex flex-wrap items-center gap-3 p-4">
              {app.logoUrl ? (
                <img src={app.logoUrl} alt="" className="size-11 rounded-md object-cover" />
              ) : (
                <span className="flex size-11 items-center justify-center rounded-md bg-surface-muted font-semibold text-fg">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold text-fg">
                  {app.name}
                  {app.isFirstParty && <Badge variant="neutral">By CampusLoop</Badge>}
                </p>
                <p className="text-sm text-fg-muted">
                  Can see your{" "}
                  {grant.scopes
                    .filter((s) => SHORT[s] && SCOPES[s])
                    .map((s) => SHORT[s])
                    .join(", ") || "sign-in only"}
                </p>
                {grant.lastUsedAt && (
                  <p className="text-sm text-fg-subtle">
                    Last used{" "}
                    {grant.lastUsedAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <RevokeButton clientId={app.id} name={app.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
