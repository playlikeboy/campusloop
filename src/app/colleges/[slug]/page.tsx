import { permanentRedirect } from "next/navigation";
import { getCachedInstitution } from "@/lib/server-cache";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Old public college URL. The real college page lives at /college/[slug] (it
 * reads the college from the database and is what the sitemap lists), so this
 * route only forwards to it.
 */
export default async function CollegeSlugRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const college = await getCachedInstitution(slug).catch(() => null);
  permanentRedirect(`/college/${encodeURIComponent(college?.slug || college?.id || slug)}`);
}
