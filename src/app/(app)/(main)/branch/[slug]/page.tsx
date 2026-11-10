import type { Metadata } from "next";
import { findBranchBySlug } from "@/constants";
import { buildMetadata } from "@/lib/seo";
import { BranchDirectoryClient } from "./branch-client";

interface BranchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BranchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const branch = findBranchBySlug(decoded)?.name ?? decoded.replace(/-/g, " ");
  // A list of people, loaded in the browser: useful to students, thin for search engines.
  return buildMetadata({
    title: `${branch} students`,
    description: `Find students studying ${branch} at your college and other colleges on CampusLoop.`,
    path: `/branch/${slug}`,
    noindex: true,
  });
}

export default function BranchDirectoryPage() {
  return <BranchDirectoryClient />;
}
