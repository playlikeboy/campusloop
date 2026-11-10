import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AcademicDetailClient } from "@/components/academics/academic-detail-client";
import { resolveAcademicResource } from "@/lib/academics/slug";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/seo/constants";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

interface AcademicSlugPageProps {
  params: Promise<{ slug: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  NOTES: "notes",
  PYQ: "past paper (PYQ)",
  CHEAT_SHEET: "formula sheet",
  LAB_MANUAL: "lab manual",
  SYLLABUS: "syllabus",
};

/** The resolver accepts ids, aliases and fuzzy slugs; the id is the one stable URL (and the one in the sitemap). */
function canonicalPath(id: string) {
  return `/academics/study-material/${id}`;
}

export async function generateMetadata({ params }: AcademicSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await resolveAcademicResource(slug);
  if (!resource) return { title: "File not found", robots: { index: false, follow: false } };

  const typeLabel = TYPE_LABELS[resource.resourceType] ?? "study material";
  const college = resource.institution?.name ? ` at ${resource.institution.name}` : "";
  const description =
    resource.description?.slice(0, 160) ||
    `${resource.subjectName} (${resource.subjectCode}) ${typeLabel} for ${resource.branch}, semester ${resource.semester}${college}. Free to read on CampusLoop.`;

  return buildMetadata({
    title: `${resource.title} (${resource.subjectCode})`,
    description,
    path: canonicalPath(resource.id),
    type: "article",
    image: { url: "/og-academics.png", width: 1536, height: 1024, alt: resource.title },
    publishedTime: resource.createdAt ? new Date(resource.createdAt).toISOString() : undefined,
    modifiedTime: resource.updatedAt ? new Date(resource.updatedAt).toISOString() : undefined,
    authors: resource.uploader?.displayName ? [resource.uploader.displayName] : undefined,
    keywords: Array.from(
      new Set([
        resource.subjectCode,
        resource.subjectName,
        `${resource.subjectCode} notes`,
        `${resource.subjectName} PYQ`,
        resource.branch,
        `Semester ${resource.semester}`,
        ...(Array.isArray(resource.tags) ? (resource.tags as string[]) : []),
      ])
    ),
  });
}

export default async function AcademicResourceSlugPage({ params }: AcademicSlugPageProps) {
  const { slug } = await params;
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  const resource = await resolveAcademicResource(slug);
  if (!resource) notFound();

  const path = canonicalPath(resource.id);
  const canonicalUrl = absoluteUrl(path);

  // Only facts stored for this file. No ratings, counts or claims that are not in the database.
  const learningResource = {
    "@type": "LearningResource",
    url: canonicalUrl,
    name: resource.title,
    description: resource.description || resource.title,
    learningResourceType: resource.resourceType,
    educationalLevel: `Semester ${resource.semester}`,
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    teaches: resource.subjectName,
    about: { "@type": "Course", name: resource.subjectName, courseCode: resource.subjectCode },
    ...(resource.institution?.name
      ? { sourceOrganization: { "@type": "CollegeOrUniversity", name: resource.institution.name } }
      : {}),
    ...(resource.uploader?.displayName
      ? { author: { "@type": "Person", name: resource.uploader.displayName } }
      : {}),
    ...(resource.createdAt ? { datePublished: new Date(resource.createdAt).toISOString() } : {}),
    ...(resource.updatedAt ? { dateModified: new Date(resource.updatedAt).toISOString() } : {}),
  };

  return (
    <>
      <JsonLd
        data={[
          learningResource,
          breadcrumbJsonLd([
            { name: "Study material", path: "/academics" },
            { name: resource.title, path },
          ]),
        ]}
      />
      <AcademicDetailClient
        initialResource={resource}
        currentUserId={profile?.id ?? null}
        canonicalUrl={canonicalUrl}
      />
    </>
  );
}
