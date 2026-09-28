import type { Metadata } from "next";
import { AtlasClient } from "@/components/atlas/atlas-client";
import { isLiveSanityConfigured } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "CampusLoop Atlas — Grounded Campus Intelligence Agent",
  description:
    "Ask the campus and get answers grounded in real, structured campus content through Sanity Content Lake and GROQ reasoning.",
  openGraph: {
    title: "CampusLoop Atlas — Sanity Challenge Agent",
    description:
      "A structured campus knowledge agent that reasons over clubs, schedules, eligibility, and venues without hallucination.",
    url: "https://campusloop.space/app/atlas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Atlas — Sanity Challenge Agent",
    description:
      "A structured campus knowledge agent that reasons over clubs, schedules, eligibility, and venues without hallucination.",
  },
};

export default function AtlasPage() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo-campusloop";
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CampusLoop Atlas",
    applicationCategory: "CampusAssistantApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
    },
    description:
      "CampusLoop Atlas is an intelligent campus agent that queries structured Sanity content to answer multi-constraint student questions.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container max-w-5xl py-6 px-4 md:px-6">
        <AtlasClient
          initialSanityConfigured={isLiveSanityConfigured}
          projectId={projectId}
          dataset={dataset}
        />
      </div>
    </>
  );
}
