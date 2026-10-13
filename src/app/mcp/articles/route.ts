import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  articleCategories,
  articleComments,
  articleCommentVotes,
  articleLinks,
  articles,
  articleTags,
  articleToTags,
  articleVotes,
  institutions,
  userProfiles,
} from "@/db/schema";
import { ARTICLE_CATEGORIES, getCategoryMeta } from "@/constants/articles";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Accept, Content-Type, Authorization, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID, x-api-key, X-API-KEY, x-campusloop-mcp-key, x-mcp-key",
};

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function createExcerpt(content: string): string {
  const plainText = content
    .replace(/<[^>]*>/g, "")
    .replace(/#+\s+/g, "")
    .replace(/[*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
  return plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");
}

/**
 * Authenticates whether the request includes the valid MCP API key.
 * Checks URL query params (?apikey= or ?api_key=), headers (x-api-key, x-mcp-key),
 * or Bearer authorization.
 * Key value is strictly read from environment variables to prevent leaking into codebase.
 */
function verifyApiKey(req: Request): boolean {
  const configuredKey =
    process.env.MCP_ARTICLES_API_KEY ||
    process.env.MCP_EVENTS_API_KEY ||
    process.env.MCP_ACADEMICS_API_KEY ||
    process.env.MCP_API_KEY ||
    process.env.CAMPUSLOOP_MCP_API_KEY;

  if (!configuredKey || configuredKey.trim() === "") {
    return false;
  }

  const url = new URL(req.url);
  const queryKey =
    url.searchParams.get("apikey") ||
    url.searchParams.get("api_key") ||
    url.searchParams.get("key");

  const headerKey =
    req.headers.get("x-api-key") ||
    req.headers.get("X-API-KEY") ||
    req.headers.get("x-mcp-key") ||
    req.headers.get("x-campusloop-mcp-key");

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const bearerKey = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const expectedKey = configuredKey.trim();
  return [queryKey, headerKey, bearerKey].some((candidateKey) => candidateKey?.trim() === expectedKey);
}

/**
 * Resolves or falls back to an existing institution and author profile in the database.
 */
async function resolveAuthorAndInstitution(
  db: ReturnType<typeof getDb>,
  requestedAuthorId?: string,
  requestedInstitutionId?: string
) {
  let institutionId = requestedInstitutionId;
  if (institutionId) {
    const inst = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId),
      columns: { id: true },
    });
    if (!inst) institutionId = undefined;
  }

  if (!institutionId) {
    const firstInst = await db.query.institutions.findFirst({
      columns: { id: true },
    });
    institutionId = firstInst?.id;
  }

  let authorId = requestedAuthorId;
  if (authorId) {
    const prof = await db.query.userProfiles.findFirst({
      where: or(eq(userProfiles.id, authorId), eq(userProfiles.username, authorId)),
      columns: { id: true, institutionId: true },
    });
    if (!prof) {
      authorId = undefined;
    } else {
      authorId = prof.id;
      if (!institutionId) institutionId = prof.institutionId;
    }
  }

  if (!authorId) {
    const adminProf = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.role, "ADMIN"),
      columns: { id: true, institutionId: true },
    });
    if (adminProf) {
      authorId = adminProf.id;
      if (!institutionId) institutionId = adminProf.institutionId;
    } else {
      const anyProf = await db.query.userProfiles.findFirst({
        columns: { id: true, institutionId: true },
      });
      authorId = anyProf?.id;
      if (!institutionId && anyProf?.institutionId) {
        institutionId = anyProf.institutionId;
      }
    }
  }

  return { authorId, institutionId };
}

function formatArticle(art: any) {
  if (!art) return null;
  const catMeta = getCategoryMeta(art.category);
  return {
    id: art.id,
    slug: art.slug,
    title: art.title,
    subtitle: art.subtitle,
    excerpt: art.excerpt,
    content: art.content,
    coverImageUrl: art.coverImageUrl,
    category: art.category,
    categoryName: catMeta.label,
    categoryGroup: catMeta.group,
    tags: Array.isArray(art.tags) ? art.tags : [],
    readingTimeMinutes: art.readingTimeMinutes,
    viewsCount: art.viewsCount || 0,
    upvotesCount: art.upvotesCount || 0,
    downvotesCount: art.downvotesCount || 0,
    isFeatured: Boolean(art.isFeatured),
    isDemo: Boolean(art.isDemo),
    status: art.status,
    publishedAt: art.publishedAt,
    createdAt: art.createdAt,
    updatedAt: art.updatedAt,
    author: art.author
      ? {
          id: art.author.id,
          username: art.author.username,
          displayName: art.author.displayName,
          headline: art.author.headline,
          branch: art.author.branch,
          year: art.author.year,
          avatarUrl: art.author.avatarUrl,
        }
      : null,
    institution: art.institution
      ? {
          id: art.institution.id,
          name: art.institution.name,
          slug: art.institution.slug,
        }
      : null,
    links: Array.isArray(art.links)
      ? art.links.map((l: any) => ({
          id: l.id,
          label: l.label,
          url: l.url,
          type: l.type,
          description: l.description,
        }))
      : [],
    commentsCount: Array.isArray(art.comments) ? art.comments.length : undefined,
  };
}

// Model Context Protocol (MCP) Tools Catalog for Articles
const MCP_ARTICLE_TOOLS = [
  // 1. Articles Lifecycle
  {
    name: "list_articles",
    description: "Search, filter, and paginate through student articles, guides, tutorials, and long-reads.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword matching title, excerpt, content, or tags" },
        category: { type: "string", description: "Category slug or key (e.g. 'ai-and-ml', 'TECH_AND_PROGRAMMING', 'placements', 'DSA')" },
        tag: { type: "string", description: "Filter by tag (e.g. 'nextjs', 'leetcode', 'interview')" },
        authorId: { type: "string", description: "Filter articles written by specific user ID or username" },
        status: { type: "string", enum: ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"], default: "PUBLISHED", description: "Publication status filter" },
        sort: { type: "string", enum: ["latest", "popular", "trending"], default: "latest" },
        page: { type: "integer", minimum: 1, default: 1, description: "Page number" },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20, description: "Items per page" },
      },
    },
  },
  {
    name: "get_article",
    description: "Retrieve complete article details by id or unique slug, including full body, author, links, and tags.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article id (e.g. 'art_...') or unique URL slug" },
      },
    },
  },
  {
    name: "search_articles",
    description: "Full-text search articles by keywords with category and tag relevance scoring.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Search terms or keywords" },
        category: { type: "string", description: "Optional category filter" },
        limit: { type: "integer", default: 20, maximum: 50 },
      },
    },
  },
  {
    name: "create_article",
    description: "Create and publish a student article or technical tutorial with markdown content, cover image, category, and links.",
    inputSchema: {
      type: "object",
      required: ["title", "content"],
      properties: {
        title: { type: "string", description: "Article title" },
        content: { type: "string", description: "Full article body (Markdown or HTML)" },
        slug: { type: "string", description: "Custom URL slug (auto-generated if omitted)" },
        subtitle: { type: "string", description: "Secondary headline or subtitle" },
        excerpt: { type: "string", description: "Short summary (auto-generated if omitted)" },
        category: { type: "string", default: "GENERAL", description: "Category key or slug (e.g. TECH_AND_PROGRAMMING, AI_AND_ML, DSA, PLACEMENTS)" },
        tags: { type: "array", items: { type: "string" }, description: "Tags list" },
        coverImageUrl: { type: "string", description: "Direct HTTPS URL for cover image" },
        status: { type: "string", enum: ["PUBLISHED", "DRAFT", "ARCHIVED"], default: "PUBLISHED" },
        authorId: { type: "string", description: "Author profile ID or username to attribute to" },
        institutionId: { type: "string", description: "Associated college/institution ID" },
        isFeatured: { type: "boolean", default: false, description: "Pin to featured carousel" },
        isDemo: { type: "boolean", default: false, description: "Mark as synthetic demo fixture" },
        links: {
          type: "array",
          items: {
            type: "object",
            required: ["url", "label"],
            properties: {
              url: { type: "string" },
              label: { type: "string" },
              description: { type: "string" },
              type: { type: "string", enum: ["GITHUB", "DOCS", "DEMO", "REFERENCE", "PAPER", "RESOURCE"] },
            },
          },
        },
      },
    },
  },
  {
    name: "update_article",
    description: "Update fields on an existing article by id or slug.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article ID or slug" },
        title: { type: "string" },
        subtitle: { type: "string" },
        excerpt: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        coverImageUrl: { type: "string" },
        status: { type: "string", enum: ["PUBLISHED", "DRAFT", "ARCHIVED"] },
        isFeatured: { type: "boolean" },
      },
    },
  },
  {
    name: "delete_article",
    description: "Delete an article (soft-archive by default, or permanent removal with hard: true).",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article ID or slug" },
        hard: { type: "boolean", default: false, description: "Permanently delete if true, otherwise archive" },
      },
    },
  },
  {
    name: "publish_article",
    description: "Validate and transition a draft article to PUBLISHED status with current timestamp.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article ID or slug to publish" },
      },
    },
  },
  {
    name: "unpublish_article",
    description: "Revert a published article back to private DRAFT status.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article ID or slug to unpublish" },
      },
    },
  },
  {
    name: "archive_article",
    description: "Mark an article as ARCHIVED.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article ID or slug" },
      },
    },
  },
  {
    name: "restore_article",
    description: "Restore an archived article back to PUBLISHED status.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Article ID or slug" },
      },
    },
  },

  // 2. Categories & Tags
  {
    name: "list_categories",
    description: "List all article categories with icons, descriptions, groups, and article counts.",
    inputSchema: {
      type: "object",
      properties: {
        group: { type: "string", enum: ["ALL", "TECHNOLOGY", "ACADEMICS", "LIFESTYLE", "GENERAL"], default: "ALL" },
      },
    },
  },
  {
    name: "get_category",
    description: "Get category details by slug or ID.",
    inputSchema: {
      type: "object",
      required: ["slugOrId"],
      properties: {
        slugOrId: { type: "string", description: "Category slug (e.g. 'ai-and-ml') or ID" },
      },
    },
  },
  {
    name: "create_category",
    description: "Create a new article category taxonomy entry.",
    inputSchema: {
      type: "object",
      required: ["slug", "name"],
      properties: {
        slug: { type: "string", description: "URL-safe unique category slug" },
        name: { type: "string", description: "Display name" },
        description: { type: "string" },
        group: { type: "string", enum: ["TECHNOLOGY", "ACADEMICS", "LIFESTYLE", "GENERAL"], default: "GENERAL" },
        icon: { type: "string", description: "Lucide icon name" },
        sortOrder: { type: "integer", default: 0 },
      },
    },
  },
  {
    name: "update_category",
    description: "Update category name, description, group, or icon.",
    inputSchema: {
      type: "object",
      required: ["slugOrId"],
      properties: {
        slugOrId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        group: { type: "string", enum: ["TECHNOLOGY", "ACADEMICS", "LIFESTYLE", "GENERAL"] },
        icon: { type: "string" },
        sortOrder: { type: "integer" },
      },
    },
  },
  {
    name: "delete_category",
    description: "Delete an article category, safely remapping any existing articles to GENERAL.",
    inputSchema: {
      type: "object",
      required: ["slugOrId"],
      properties: {
        slugOrId: { type: "string" },
        fallbackCategory: { type: "string", default: "GENERAL" },
      },
    },
  },
  {
    name: "list_tags",
    description: "List popular article tags and their usage counts.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 50, maximum: 100 },
      },
    },
  },
  {
    name: "create_tag",
    description: "Create a standardized tag in the catalog.",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "Tag name without #" },
        slug: { type: "string", description: "Optional custom slug" },
      },
    },
  },
  {
    name: "update_tag",
    description: "Update tag name or slug.",
    inputSchema: {
      type: "object",
      required: ["slugOrId", "name"],
      properties: {
        slugOrId: { type: "string" },
        name: { type: "string" },
      },
    },
  },
  {
    name: "delete_tag",
    description: "Delete a tag and detach it from associated articles.",
    inputSchema: {
      type: "object",
      required: ["slugOrId"],
      properties: {
        slugOrId: { type: "string" },
      },
    },
  },
  {
    name: "add_article_tag",
    description: "Attach a tag to an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug", "tag"],
      properties: {
        articleIdOrSlug: { type: "string" },
        tag: { type: "string", description: "Tag name without #" },
      },
    },
  },
  {
    name: "remove_article_tag",
    description: "Remove a tag from an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug", "tag"],
      properties: {
        articleIdOrSlug: { type: "string" },
        tag: { type: "string" },
      },
    },
  },

  // 3. Article Links & Resources
  {
    name: "list_article_links",
    description: "List external resources, repositories, and documentation links attached to an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
      },
    },
  },
  {
    name: "add_article_link",
    description: "Attach an external resource link (GitHub, Docs, Paper, Demo) to an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug", "url", "label"],
      properties: {
        articleIdOrSlug: { type: "string" },
        url: { type: "string", description: "HTTPS URL of the resource" },
        label: { type: "string", description: "Link title or label" },
        description: { type: "string" },
        type: { type: "string", enum: ["GITHUB", "DOCS", "DEMO", "REFERENCE", "PAPER", "RESOURCE"], default: "REFERENCE" },
        displayOrder: { type: "integer", default: 0 },
      },
    },
  },
  {
    name: "update_article_link",
    description: "Update an existing article link.",
    inputSchema: {
      type: "object",
      required: ["linkId"],
      properties: {
        linkId: { type: "string" },
        url: { type: "string" },
        label: { type: "string" },
        description: { type: "string" },
        type: { type: "string", enum: ["GITHUB", "DOCS", "DEMO", "REFERENCE", "PAPER", "RESOURCE"] },
        displayOrder: { type: "integer" },
      },
    },
  },
  {
    name: "delete_article_link",
    description: "Remove an attached link from an article.",
    inputSchema: {
      type: "object",
      required: ["linkId"],
      properties: {
        linkId: { type: "string" },
      },
    },
  },

  // 4. Comments & Discussions
  {
    name: "list_comments",
    description: "List comments for an article with nested reply support.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
        parentId: { type: "string", description: "Optional parent comment ID for replies" },
        limit: { type: "integer", default: 50, maximum: 100 },
      },
    },
  },
  {
    name: "get_comment",
    description: "Get comment details by ID.",
    inputSchema: {
      type: "object",
      required: ["commentId"],
      properties: {
        commentId: { type: "string" },
      },
    },
  },
  {
    name: "create_comment",
    description: "Post a new comment or feedback on an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug", "body"],
      properties: {
        articleIdOrSlug: { type: "string" },
        body: { type: "string", description: "Comment body text" },
        authorId: { type: "string", description: "Author profile ID or username" },
        parentId: { type: "string", description: "Parent comment ID if this is a reply" },
      },
    },
  },
  {
    name: "update_comment",
    description: "Edit comment body text.",
    inputSchema: {
      type: "object",
      required: ["commentId", "body"],
      properties: {
        commentId: { type: "string" },
        body: { type: "string" },
      },
    },
  },
  {
    name: "delete_comment",
    description: "Delete a comment and any nested replies.",
    inputSchema: {
      type: "object",
      required: ["commentId"],
      properties: {
        commentId: { type: "string" },
      },
    },
  },
  {
    name: "reply_to_comment",
    description: "Post a nested reply to an existing comment.",
    inputSchema: {
      type: "object",
      required: ["commentId", "body"],
      properties: {
        commentId: { type: "string" },
        body: { type: "string" },
        authorId: { type: "string" },
      },
    },
  },
  {
    name: "get_article_discussion",
    description: "Fetch comprehensive article discussion including comment tree, vote counts, and author details.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
      },
    },
  },

  // 5. Likes & Reactions
  {
    name: "like_article",
    description: "Register an upvote or reaction for an article (idempotent).",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
        authorId: { type: "string", description: "Liker profile ID or username" },
        value: { type: "integer", enum: [1, -1], default: 1, description: "1 for upvote, -1 for downvote" },
      },
    },
  },
  {
    name: "unlike_article",
    description: "Remove an existing vote/like from an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
        authorId: { type: "string" },
      },
    },
  },
  {
    name: "get_article_likes",
    description: "Get list of users who upvoted an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
        limit: { type: "integer", default: 50, maximum: 100 },
      },
    },
  },
  {
    name: "get_article_like_count",
    description: "Get total upvotes, downvotes, and net score for an article.",
    inputSchema: {
      type: "object",
      required: ["articleIdOrSlug"],
      properties: {
        articleIdOrSlug: { type: "string" },
      },
    },
  },
  {
    name: "add_comment_reaction",
    description: "Upvote a comment (idempotent).",
    inputSchema: {
      type: "object",
      required: ["commentId"],
      properties: {
        commentId: { type: "string" },
        authorId: { type: "string" },
        value: { type: "integer", enum: [1, -1], default: 1 },
      },
    },
  },
  {
    name: "remove_comment_reaction",
    description: "Remove upvote from a comment.",
    inputSchema: {
      type: "object",
      required: ["commentId"],
      properties: {
        commentId: { type: "string" },
        authorId: { type: "string" },
      },
    },
  },

  // 6. Authors & Demo Accounts
  {
    name: "list_authors",
    description: "List authorized article authors with article counts.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        demoOnly: { type: "boolean", default: false },
        limit: { type: "integer", default: 30, maximum: 50 },
      },
    },
  },
  {
    name: "get_author",
    description: "Get author profile metadata and their authored articles.",
    inputSchema: {
      type: "object",
      required: ["idOrUsername"],
      properties: {
        idOrUsername: { type: "string" },
      },
    },
  },
  {
    name: "list_demo_accounts",
    description: "List the 30 synthetic demo author accounts available for programmatic publishing.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 50 },
      },
    },
  },
  {
    name: "get_demo_account",
    description: "Get details for a specific demo account by username.",
    inputSchema: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string", description: "Username (e.g. 'loop_tech', 'loop_ai')" },
      },
    },
  },
  {
    name: "update_demo_account",
    description: "Update display name, headline, bio, or interests of a synthetic demo account.",
    inputSchema: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string" },
        displayName: { type: "string" },
        headline: { type: "string" },
        bio: { type: "string" },
        interests: { type: "array", items: { type: "string" } },
      },
    },
  },

  // 7. Platform Statistics & Metadata
  {
    name: "get_articles_metadata",
    description: "Get platform article statistics, category distribution, total reads, and draft counts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

function renderDocumentationHtml(origin: string, isAuth: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusLoop Articles MCP Engine — API & Tools Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    pre { background: #0f172a; color: #f8fafc; border-radius: 0.75rem; padding: 1rem; overflow-x: auto; font-size: 0.85rem; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-5xl mx-auto px-6 py-12">
    <div class="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
      <div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${isAuth ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}">
            ${isAuth ? "Superpowers Mode (Authenticated)" : "Read-Only Spec Mode"}
          </span>
          <span class="text-xs text-slate-500">v1.0.0 · JSON-RPC 2.0 / REST / SSE</span>
        </div>
        <h1 class="text-3xl font-extrabold mt-2 text-white">CampusLoop Articles MCP Engine</h1>
        <p class="text-slate-400 text-sm mt-1">Full-stack student journalism, technical long-reads, and placement guide management across 1,350+ Indian colleges.</p>
      </div>
      <div class="flex items-center gap-2">
        <a href="/mcp/articles/openapi.json" target="_blank" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition border border-slate-700">OpenAPI 3.1.0</a>
        <a href="/articles" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium rounded-lg transition">Visit /articles</a>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Registered MCP Tools</div>
        <div class="text-3xl font-black text-indigo-400 mt-2">${MCP_ARTICLE_TOOLS.length}</div>
        <div class="text-xs text-slate-400 mt-1">Articles, categories, tags, links, comments & authors</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Curated Categories</div>
        <div class="text-3xl font-black text-emerald-400 mt-2">38</div>
        <div class="text-xs text-slate-400 mt-1">Tech & Dev, Academics, Career & Lifestyle</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Authentication</div>
        <div class="text-3xl font-black text-sky-400 mt-2">${isAuth ? "ACTIVE" : "PROTECTED"}</div>
        <div class="text-xs text-slate-400 mt-1">Query ?apikey=, Header x-api-key, or Bearer</div>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-10">
      <h2 class="text-lg font-bold text-white mb-2">Composio & AI Agent Quick Connection</h2>
      <p class="text-sm text-slate-400 mb-4">To add this tool to Composio or any MCP client, configure the endpoint and OpenAPI URL:</p>
      <pre><code>Endpoint: ${origin}/mcp/articles?apikey=YOUR_MCP_API_KEY
OpenAPI Spec: ${origin}/mcp/articles/openapi.json
Protocol: MCP JSON-RPC 2.0 (2024-11-05) &amp; RESTful OpenAPI</code></pre>
    </div>

    <div class="border-t border-slate-800 pt-8">
      <h2 class="text-xl font-bold text-white mb-6">Complete MCP Tools Catalog (${MCP_ARTICLE_TOOLS.length} Operations)</h2>
      <div class="space-y-4">
        ${MCP_ARTICLE_TOOLS.map(
          (t) => `
          <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <span class="font-mono text-sm font-bold text-indigo-300">${t.name}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">Tool</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">${t.description}</p>
          </div>`
        ).join("")}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const isAuth = verifyApiKey(req);
  const accept = req.headers.get("accept") || "";
  const url = new URL(req.url);

  // 1. SSE Streaming Transport for Model Context Protocol
  if (accept.includes("text/event-stream")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: open\ndata: {"status":"connected","mcpVersion":"2024-11-05"}\n\n`));
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`event: ping\ndata: {"timestamp":${Date.now()}}\n\n`));
          } catch {
            clearInterval(keepAlive);
          }
        }, 15000);
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // 2. Interactive Browser HTML Documentation
  const isBrowserVisit = accept.includes("text/html") && !url.searchParams.has("json") && !url.searchParams.has("q") && !url.searchParams.has("id");
  if (isBrowserVisit) {
    return new Response(renderDocumentationHtml(url.origin, isAuth), {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  // 3. JSON REST Query Handler
  const db = getDb();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)), 100);
  const offset = (page - 1) * limit;

  const statusParam = url.searchParams.get("status") || "PUBLISHED";
  const effectiveStatus = isAuth && statusParam !== "ALL" ? statusParam : isAuth && statusParam === "ALL" ? null : "PUBLISHED";

  const conditions: any[] = [];
  if (effectiveStatus) conditions.push(eq(articles.status, effectiveStatus));

  const catParam = url.searchParams.get("category");
  if (catParam && catParam !== "ALL") {
    const upper = catParam.toUpperCase().replace(/-/g, "_");
    conditions.push(or(eq(articles.category, catParam), eq(articles.category, upper)));
  }

  const tagParam = url.searchParams.get("tag");
  if (tagParam) {
    const clean = tagParam.replace(/^#/, "").trim().toLowerCase();
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(${articles.tags}, '[]'::jsonb)) AS elem
        WHERE LOWER(elem) = ${clean}
      )`
    );
  }

  const query = url.searchParams.get("q") || url.searchParams.get("query");
  if (query?.trim()) {
    const pattern = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(articles.title, pattern),
        ilike(articles.subtitle, pattern),
        ilike(articles.excerpt, pattern),
        ilike(articles.content, pattern)
      )
    );
  }

  const list = await db.query.articles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
    limit,
    offset,
    with: {
      author: true,
      institution: true,
      links: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      authenticated: isAuth,
      page,
      limit,
      total: list.length,
      articles: list.map(formatArticle),
      tools: MCP_ARTICLE_TOOLS,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: Request) {
  const isAuth = verifyApiKey(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400, headers: CORS_HEADERS });
  }

  // Model Context Protocol (JSON-RPC 2.0) Dispatch
  if (body && typeof body === "object" && body.jsonrpc === "2.0") {
    return handleJsonRpcRequest(req, body, isAuth);
  }

  // Direct REST POST: Create Article
  if (!isAuth) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or invalid MCP API key (provide via ?apikey=, x-api-key header, or Bearer token)" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    const db = getDb();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400, headers: CORS_HEADERS });
    }

    const resolved = await resolveAuthorAndInstitution(db, body.authorId, body.institutionId);
    if (!resolved.authorId) {
      return NextResponse.json({ error: "No valid author profile found" }, { status: 500, headers: CORS_HEADERS });
    }

    const slug = (slugify(body.slug || title).slice(0, 80) || "article") + "-" + nanoid(6).toLowerCase();
    const readingTime = calculateReadingTime(content);
    const excerpt = body.excerpt?.trim() || createExcerpt(content);
    const category = body.category ? String(body.category).toUpperCase().replace(/-/g, "_") : "GENERAL";
    const status = body.status === "DRAFT" || body.status === "ARCHIVED" ? body.status : "PUBLISHED";
    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    const [created] = await db
      .insert(articles)
      .values({
        id: "art_" + nanoid(12),
        slug,
        title,
        subtitle: body.subtitle?.trim() || null,
        excerpt,
        content,
        coverImageUrl: body.coverImageUrl?.trim() || null,
        category,
        tags: Array.isArray(body.tags) ? body.tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean) : [],
        readingTimeMinutes: readingTime,
        authorId: resolved.authorId,
        institutionId: resolved.institutionId,
        isFeatured: Boolean(body.isFeatured),
        isDemo: Boolean(body.isDemo),
        status,
        publishedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Attach links if provided
    if (Array.isArray(body.links)) {
      for (let i = 0; i < body.links.length; i++) {
        const l = body.links[i];
        if (l && l.url && l.label) {
          await db.insert(articleLinks).values({
            id: "link_" + nanoid(10),
            articleId: created.id,
            url: String(l.url).trim(),
            label: String(l.label).trim(),
            description: l.description ? String(l.description).trim() : null,
            type: l.type || "REFERENCE",
            displayOrder: i + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    const full = await db.query.articles.findFirst({
      where: eq(articles.id, created.id),
      with: { author: true, institution: true, links: true },
    });

    return NextResponse.json({ success: true, article: formatArticle(full || created) }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create article" }, { status: 500, headers: CORS_HEADERS });
  }
}

async function handleJsonRpcRequest(req: Request, body: any, isAuth: boolean) {
  const { id, method, params } = body;
  const db = getDb();

  // 1. Protocol Handshake: initialize
  if (method === "initialize") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "campusloop-articles-mcp",
            version: "1.0.0",
          },
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
        },
      },
      { headers: CORS_HEADERS }
    );
  }

  // 2. Notification ACK: notifications/initialized
  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  }

  // 3. Ping
  if (method === "ping") {
    return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: CORS_HEADERS });
  }

  // 4. Tools List
  if (method === "tools/list") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_ARTICLE_TOOLS,
        },
      },
      { headers: CORS_HEADERS }
    );
  }

  // 5. Tools Call Execution
  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};

    try {
      // READ-ONLY TOOLS (Accessible without super-authorization)
      if (toolName === "list_articles") {
        const page = Math.max(1, Number(args.page || 1));
        const limit = Math.min(Math.max(1, Number(args.limit || 20)), 100);
        const offset = (page - 1) * limit;

        const conditions: any[] = [];
        if (!isAuth || args.status === "PUBLISHED" || !args.status) {
          conditions.push(eq(articles.status, "PUBLISHED"));
        } else if (args.status && args.status !== "ALL") {
          conditions.push(eq(articles.status, args.status));
        }

        if (args.category && args.category !== "ALL") {
          const catKey = String(args.category).toUpperCase().replace(/-/g, "_");
          conditions.push(or(eq(articles.category, args.category), eq(articles.category, catKey)));
        }

        if (args.tag) {
          const clean = String(args.tag).replace(/^#/, "").trim().toLowerCase();
          conditions.push(sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(${articles.tags}, '[]'::jsonb)) AS elem WHERE LOWER(elem) = ${clean})`);
        }

        if (args.authorId) {
          conditions.push(or(eq(articles.authorId, args.authorId), sql`${articles.authorId} IN (SELECT id FROM user_profiles WHERE username = ${args.authorId})`));
        }

        if (args.query?.trim()) {
          const pat = `%${args.query.trim()}%`;
          conditions.push(or(ilike(articles.title, pat), ilike(articles.subtitle, pat), ilike(articles.excerpt, pat), ilike(articles.content, pat)));
        }

        const items = await db.query.articles.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
          limit,
          offset,
          with: { author: true, institution: true, links: true },
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify({ page, limit, total: items.length, articles: items.map(formatArticle) }, null, 2) }],
          },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_article") {
        const target = String(args.idOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
          with: { author: true, institution: true, links: true, comments: true },
        });

        if (!art) throw new Error(`Article not found: ${target}`);
        if (art.status !== "PUBLISHED" && !isAuth) throw new Error("Article is not published");

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(formatArticle(art), null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "search_articles") {
        const query = String(args.query || "").trim();
        const pat = `%${query}%`;
        const conditions: any[] = [eq(articles.status, "PUBLISHED")];
        conditions.push(or(ilike(articles.title, pat), ilike(articles.subtitle, pat), ilike(articles.excerpt, pat), ilike(articles.content, pat)));

        if (args.category && args.category !== "ALL") {
          const catKey = String(args.category).toUpperCase().replace(/-/g, "_");
          conditions.push(or(eq(articles.category, args.category), eq(articles.category, catKey)));
        }

        const results = await db.query.articles.findMany({
          where: and(...conditions),
          orderBy: [desc(articles.viewsCount), desc(articles.publishedAt)],
          limit: Math.min(Number(args.limit || 20), 50),
          with: { author: true, links: true },
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ query, count: results.length, results: results.map(formatArticle) }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "list_categories") {
        const group = args.group && args.group !== "ALL" ? args.group : null;
        const cats = await db.query.articleCategories.findMany({
          where: group ? eq(articleCategories.group, group) : undefined,
          orderBy: [articleCategories.sortOrder],
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ count: cats.length, categories: cats }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_category") {
        const target = String(args.slugOrId || "").trim();
        const cat = await db.query.articleCategories.findFirst({
          where: or(eq(articleCategories.slug, target), eq(articleCategories.id, target)),
        });
        if (!cat) throw new Error(`Category not found: ${target}`);

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(cat, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "list_tags") {
        const tags = await db.query.articleTags.findMany({
          limit: Math.min(Number(args.limit || 50), 100),
        });
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ count: tags.length, tags }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "list_article_links") {
        const target = String(args.articleIdOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
          columns: { id: true },
        });
        if (!art) throw new Error(`Article not found: ${target}`);

        const links = await db.query.articleLinks.findMany({
          where: eq(articleLinks.articleId, art.id),
          orderBy: [articleLinks.displayOrder],
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ articleId: art.id, links }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "list_comments" || toolName === "get_article_discussion") {
        const target = String(args.articleIdOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
          with: { author: true },
        });
        if (!art) throw new Error(`Article not found: ${target}`);

        const comments = await db.query.articleComments.findMany({
          where: eq(articleComments.articleId, art.id),
          orderBy: [desc(articleComments.createdAt)],
          with: { author: true },
          limit: Math.min(Number(args.limit || 50), 100),
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ article: formatArticle(art), commentsCount: comments.length, comments }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_comment") {
        const commentId = String(args.commentId || "").trim();
        const comment = await db.query.articleComments.findFirst({
          where: eq(articleComments.id, commentId),
          with: { author: true },
        });
        if (!comment) throw new Error(`Comment not found: ${commentId}`);

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_article_like_count") {
        const target = String(args.articleIdOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
          columns: { id: true, upvotesCount: true, downvotesCount: true },
        });
        if (!art) throw new Error(`Article not found: ${target}`);

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ articleId: art.id, upvotes: art.upvotesCount, downvotes: art.downvotesCount, score: art.upvotesCount - art.downvotesCount }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "list_authors" || toolName === "list_demo_accounts") {
        const demoOnly = toolName === "list_demo_accounts" || args.demoOnly === true;
        const authors = await db.query.userProfiles.findMany({
          where: demoOnly
            ? and(
                or(ilike(userProfiles.username, "loop_%"), ilike(userProfiles.username, "demo_%")),
                eq(userProfiles.isSeeded, true)
              )
            : undefined,
          limit: Math.min(Number(args.limit || 30), 50),
          columns: { id: true, username: true, displayName: true, headline: true, bio: true, branch: true, year: true, avatarUrl: true, isSeeded: true },
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ count: authors.length, authors }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_author" || toolName === "get_demo_account") {
        const target = String(args.idOrUsername || args.username || "").trim();
        const author = await db.query.userProfiles.findFirst({
          where: or(eq(userProfiles.id, target), eq(userProfiles.username, target)),
          with: { institution: true, articles: { limit: 10, orderBy: [desc(articles.publishedAt)] } },
        });
        if (!author) throw new Error(`Author not found: ${target}`);

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(author, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_articles_metadata") {
        const all = await db.query.articles.findMany({
          columns: { id: true, category: true, status: true, viewsCount: true, upvotesCount: true, isDemo: true },
        });

        const categoryBreakdown: Record<string, number> = {};
        let totalViews = 0;
        let totalUpvotes = 0;
        let publishedCount = 0;
        let draftCount = 0;

        for (const a of all) {
          categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
          totalViews += a.viewsCount || 0;
          totalUpvotes += a.upvotesCount || 0;
          if (a.status === "PUBLISHED") publishedCount++;
          else if (a.status === "DRAFT") draftCount++;
        }

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{
              type: "text",
              text: JSON.stringify({
                totalArticles: all.length,
                publishedArticles: publishedCount,
                draftArticles: draftCount,
                totalReadsAndViews: totalViews,
                totalUpvotes,
                categoryBreakdown,
              }, null, 2),
            }],
          },
        }, { headers: CORS_HEADERS });
      }

      // MUTATION TOOLS (Require valid MCP authorization key)
      if (!isAuth) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32001, message: "Unauthorized: MCP mutation tools require valid apikey" },
          },
          { status: 401, headers: CORS_HEADERS }
        );
      }

      if (toolName === "create_article") {
        const title = String(args.title || "").trim();
        const content = String(args.content || "").trim();
        if (!title || !content) throw new Error("title and content are required");

        const resolved = await resolveAuthorAndInstitution(db, args.authorId, args.institutionId);
        if (!resolved.authorId) throw new Error("No valid author profile is configured");

        const slug = (slugify(args.slug || title).slice(0, 80) || "article") + "-" + nanoid(6).toLowerCase();
        const readingTime = calculateReadingTime(content);
        const excerpt = args.excerpt?.trim() || createExcerpt(content);
        const category = args.category ? String(args.category).toUpperCase().replace(/-/g, "_") : "GENERAL";
        const status = args.status === "DRAFT" || args.status === "ARCHIVED" ? args.status : "PUBLISHED";
        const publishedAt = status === "PUBLISHED" ? new Date() : null;

        const [created] = await db
          .insert(articles)
          .values({
            id: "art_" + nanoid(12),
            slug,
            title,
            subtitle: args.subtitle?.trim() || null,
            excerpt,
            content,
            coverImageUrl: args.coverImageUrl?.trim() || null,
            category,
            tags: Array.isArray(args.tags) ? args.tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean) : [],
            readingTimeMinutes: readingTime,
            authorId: resolved.authorId,
            institutionId: resolved.institutionId,
            isFeatured: Boolean(args.isFeatured),
            isDemo: Boolean(args.isDemo),
            status,
            publishedAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Attach links
        if (Array.isArray(args.links)) {
          for (let i = 0; i < args.links.length; i++) {
            const l = args.links[i];
            if (l?.url && l?.label) {
              await db.insert(articleLinks).values({
                id: "link_" + nanoid(10),
                articleId: created.id,
                url: String(l.url).trim(),
                label: String(l.label).trim(),
                description: l.description ? String(l.description).trim() : null,
                type: l.type || "REFERENCE",
                displayOrder: i + 1,
              });
            }
          }
        }

        const full = await db.query.articles.findFirst({
          where: eq(articles.id, created.id),
          with: { author: true, institution: true, links: true },
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, article: formatArticle(full || created) }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "update_article") {
        const target = String(args.idOrSlug || "").trim();
        const existing = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!existing) throw new Error(`Article not found: ${target}`);

        const updates: Record<string, any> = { updatedAt: new Date() };
        if (typeof args.title === "string") updates.title = args.title.trim();
        if (typeof args.subtitle === "string") updates.subtitle = args.subtitle.trim() || null;
        if (typeof args.excerpt === "string") updates.excerpt = args.excerpt.trim();
        if (typeof args.content === "string") {
          updates.content = args.content.trim();
          updates.readingTimeMinutes = calculateReadingTime(args.content);
        }
        if (typeof args.category === "string") updates.category = args.category.toUpperCase().replace(/-/g, "_");
        if (Array.isArray(args.tags)) updates.tags = args.tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean);
        if (typeof args.coverImageUrl === "string") updates.coverImageUrl = args.coverImageUrl.trim() || null;
        if (typeof args.status === "string") {
          updates.status = args.status;
          if (args.status === "PUBLISHED" && !existing.publishedAt) updates.publishedAt = new Date();
        }
        if (typeof args.isFeatured === "boolean") updates.isFeatured = args.isFeatured;

        const [updated] = await db.update(articles).set(updates).where(eq(articles.id, existing.id)).returning();
        const full = await db.query.articles.findFirst({
          where: eq(articles.id, updated.id),
          with: { author: true, links: true },
        });

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, article: formatArticle(full || updated) }, null, 2) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "delete_article") {
        const target = String(args.idOrSlug || "").trim();
        const existing = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!existing) throw new Error(`Article not found: ${target}`);

        if (args.hard === true) {
          await db.delete(articles).where(eq(articles.id, existing.id));
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success: true, deleted: true, permanent: true, id: existing.id }) }] },
          }, { headers: CORS_HEADERS });
        } else {
          await db.update(articles).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(articles.id, existing.id));
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success: true, archived: true, id: existing.id }) }] },
          }, { headers: CORS_HEADERS });
        }
      }

      if (toolName === "publish_article" || toolName === "restore_article") {
        const target = String(args.idOrSlug || "").trim();
        const existing = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!existing) throw new Error(`Article not found: ${target}`);

        const [updated] = await db
          .update(articles)
          .set({ status: "PUBLISHED", publishedAt: existing.publishedAt || new Date(), updatedAt: new Date() })
          .where(eq(articles.id, existing.id))
          .returning();

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, status: "PUBLISHED", article: formatArticle(updated) }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "unpublish_article") {
        const target = String(args.idOrSlug || "").trim();
        const existing = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!existing) throw new Error(`Article not found: ${target}`);

        const [updated] = await db
          .update(articles)
          .set({ status: "DRAFT", updatedAt: new Date() })
          .where(eq(articles.id, existing.id))
          .returning();

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, status: "DRAFT", article: formatArticle(updated) }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "archive_article") {
        const target = String(args.idOrSlug || "").trim();
        const existing = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!existing) throw new Error(`Article not found: ${target}`);

        const [updated] = await db
          .update(articles)
          .set({ status: "ARCHIVED", updatedAt: new Date() })
          .where(eq(articles.id, existing.id))
          .returning();

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, status: "ARCHIVED", article: formatArticle(updated) }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "add_article_link") {
        const target = String(args.articleIdOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
          columns: { id: true },
        });
        if (!art) throw new Error(`Article not found: ${target}`);

        const url = String(args.url || "").trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) throw new Error("Invalid URL protocol (HTTPS required)");

        const [link] = await db.insert(articleLinks).values({
          id: "link_" + nanoid(10),
          articleId: art.id,
          url,
          label: String(args.label || "Link").trim(),
          description: args.description ? String(args.description).trim() : null,
          type: args.type || "REFERENCE",
          displayOrder: Number(args.displayOrder || 0),
        }).returning();

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, link }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "delete_article_link") {
        const linkId = String(args.linkId || "").trim();
        await db.delete(articleLinks).where(eq(articleLinks.id, linkId));
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, deleted: true, linkId }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "create_comment" || toolName === "reply_to_comment") {
        const target = String(args.articleIdOrSlug || "").trim();
        const bodyText = String(args.body || "").trim();
        if (!bodyText) throw new Error("Comment body is required");

        let articleId: string;
        let parentId: string | null = null;

        if (toolName === "reply_to_comment") {
          const commentId = String(args.commentId || "").trim();
          const parent = await db.query.articleComments.findFirst({ where: eq(articleComments.id, commentId) });
          if (!parent) throw new Error(`Parent comment not found: ${commentId}`);
          articleId = parent.articleId;
          parentId = parent.id;
        } else {
          const art = await db.query.articles.findFirst({
            where: or(eq(articles.id, target), eq(articles.slug, target)),
            columns: { id: true },
          });
          if (!art) throw new Error(`Article not found: ${target}`);
          articleId = art.id;
          parentId = args.parentId || null;
        }

        const resolved = await resolveAuthorAndInstitution(db, args.authorId);
        const [comment] = await db.insert(articleComments).values({
          id: "comm_" + nanoid(12),
          articleId,
          authorId: resolved.authorId!,
          parentId,
          body: bodyText,
        }).returning();

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, comment }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "delete_comment") {
        const commentId = String(args.commentId || "").trim();
        await db.delete(articleComments).where(eq(articleComments.id, commentId));
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, deleted: true, commentId }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "like_article") {
        const target = String(args.articleIdOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!art) throw new Error(`Article not found: ${target}`);

        const resolved = await resolveAuthorAndInstitution(db, args.authorId);
        const val = args.value === -1 ? -1 : 1;

        // Idempotent upsert
        const existingVote = await db.query.articleVotes.findFirst({
          where: and(eq(articleVotes.articleId, art.id), eq(articleVotes.profileId, resolved.authorId!)),
        });

        if (!existingVote) {
          await db.insert(articleVotes).values({
            id: "vote_" + nanoid(10),
            articleId: art.id,
            profileId: resolved.authorId!,
            value: val,
          });
          const nextUp = val > 0 ? art.upvotesCount + 1 : art.upvotesCount;
          const nextDown = val < 0 ? art.downvotesCount + 1 : art.downvotesCount;
          await db.update(articles).set({ upvotesCount: nextUp, downvotesCount: nextDown }).where(eq(articles.id, art.id));
        }

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, liked: true, articleId: art.id, value: val }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "unlike_article") {
        const target = String(args.articleIdOrSlug || "").trim();
        const art = await db.query.articles.findFirst({
          where: or(eq(articles.id, target), eq(articles.slug, target)),
        });
        if (!art) throw new Error(`Article not found: ${target}`);

        const resolved = await resolveAuthorAndInstitution(db, args.authorId);
        const existingVote = await db.query.articleVotes.findFirst({
          where: and(eq(articleVotes.articleId, art.id), eq(articleVotes.profileId, resolved.authorId!)),
        });

        if (existingVote) {
          await db.delete(articleVotes).where(eq(articleVotes.id, existingVote.id));
          const nextUp = existingVote.value > 0 ? Math.max(0, art.upvotesCount - 1) : art.upvotesCount;
          const nextDown = existingVote.value < 0 ? Math.max(0, art.downvotesCount - 1) : art.downvotesCount;
          await db.update(articles).set({ upvotesCount: nextUp, downvotesCount: nextDown }).where(eq(articles.id, art.id));
        }

        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, unliked: true, articleId: art.id }) }] },
        }, { headers: CORS_HEADERS });
      }

      if (toolName === "update_demo_account") {
        const username = String(args.username || "").trim();
        const existing = await db.query.userProfiles.findFirst({ where: eq(userProfiles.username, username) });
        if (!existing) throw new Error(`Demo account not found: ${username}`);

        const updates: Record<string, any> = { updatedAt: new Date() };
        if (typeof args.displayName === "string") updates.displayName = args.displayName.trim();
        if (typeof args.headline === "string") updates.headline = args.headline.trim();
        if (typeof args.bio === "string") updates.bio = args.bio.trim();
        if (Array.isArray(args.interests)) updates.interests = args.interests;

        const [updated] = await db.update(userProfiles).set(updates).where(eq(userProfiles.id, existing.id)).returning();
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify({ success: true, profile: updated }) }] },
        }, { headers: CORS_HEADERS });
      }

      throw new Error(`Tool not found or unsupported: ${toolName}`);
    } catch (toolErr: any) {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: toolErr.message || "Internal tool execution error" },
      }, { headers: CORS_HEADERS });
    }
  }

  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } },
    { status: 404, headers: CORS_HEADERS }
  );
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function PATCH(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  const isAuth = verifyApiKey(req);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const idOrSlug = url.searchParams.get("id") || url.searchParams.get("slug");
  if (!idOrSlug) {
    return NextResponse.json({ error: "Missing id or slug query parameter" }, { status: 400, headers: CORS_HEADERS });
  }

  const db = getDb();
  const existing = await db.query.articles.findFirst({
    where: or(eq(articles.id, idOrSlug), eq(articles.slug, idOrSlug)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404, headers: CORS_HEADERS });
  }

  await db.delete(articles).where(eq(articles.id, existing.id));
  return NextResponse.json({ success: true, deleted: true, id: existing.id }, { headers: CORS_HEADERS });
}
