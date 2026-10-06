import { desc, eq, ilike } from "drizzle-orm";
import { ExternalLink, Link2, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { institutions, posts } from "@/db/schema";
import { cleanSnippet } from "@/lib/utils";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { EmbedsInspectorClient } from "./embeds-inspector-client";

export const metadata: Metadata = {
  title: "Embeds & Media Inspector",
};

export const dynamic = "force-dynamic";

export default async function AdminEmbedsPage() {
  const { db } = await resolveAdminSession();

  // Query recent posts that contain external links or embeds
  const recentLinkPosts = await db
    .select({
      id: posts.id,
      body: posts.body,
      isAnonymous: posts.isAnonymous,
      pseudonym: posts.pseudonym,
      createdAt: posts.createdAt,
      institutionName: institutions.name,
    })
    .from(posts)
    .leftJoin(institutions, eq(posts.institutionId, institutions.id))
    .where(ilike(posts.body, "%http%"))
    .orderBy(desc(posts.createdAt))
    .limit(8)
    .catch(() => []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Embeds & Link Moderation Hub"
        category="Integrations & Studio"
        icon={Play}
        description="Live URL embed sandbox, verified media players (Spotify, SoundCloud, Apple Music, YouTube), and outbound links safety check."
      />

      {/* Live Sandbox & Whitelist */}
      <EmbedsInspectorClient />

      {/* Recent Posts with External Links */}
      {recentLinkPosts.length > 0 && (
        <section className="p-4 sm:p-5 rounded-xl bg-card/70 border border-border/60 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recent Timeline Posts with External Links
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentLinkPosts.map((post) => (
              <div
                key={post.id}
                className="p-3.5 rounded-xl bg-card border border-border/50 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {post.isAnonymous ? post.pseudonym || "Anonymous Student" : "Verified Student"}
                  </span>
                  <span>{post.institutionName?.split(",")[0] || "Campus Hub"}</span>
                </div>
                <p className="text-xs text-foreground leading-snug line-clamp-2">
                  {cleanSnippet(post.body, 120)}
                </p>
                <div className="flex items-center justify-end pt-1">
                  <Link
                    href={`/post/${post.id}`}
                    target="_blank"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Post</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
