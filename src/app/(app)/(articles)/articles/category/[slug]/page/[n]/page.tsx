import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { categoryPagePath, parsePageParam } from "@/lib/articles/seo";
import { CategoryHub, categoryHubMetadata } from "../../../category-hub";

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  if (n === "1") return categoryHubMetadata(slug, 1);
  const page = parsePageParam(n);
  if (!page) notFound();
  return categoryHubMetadata(slug, page);
}

export default async function ArticleCategoryPagedPage({ params }: Props) {
  const { slug, n } = await params;
  // /page/1 is the hub itself.
  if (n === "1") permanentRedirect(categoryPagePath(slug));
  const page = parsePageParam(n);
  if (!page) notFound();
  return <CategoryHub slug={slug} page={page} />;
}
