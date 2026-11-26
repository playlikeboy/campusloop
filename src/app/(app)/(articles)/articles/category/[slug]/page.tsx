import type { Metadata } from "next";
import { CategoryHub, categoryHubMetadata } from "../category-hub";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryHubMetadata((await params).slug, 1);
}

export default async function ArticleCategoryPage({ params }: Props) {
  return <CategoryHub slug={(await params).slug} page={1} />;
}
