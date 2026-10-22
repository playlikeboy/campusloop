import type { Metadata } from "next";
import { EcosystemClient } from "./ecosystem-client";

export const metadata: Metadata = {
  title: "CampusLoop Ecosystem | Dedicated Apps, AI Tools & Campus Utilities",
  description:
    "Explore purpose-built products, AI companions, interview prep suites, and campus living utilities designed for student life across Indian colleges.",
  alternates: { canonical: "https://campusloop.space/ecosystem" },
  openGraph: {
    title: "CampusLoop Ecosystem | Dedicated Apps, AI Tools & Campus Utilities",
    description:
      "Explore purpose-built products, AI companions, interview prep suites, and campus living utilities designed for student life across Indian colleges.",
    url: "https://campusloop.space/ecosystem",
    siteName: "CampusLoop",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "CampusLoop Ecosystem" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Ecosystem | Dedicated Apps, AI Tools & Campus Utilities",
    description:
      "Explore purpose-built products, AI companions, interview prep suites, and campus living utilities designed for student life across Indian colleges.",
    images: ["https://campusloop.space/og-image.png"],
  },
};

export default function EcosystemPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CampusLoop Ecosystem",
    description:
      "Directory of purpose-built products, AI companions, interview prep suites, and campus utilities designed for student life across Indian colleges.",
    url: "https://campusloop.space/ecosystem",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
    hasPart: [
      {
        "@type": "WebApplication",
        name: "DSALoop",
        applicationCategory: "EducationalApplication",
        url: "https://dsaloop.campusloop.space",
        description: "Pattern-First Coding Interview & System Design Workspace with 185+ curated company problem tracks.",
      },
      {
        "@type": "WebApplication",
        name: "baby",
        applicationCategory: "HealthApplication",
        url: "https://baby.campusloop.space",
        description: "A calm AI companion and mindful journal that remembers your college reflections with zero streaks.",
      },
      {
        "@type": "WebApplication",
        name: "Campus AI Assistant",
        applicationCategory: "EducationalApplication",
        url: "https://campusloop.space/ai",
        description: "Context-aware student reasoning engine for course roadmaps and campus navigation.",
      },
      {
        "@type": "WebApplication",
        name: "Developer & MCP Portal",
        applicationCategory: "DeveloperApplication",
        url: "https://campusloop.space/developer",
        description: "Model Context Protocol keys to connect Cursor, Claude Desktop, and AI agents directly to campus knowledge.",
      },
      {
        "@type": "WebApplication",
        name: "Campus Atlas",
        applicationCategory: "DirectoryApplication",
        url: "https://campusloop.space/atlas",
        description: "Structured natural language reasoning over verified campus clubs, departments, and schedules.",
      },
      {
        "@type": "WebApplication",
        name: "Random Loop",
        applicationCategory: "SocialNetworkingApplication",
        url: "https://campusloop.space/random",
        description: "Real-time serendipitous 1-on-1 discovery and chat with verified college peers across India.",
      },
      {
        "@type": "WebApplication",
        name: "Campus Marketplace",
        applicationCategory: "ShoppingApplication",
        url: "https://campusloop.space/marketplace",
        description: "Zero-brokerage student dorm commerce, books, cycles, and canteen ordering.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EcosystemClient />
    </>
  );
}
