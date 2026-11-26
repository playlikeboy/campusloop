import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { authorPagePath, parsePageParam } from "@/lib/articles/seo";
import { AuthorHub, authorHubMetadata } from "../../../author-hub";

type Props = { params: Promise<{ username: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, n } = await params;
  if (n === "1") return authorHubMetadata(decodeURIComponent(username), 1);
  const page = parsePageParam(n);
  if (!page) notFound();
  return authorHubMetadata(decodeURIComponent(username), page);
}

export default async function AuthorPagedPage({ params }: Props) {
  const { username, n } = await params;
  // /page/1 is the author page itself.
  if (n === "1") permanentRedirect(authorPagePath(decodeURIComponent(username)));
  const page = parsePageParam(n);
  if (!page) notFound();
  return <AuthorHub username={decodeURIComponent(username)} page={page} />;
}
