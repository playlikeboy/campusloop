import type { Metadata } from "next";
import { SitemapClient } from "./sitemap-client";

export const metadata: Metadata = {
  title: "Visual Sitemap — CampusLoop Architecture",
  description:
    "Explore the visual architecture and complete sitemap of CampusLoop pages: explore, academics, communities, events, colleges, and trust resources.",
  keywords: [
    "CampusLoop Sitemap",
    "CampusLoop Architecture",
    "College Directory Sitemap",
    "Campus Network Directory",
  ],
  alternates: { canonical: "https://campusloop.space/sitemap" },
  openGraph: {
    title: "Visual Sitemap — CampusLoop Architecture",
    description: "Explore the visual architecture of CampusLoop pages.",
    url: "https://campusloop.space/sitemap",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/campusloop/marketing/voxel/social-preview.webp",
        width: 1200,
        height: 630,
        alt: "CampusLoop Visual Sitemap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Sitemap — CampusLoop Architecture",
    description: "Explore the visual architecture of CampusLoop pages.",
    images: ["https://campusloop.space/campusloop/marketing/voxel/social-preview.webp"],
  },
};

export default function SitemapPage() {
  return <SitemapClient />;
}
