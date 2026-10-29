import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AcademicWatchClient } from "@/components/academics/academic-watch-client";
import { resolveAcademicResource } from "@/lib/academics/slug";
import { getEffectiveModules } from "@/lib/academics/modules";

export const dynamic = "force-dynamic";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await resolveAcademicResource(slug);
  if (!resource) {
    return { title: "Course Player | CampusLoop" };
  }
  return {
    title: `${resource.title} — Course Player | CampusLoop`,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicWatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  const resource = await resolveAcademicResource(slug);
  if (!resource) {
    notFound();
  }

  const modules = getEffectiveModules(resource);

  return (
    <AcademicWatchClient
      resourceId={resource.id}
      title={resource.title}
      subjectCode={resource.subjectCode}
      modules={modules}
    />
  );
}
