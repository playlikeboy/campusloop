import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AcademicWatchClient } from "@/components/academics/academic-watch-client";
import { getEffectiveModules } from "@/lib/academics/modules";
import { resolveAcademicResource } from "@/lib/academics/slug";
import { privateMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await resolveAcademicResource(slug);
  return privateMetadata(resource ? `Watch: ${resource.title}` : "Watch lectures");
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
