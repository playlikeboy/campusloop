import type { Metadata } from "next";
import { FeedClient } from "@/app/(app)/(main)/feeds/feed-client";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

interface PostsTypePageProps {
  params: Promise<{ type: string }>;
}

const TYPE_COPY: Record<string, { title: string; description: string }> = {
  MEME: {
    title: "Campus memes",
    description: "Memes students post on CampusLoop about college life, exams and hostel days.",
  },
  POLL: {
    title: "Campus polls",
    description: "Polls from students on CampusLoop. Vote and see what your campus thinks.",
  },
  QUESTION: {
    title: "Campus questions",
    description: "Questions students ask on CampusLoop about classes, hostels, placements and more.",
  },
  CONFESSION: { title: "Confessions", description: "Anonymous confessions from students on CampusLoop." },
};

function copyFor(type: string) {
  return (
    TYPE_COPY[type] ?? { title: "Posts", description: "Posts from students on CampusLoop, filtered by type." }
  );
}

export async function generateMetadata({ params }: PostsTypePageProps): Promise<Metadata> {
  const type = (await params).type.toUpperCase();
  const { title, description } = copyFor(type);
  return buildMetadata({
    title,
    description,
    path: `/posts/${type.toLowerCase()}`,
    // Anonymous posts and unknown filters are never indexed.
    noindex: type === "CONFESSION" || !(type in TYPE_COPY),
  });
}

export default async function PostsTypePage({ params }: PostsTypePageProps) {
  const type = (await params).type.toUpperCase();
  const { title } = copyFor(type);

  return (
    <>
      {type in TYPE_COPY && type !== "CONFESSION" ? (
        <JsonLd data={breadcrumbJsonLd([{ name: title, path: `/posts/${type.toLowerCase()}` }])} />
      ) : null}
      <FeedClient forcedType={type} />
    </>
  );
}
