import { redirect } from "next/navigation";
import { AcademicsClient } from "@/app/(app)/(academics)/academics/study-material/academics-client";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/seo/constants";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

/**
 * /academics and /academics/study-material render the same hub.
 * Both point their canonical at /academics, the URL in the sitemap.
 */
export const academicsHubMetadata = buildMetadata({
  title: "College notes and PYQs",
  description:
    "Free notes, past papers (PYQs), formula sheets and lab manuals shared by students. Filter by branch and semester.",
  path: "/academics",
  image: { url: "/og-academics.png", width: 1536, height: 1024, alt: "CampusLoop study material" },
  keywords: [
    "college notes PDF",
    "B.Tech semester notes",
    "previous year question papers",
    "PYQ",
    "engineering formula sheets",
    "lab manuals",
  ],
});

const collectionJsonLd = {
  "@type": "CollectionPage",
  name: "College notes and PYQs",
  description: "Notes, past papers, formula sheets and lab manuals shared by college students.",
  url: absoluteUrl("/academics"),
  inLanguage: "en-IN",
  isPartOf: { "@id": `${SITE_URL}/#website` },
};

export async function AcademicsHubPage({ searchParams }: { searchParams?: Promise<{ id?: string }> }) {
  const resolved = searchParams ? await searchParams : undefined;
  if (resolved?.id) redirect(`/academics/study-material/${resolved.id}`);

  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  return (
    <>
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd([{ name: "Study material", path: "/academics" }])]} />
      <AcademicsClient
        profileId={profile?.id ?? null}
        collegeName={profile?.institution?.name ?? undefined}
        userBranch={profile?.branch || "Computer Science"}
        userSemester={profile?.year ? Math.min(8, Math.max(1, profile.year * 2 - 1)) : 5}
      />
    </>
  );
}
