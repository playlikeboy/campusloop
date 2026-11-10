import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeveloperMcpClient } from "@/components/developer/developer-mcp-client";
import { AppsSection } from "@/components/oauth/apps-section";
import { getDb } from "@/db";
import { oauthClients, userMcpKeys, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = privateMetadata("Developer settings");

export default async function DeveloperPortalPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) redirect("/sign-in");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    with: {
      institution: true,
    },
  });

  if (!profile) redirect("/onboarding");

  const [initialKeys, apps] = await Promise.all([
    db.query.userMcpKeys.findMany({
      where: eq(userMcpKeys.userId, profile.id),
      orderBy: [desc(userMcpKeys.createdAt)],
    }),
    db.query.oauthClients.findMany({
      where: eq(oauthClients.ownerProfileId, profile.id),
      orderBy: [desc(oauthClients.createdAt)],
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl text-fg">Developer settings</h1>
        <p className="mt-1 text-sm text-fg-muted">Your Login with CampusLoop apps and your AI agent keys.</p>
      </header>
      <AppsSection apps={apps} />
      <DeveloperMcpClient
        initialKeys={initialKeys}
        studentUsername={profile.username}
        collegeName={profile.institution?.name || "Campus"}
      />
    </div>
  );
}
