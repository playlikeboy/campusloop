import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { userMcpKeys, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { DeveloperMcpClient } from "@/components/developer/developer-mcp-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Developer & MCP Server Portal | CampusLoop",
  description:
    "Generate personal Model Context Protocol (MCP) API keys to connect CampusLoop directly to Cursor, Windsurf, Claude Desktop, and AI agents.",
  openGraph: {
    title: "Developer & MCP Server Portal | CampusLoop",
    description:
      "Connect your verified campus account to AI agents and IDEs via Model Context Protocol (MCP).",
    url: "https://campusloop.space/app/developer",
    siteName: "CampusLoop",
  },
};

export default async function DeveloperPortalPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) redirect("/handler/sign-in");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    with: {
      institution: true,
    },
  });

  if (!profile) redirect("/onboarding");

  const initialKeys = await db.query.userMcpKeys.findMany({
    where: eq(userMcpKeys.userId, profile.id),
    orderBy: [desc(userMcpKeys.createdAt)],
  });

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <DeveloperMcpClient
          initialKeys={initialKeys}
          studentUsername={profile.username}
          collegeName={profile.institution?.name || "Campus"}
        />
      </div>
    </>
  );
}
