import { desc } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { getDb } from "@/db";
import { posts } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Composio Admin API route
 * Handles external app integrations:
 * 1. action: "fetch_reddit" - Pulls hot/controversial posts from a college subreddit
 * 2. action: "purge_cloudflare" - Triggers Cloudflare CDN cache purge
 * 3. action: "dispatch_alert" - Sends test moderation alert to Discord/Telegram
 * 4. action: "export_data" - Exports moderation queue or reports as JSON/CSV
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;
    const profile = auth.profile;
    const body = (await req.json()) as any;
    const { action, payload } = body;

    const db = getDb();

    switch (action) {
      case "fetch_reddit": {
        const subreddit = (payload?.subreddit || "Btechtards").replace(/^r\//, "").trim();
        const sort = payload?.sort || "hot";
        const limit = Math.min(Math.max(Number(payload?.limit) || 10, 1), 25);

        // Fetch public subreddit JSON from Reddit API
        const redditUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/${encodeURIComponent(sort)}.json?limit=${limit}`;
        const redditRes = await fetch(redditUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) CampusLoop/2.0",
          },
        });

        if (!redditRes.ok) {
          return NextResponse.json(
            { error: `Failed to fetch from r/${subreddit}: HTTP ${redditRes.status}` },
            { status: 502 }
          );
        }

        const data = (await redditRes.json()) as any;
        const children = data?.data?.children || [];

        const items = children.map((c: any) => {
          const p = c.data;
          return {
            id: p.id,
            title: p.title,
            author: p.author,
            subreddit: p.subreddit,
            score: p.score,
            numComments: p.num_comments,
            url: p.url,
            permalink: `https://reddit.com${p.permalink}`,
            createdUtc: p.created_utc,
            selftext: p.selftext ? p.selftext.slice(0, 500) : "",
            thumbnail: p.thumbnail && p.thumbnail.startsWith("http") ? p.thumbnail : null,
            over18: p.over_18,
          };
        });

        return NextResponse.json({
          success: true,
          subreddit,
          sort,
          count: items.length,
          posts: items,
          integration: {
            provider: "reddit",
            status: "ACTIVE",
          },
        });
      }

      case "import_reddit_post": {
        const { redditPost, institutionId } = payload || {};
        if (!redditPost?.title) {
          return NextResponse.json({ error: "Missing reddit post data" }, { status: 400 });
        }

        // Pick or verify institution
        let targetInstId = institutionId;
        if (!targetInstId) {
          const fallback = await db.query.institutions.findFirst();
          targetInstId = fallback?.id;
        }

        // Insert as curated campus post
        const postBody = redditPost.selftext
          ? `**${redditPost.title}**\n\n${redditPost.selftext}\n\n[Original on r/${redditPost.subreddit}](${redditPost.permalink})`
          : `**${redditPost.title}**\n\n[Discussion link](${redditPost.permalink})`;

        const [created] = await db
          .insert(posts)
          .values({
            authorId: profile.id,
            institutionId: targetInstId,
            body: postBody,
            type: "NORMAL",
            isAnonymous: false,
            status: "PUBLISHED",
          })
          .returning();

        return NextResponse.json({
          success: true,
          postId: created.id,
          message: `Imported Reddit post to CampusLoop`,
        });
      }

      case "purge_cloudflare": {
        const zoneName = payload?.zoneName || "campusloop.space";
        const purgeEverything = payload?.purgeEverything ?? true;
        const cfToken = process.env.CLOUDFLARE_API_TOKEN;
        const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

        // Eliminate fake-success: if real Cloudflare integration is not configured, return HTTP 501
        if (!cfToken || !cfZoneId) {
          return NextResponse.json(
            {
              error:
                "Cloudflare integration is not configured. Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID in environment.",
            },
            { status: 501 }
          );
        }

        try {
          const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${cfToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                purgeEverything ? { purge_everything: true } : { hosts: [zoneName] }
              ),
            }
          );

          if (!cfRes.ok) {
            const errData = (await cfRes.json().catch(() => ({}))) as any;
            return NextResponse.json(
              {
                error: `Cloudflare API error: ${errData?.errors?.[0]?.message || cfRes.statusText}`,
              },
              { status: 502 }
            );
          }

          return NextResponse.json({
            success: true,
            action: "purge_cache",
            zone: zoneName,
            purgeEverything,
            executedAt: new Date().toISOString(),
            message: `Cloudflare CDN edge cache successfully purged for ${zoneName}`,
          });
        } catch (err: any) {
          return NextResponse.json(
            { error: `Cloudflare purge request failed: ${err?.message || "Network error"}` },
            { status: 502 }
          );
        }
      }

      case "dispatch_alert": {
        const { channel, message, priority } = payload || {};
        const destination = String(channel || "discord").toLowerCase();

        // Eliminate fake-success: execute real webhook or return non-2xx error
        if (destination === "discord") {
          const discordUrl =
            process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_MODERATION_WEBHOOK_URL;
          if (!discordUrl) {
            return NextResponse.json(
              {
                error:
                  "Discord webhook integration is not configured. Missing DISCORD_WEBHOOK_URL in environment.",
              },
              { status: 501 }
            );
          }

          try {
            const hookRes = await fetch(discordUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: `[CampusLoop Alert - ${priority || "HIGH"}] ${message || "Moderation alert"}`,
              }),
            });

            if (!hookRes.ok) {
              return NextResponse.json(
                { error: `Discord webhook returned HTTP ${hookRes.status}` },
                { status: 502 }
              );
            }

            return NextResponse.json({
              success: true,
              channel: "discord",
              priority: priority || "HIGH",
              deliveredAt: new Date().toISOString(),
              status: "SENT",
              message: `Moderation alert dispatched to DISCORD: "${message || "CampusLoop test alert"}"`,
            });
          } catch (err: any) {
            return NextResponse.json(
              { error: `Discord alert dispatch failed: ${err?.message || "Network error"}` },
              { status: 502 }
            );
          }
        } else if (destination === "telegram") {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_CHAT_ID;
          if (!botToken || !chatId) {
            return NextResponse.json(
              {
                error:
                  "Telegram integration is not configured. Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment.",
              },
              { status: 501 }
            );
          }

          try {
            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `[CampusLoop Alert - ${priority || "HIGH"}]\n${message || "Moderation alert"}`,
              }),
            });

            if (!tgRes.ok) {
              return NextResponse.json(
                { error: `Telegram bot API returned HTTP ${tgRes.status}` },
                { status: 502 }
              );
            }

            return NextResponse.json({
              success: true,
              channel: "telegram",
              priority: priority || "HIGH",
              deliveredAt: new Date().toISOString(),
              status: "SENT",
              message: `Moderation alert dispatched to TELEGRAM: "${message || "CampusLoop test alert"}"`,
            });
          } catch (err: any) {
            return NextResponse.json(
              { error: `Telegram alert dispatch failed: ${err?.message || "Network error"}` },
              { status: 502 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `Unsupported alert destination '${destination}'. Supported: discord, telegram` },
            { status: 400 }
          );
        }
      }

      case "export_data": {
        const { exportType } = payload || {}; // 'posts' | 'users' | 'colleges'
        let exportData: any[] = [];

        if (exportType === "users") {
          exportData = await db.query.userProfiles.findMany({
            columns: {
              username: true,
              displayName: true,
              email: true,
              role: true,
              status: true,
              points: true,
              createdAt: true,
            },
            limit: 100,
          });
        } else if (exportType === "colleges") {
          exportData = await db.query.institutions.findMany({
            columns: {
              id: true,
              name: true,
              state: true,
              district: true,
              slug: true,
              nirfRank: true,
            },
            limit: 100,
          });
        } else {
          // Default: posts
          const rawPosts = await db
            .select({
              id: posts.id,
              authorId: posts.authorId,
              body: posts.body,
              type: posts.type,
              status: posts.status,
              isAnonymous: posts.isAnonymous,
              createdAt: posts.createdAt,
            })
            .from(posts)
            .orderBy(desc(posts.createdAt))
            .limit(100);

          exportData = rawPosts.map((p) => ({
            ...p,
            authorId: p.isAnonymous ? null : p.authorId,
          }));
        }

        return NextResponse.json({
          success: true,
          exportType: exportType || "posts",
          count: exportData.length,
          data: exportData,
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[Composio Admin API error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
