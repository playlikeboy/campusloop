import { ArrowLeft, ChevronRight, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentPermalinkView } from "@/components/post/comment-permalink-view";
import { ParentPostContextCard } from "@/components/post/parent-post-context-card";
import { getCachedCommentDetail } from "@/lib/server-cache";
import { cleanSnippet } from "@/lib/utils";

interface CommentPageProps {
  params: Promise<{ id: string; commentId: string }>;
}

export async function generateMetadata({ params }: CommentPageProps): Promise<Metadata> {
  const { id, commentId } = await params;
  const comment = await getCachedCommentDetail(commentId);

  if (!comment || comment.postId !== id || comment.status !== "PUBLISHED") {
    return {
      title: "Comment | CampusLoop",
      description: "Explore verified student discussions and comments on CampusLoop.",
      robots: { index: false, follow: false },
    };
  }

  const post = comment.post;
  const commentAuthor = comment.isAnonymous
    ? comment.pseudonym || "Anonymous Student"
    : comment.author?.displayName || comment.author?.username || "Student";

  const postTitle = post?.title?.trim() || cleanSnippet(post?.body || "", 60) || "Campus Discussion";
  const title = `"${commentAuthor} on ${postTitle}" | CampusLoop`;
  const description = cleanSnippet(comment.body, 157).slice(0, 160) || "Join the conversation on CampusLoop.";
  const canonicalUrl = `https://campusloop.space/post/${id}/comment/${commentId}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "CampusLoop",
      type: "article",
      images: [
        {
          url: "https://campusloop.space/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://campusloop.space/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
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
    <div className="w-full h-full overflow-y-auto bg-background/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <Link
            href={`/post/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to full post</span>
          </Link>

          {/* Breadcrumb Trail for SEO & Google Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 overflow-hidden">
            <Link href="/feeds" className="hover:text-foreground transition-colors truncate">
              Home
            </Link>
            <ChevronRight className="size-3 shrink-0 text-muted-foreground/40" />
            {post.institution && (
              <>
                <Link
                  href={`/college/${post.institution.slug || post.institution.id}`}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {collegeName}
                </Link>
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/40" />
              </>
            )}
            <Link href={`/post/${id}`} className="hover:text-foreground transition-colors truncate max-w-[100px]">
              Discussion
            </Link>
            <ChevronRight className="size-3 shrink-0 text-muted-foreground/40" />
            <span className="text-foreground font-semibold truncate">Comment</span>
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
