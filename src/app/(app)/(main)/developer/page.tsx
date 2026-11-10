import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeveloperMcpClient } from "@/components/developer/developer-mcp-client";
import { AppsSection } from "@/components/oauth/apps-section";
import { getDb } from "@/db";
import { oauthClients, userMcpKeys, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "Developer & MCP Server Portal",
  description:
    "Generate personal Model Context Protocol (MCP) API keys to connect CampusLoop directly to Cursor, Windsurf, Claude Desktop, and AI agents.",
  openGraph: {
    title: "Developer & MCP Server Portal",
    description:
      "Connect your verified campus account to AI agents and IDEs via Model Context Protocol (MCP).",
    url: "https://campusloop.space/developer",
    siteName: "CampusLoop",
  },
};

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CampusLoop Model Context Protocol (MCP) Server",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cloud, macOS, Linux, Windows",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <AppsSection apps={apps} />
        <DeveloperMcpClient
          initialKeys={initialKeys}
          studentUsername={profile.username}
          collegeName={profile.institution?.name || "Campus"}
        />
      </div>
    </>
  );
}
