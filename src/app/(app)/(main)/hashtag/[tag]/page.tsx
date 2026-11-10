import type { Metadata } from "next";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import HashtagFeed from "./hashtag-feed";

interface PageProps {
  params: Promise<{ tag: string }>;
}

function readTag(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = readTag((await params).tag);
  return buildMetadata({
    title: `#${tag}`,
    description: `Posts, polls and questions tagged #${tag} by students on CampusLoop.`,
    path: `/hashtag/${encodeURIComponent(tag)}`,
  });
}

export default async function HashtagPage({ params }: PageProps) {
  const tag = readTag((await params).tag);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: `#${tag}`, path: `/hashtag/${encodeURIComponent(tag)}` }])} />
      <HashtagFeed />
    </>
  );
}
