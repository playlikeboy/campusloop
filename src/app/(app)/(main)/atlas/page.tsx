import type { Metadata } from "next";
import { AtlasClient } from "@/components/atlas/atlas-client";
import { isLiveSanityConfigured } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "Campus Atlas | Place Search & Campus Agent | CampusLoop",
  description:
    "Explore campus buildings, libraries, open food spots, and ask the campus intelligence agent questions.",
  alternates: { canonical: "https://campusloop.space/atlas" },
  openGraph: {
    title: "Campus Atlas | Place Search & Campus Agent | CampusLoop",
    description:
      "Explore campus buildings, libraries, open food spots, and ask the campus intelligence agent questions.",
    url: "https://campusloop.space/atlas",
    siteName: "CampusLoop Atlas",
  },
};

export default function AtlasPage() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo-campusloop";
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

  return (
    <AtlasClient
      initialSanityConfigured={isLiveSanityConfigured}
      projectId={projectId}
      dataset={dataset}
    />
  );
}
