import type { Metadata } from "next";
import { AuthorHub, authorHubMetadata } from "../author-hub";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return authorHubMetadata(decodeURIComponent((await params).username), 1);
}

export default async function AuthorPage({ params }: Props) {
  return <AuthorHub username={decodeURIComponent((await params).username)} page={1} />;
}
