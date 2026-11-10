import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentPermalinkView } from "@/components/post/comment-permalink-view";
import { ParentPostContextCard } from "@/components/post/parent-post-context-card";
import { buildMetadata, serializeJsonLd } from "@/lib/seo";
import { getCachedCommentDetail } from "@/lib/server-cache";
import { cleanSnippet } from "@/lib/utils";

interface CommentPageProps {
  params: Promise<{ id: string; commentId: string }>;
}

export async function generateMetadata({ params }: CommentPageProps): Promise<Metadata> {
  const { id, commentId } = await params;
  const comment = await getCachedCommentDetail(commentId);
  const path = `/post/${id}/comment/${commentId}`;

  if (!comment || comment.postId !== id || comment.status !== "PUBLISHED") {
    return buildMetadata({ title: "Comment", description: "A comment on CampusLoop.", path, noindex: true });
  }

  const post = comment.post;
  const commentAuthor = comment.isAnonymous
    ? "Anonymous"
    : comment.author?.displayName || comment.author?.username || "A student";
  const postTitle = post?.title?.trim() || cleanSnippet(post?.body || "", 50) || "a post";
  const isPrivate =
    comment.isAnonymous ||
    !post ||
    post.isAnonymous ||
    post.type === "CONFESSION" ||
    post.type === "ANONYMOUS" ||
    post.status !== "PUBLISHED";

  return buildMetadata({
    title: `${commentAuthor} on "${postTitle}"`,
    description: cleanSnippet(comment.body, 155) || "A comment from a student on CampusLoop.",
    path,
    type: "article",
    noindex: isPrivate,
  });
}

export default async function CommentPermalinkPage({ params }: CommentPageProps) {
  const { id, commentId } = await params;
  const rawComment = await getCachedCommentDetail(commentId);

  if (!rawComment || rawComment.postId !== id || rawComment.status !== "PUBLISHED") {
    notFound();
  }

  const post = rawComment.post;
  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const commentAuthor = rawComment.isAnonymous
    ? rawComment.pseudonym || "Anonymous Student"
    : rawComment.author?.displayName || rawComment.author?.username || "Student";

  const postTitle = post.title?.trim() || cleanSnippet(post.body, 60) || "Campus Discussion";
  const postAuthor = post.isAnonymous
    ? "Anonymous Student"
    : post.author?.displayName || post.author?.username || "Student";

  const collegeName = post.institution?.name?.split(",")[0] || "Campus";

  // Sanitize author details for anonymous parent comment
  const sanitizedComment = {
    ...rawComment,
    author: rawComment.isAnonymous ? null : rawComment.author,
  };

  // Sanitize author details for anonymous replies
  const sanitizedReplies = (rawComment.replies || []).map((reply) => ({
    ...reply,
    author: reply.isAnonymous ? null : reply.author,
  }));

  // Only public comments on public posts get structured data
  const isIndexable =
    !rawComment.isAnonymous &&
    !post.isAnonymous &&
    post.type !== "CONFESSION" &&
    post.type !== "ANONYMOUS" &&
    post.status === "PUBLISHED";

  // Schema.org JSON-LD structured data for Comment & DiscussionForumPosting
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Comment",
    "@id": `https://campusloop.space/post/${id}/comment/${commentId}`,
    url: `https://campusloop.space/post/${id}/comment/${commentId}`,
    datePublished: rawComment.createdAt ? new Date(rawComment.createdAt).toISOString() : undefined,
    dateModified: rawComment.updatedAt ? new Date(rawComment.updatedAt).toISOString() : undefined,
    text: rawComment.body,
    author: {
      "@type": "Person",
      name: commentAuthor,
      ...(!rawComment.isAnonymous && rawComment.author?.username
        ? { url: `https://campusloop.space/@${rawComment.author.username}` }
        : {}),
    },
    parentItem: {
      "@type": "DiscussionForumPosting",
      "@id": `https://campusloop.space/post/${id}`,
      url: `https://campusloop.space/post/${id}`,
      headline: postTitle,
      text: post.body,
      datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      author: {
        "@type": "Person",
        name: postAuthor,
        ...(!post.isAnonymous && post.author?.username
          ? { url: `https://campusloop.space/@${post.author.username}` }
          : {}),
      },
      publisher: {
        "@type": "Organization",
        name: "CampusLoop",
        url: "https://campusloop.space",
        logo: {
          "@type": "ImageObject",
          url: "https://campusloop.space/logo.png",
        },
      },
    },
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-bg">
      {isIndexable ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      ) : null}

      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <Link
            href={`/post/${id}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg transition-ui cursor-pointer"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span>Back to the post</span>
          </Link>

          {/* Breadcrumb Trail for SEO & Google Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-fg-subtle overflow-hidden"
          >
            <Link href="/feeds" className="hover:text-fg transition-ui truncate">
              Home
            </Link>
            <ChevronRight className="size-3 shrink-0 text-fg-subtle" />
            {post.institution && (
              <>
                <Link
                  href={
                    post.institution.slug
                      ? `/colleges/${post.institution.slug}`
                      : `/college/${post.institution.id}`
                  }
                  className="hover:text-fg transition-ui truncate max-w-[120px]"
                >
                  {collegeName}
                </Link>
                <ChevronRight className="size-3 shrink-0 text-fg-subtle" />
              </>
            )}
            <Link href={`/post/${id}`} className="hover:text-fg transition-ui truncate max-w-[100px]">
              Post
            </Link>
            <ChevronRight className="size-3 shrink-0 text-fg-subtle" />
            <span className="text-fg font-semibold truncate" aria-current="page">
              Comment
            </span>
          </nav>
        </div>

        {/* 1. Parent Post Context Card */}
        <ParentPostContextCard
          post={{
            id: post.id,
            title: post.title,
            body: post.body,
            type: post.type,
            scope: post.scope,
            isAnonymous: post.isAnonymous,
            pseudonym: post.pseudonym,
            createdAt: post.createdAt,
            commentsCount: post.comments?.length || 0,
            author: post.author,
            institution: post.institution,
          }}
        />

        {/* 2. Highlighted Comment & Direct Replies View */}
        <CommentPermalinkView
          comment={sanitizedComment}
          replies={sanitizedReplies}
          postAuthorId={post.authorId}
          postCollegeName={collegeName}
        />
      </div>
    </div>
  );
}
