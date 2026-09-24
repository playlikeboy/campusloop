import { and, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  academicResources,
  comments,
  communityMembers,
  gamingLobbies,
  housingListings,
  lostAndFoundItems,
  marketplaceItems,
  pollOptions,
  pollVotes,
  posts,
  ridesharePools,
  userProfiles,
  votes,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 20;

type FeedItem = {
  itemType: string;
  createdAt: Date;
  id: string;
  data: any;
};

export async function GET(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profileRows = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    const profileId = profileRows[0]?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all";
    const communityId = searchParams.get("communityId");
    const cursor = searchParams.get("cursor");
    const kind = searchParams.get("kind");
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(5, Number.parseInt(searchParams.get("limit") || "12", 10))
    );
    const cursorDate = cursor ? new Date(cursor) : undefined;

    if (cursorDate && Number.isNaN(cursorDate.getTime())) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    const postConditions = [
      isNotNull(posts.communityId),
      eq(posts.status, "PUBLISHED"),
    ];

    if (communityId) {
      postConditions.push(eq(posts.communityId, communityId));
    }

    if (cursorDate) {
      postConditions.push(lt(posts.createdAt, cursorDate));
    }

    if (kind === "qna") {
      postConditions.push(inArray(posts.type, ["POLL", "QUESTION"]));
    }

    if (tab === "joined") {
      const memberships = await db
        .select({ communityId: communityMembers.communityId })
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.userId, profileId),
            eq(communityMembers.status, "ACTIVE")
          )
        )
        .limit(250);

      const joinedIds = memberships.map((row) => row.communityId);
      if (joinedIds.length === 0) {
        return NextResponse.json({ items: [], nextCursor: null, hasMore: false });
      }

      postConditions.push(inArray(posts.communityId, joinedIds));
    }

    const shouldLoadPosts =
      tab === "all" ||
      tab === "discussions" ||
      tab === "joined" ||
      Boolean(communityId);

    async function loadPosts(): Promise<FeedItem[]> {
      if (!shouldLoadPosts) return [];

      const rows = await db.query.posts.findMany({
        where: and(...postConditions),
        orderBy: [desc(posts.createdAt)],
        limit: limit + 1,
        with: {
          author: true,
          institution: true,
          community: true,
          pollOptions: {
            columns: {
              id: true,
              postId: true,
              text: true,
              createdAt: true,
            },
          },
        },
      });

      if (rows.length === 0) return [];

      const postIds = rows.map((post) => post.id);
      const pollPostIds = rows
        .filter((post) => post.type === "POLL")
        .map((post) => post.id);

      const [voteScores, userVotes, commentCounts, pollCounts, userPollVotes] = await Promise.all([
        db
          .select({
            postId: votes.postId,
            score: sql<number>`coalesce(sum(${votes.value}), 0)`,
          })
          .from(votes)
          .where(inArray(votes.postId, postIds))
          .groupBy(votes.postId),
        db
          .select({
            postId: votes.postId,
            value: votes.value,
          })
          .from(votes)
          .where(and(eq(votes.userId, profileId), inArray(votes.postId, postIds))),
        db
          .select({
            postId: comments.postId,
            count: sql<number>`count(${comments.id})`,
          })
          .from(comments)
          .where(
            and(
              inArray(comments.postId, postIds),
              eq(comments.status, "PUBLISHED")
            )
          )
          .groupBy(comments.postId),
        pollPostIds.length
          ? db
              .select({
                optionId: pollOptions.id,
                postId: pollOptions.postId,
                text: pollOptions.text,
                votesCount: sql<number>`count(${pollVotes.id})`,
              })
              .from(pollOptions)
              .leftJoin(pollVotes, eq(pollVotes.optionId, pollOptions.id))
              .where(inArray(pollOptions.postId, pollPostIds))
              .groupBy(pollOptions.id, pollOptions.postId, pollOptions.text)
          : Promise.resolve([]),
        pollPostIds.length
          ? db
              .select({
                postId: pollVotes.postId,
                optionId: pollVotes.optionId,
              })
              .from(pollVotes)
              .where(
                and(
                  eq(pollVotes.userId, profileId),
                  inArray(pollVotes.postId, pollPostIds)
                )
              )
          : Promise.resolve([]),
      ]);

      const voteScoreMap = new Map(
        voteScores.map((row) => [row.postId, Number(row.score || 0)])
      );
      const userVoteMap = new Map(
        userVotes.map((row) => [row.postId, Number(row.value || 0)])
      );
      const commentMap = new Map(
        commentCounts.map((row) => [row.postId, Number(row.count || 0)])
      );
      const userPollMap = new Map(
        userPollVotes.map((row) => [row.postId, row.optionId])
      );

      const pollMap = new Map<
        string,
        Array<{ id: string; text: string; votesCount: number; userVoted: boolean }>
      >();

      for (const option of pollCounts) {
        const list = pollMap.get(option.postId) || [];
        list.push({
          id: option.optionId,
          text: option.text,
          votesCount: Number(option.votesCount || 0),
          userVoted: userPollMap.get(option.postId) === option.optionId,
        });
        pollMap.set(option.postId, list);
      }

      return rows.map((post) => {
        const options = pollMap.get(post.id) || [];
        return {
          itemType: "POST",
          createdAt: post.createdAt,
          id: "post_" + post.id,
          data: {
            ...post,
            votesCount: voteScoreMap.get(post.id) || 0,
            commentsCount: commentMap.get(post.id) || 0,
            userVote: userVoteMap.get(post.id) || 0,
            pollOptions: options,
            hasVotedPoll: Boolean(userPollMap.has(post.id)),
            totalPollVotes: options.reduce(
              (sum, option) => sum + option.votesCount,
              0
            ),
          },
        };
      });
    }

    async function loadUtilityFeeds(): Promise<FeedItem[]> {
      const tasks: Array<Promise<FeedItem[]>> = [];

      if (tab === "all" || tab === "lost_found") {
        tasks.push(
          db.query.lostAndFoundItems
            .findMany({
              where: cursorDate ? lt(lostAndFoundItems.createdAt, cursorDate) : undefined,
              orderBy: [desc(lostAndFoundItems.createdAt)],
              limit: limit + 1,
              with: {
                author: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    points: true,
                  },
                },
                institution: {
                  columns: { id: true, name: true, slug: true },
                },
              },
            })
            .then((items) =>
              items.map((item) => ({
                itemType: "LOST_FOUND",
                createdAt: item.createdAt,
                id: "lf_" + item.id,
                data: item,
              }))
            )
        );
      }

      if (
        tab === "all" ||
        tab === "marketplace" ||
        tab === "buy-and-sell" ||
        tab === "buy_and_sell"
      ) {
        tasks.push(
          db.query.marketplaceItems
            .findMany({
              where: cursorDate ? lt(marketplaceItems.createdAt, cursorDate) : undefined,
              orderBy: [desc(marketplaceItems.createdAt)],
              limit: limit + 1,
              with: {
                seller: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    points: true,
                  },
                },
                institution: {
                  columns: { id: true, name: true, slug: true },
                },
              },
            })
            .then((items) =>
              items.map((item) => ({
                itemType: "MARKETPLACE",
                createdAt: item.createdAt,
                id: "mp_" + item.id,
                data: item,
              }))
            )
        );
      }

      if (tab === "all" || tab === "gaming") {
        tasks.push(
          db.query.gamingLobbies
            .findMany({
              where: cursorDate ? lt(gamingLobbies.createdAt, cursorDate) : undefined,
              orderBy: [desc(gamingLobbies.createdAt)],
              limit: limit + 1,
              with: {
                host: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    points: true,
                  },
                },
                institution: {
                  columns: { id: true, name: true, slug: true },
                },
              },
            })
            .then((items) =>
              items.map((item) => ({
                itemType: "GAMING",
                createdAt: item.createdAt,
                id: "gaming_" + item.id,
                data: item,
              }))
            )
        );
      }

      if (tab === "all" || tab === "rideshare") {
        tasks.push(
          db.query.ridesharePools
            .findMany({
              where: cursorDate ? lt(ridesharePools.createdAt, cursorDate) : undefined,
              orderBy: [desc(ridesharePools.createdAt)],
              limit: limit + 1,
              with: {
                creator: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    points: true,
                  },
                },
                institution: {
                  columns: { id: true, name: true, slug: true },
                },
              },
            })
            .then((items) =>
              items.map((item) => ({
                itemType: "RIDESHARE",
                createdAt: item.createdAt,
                id: "ride_" + item.id,
                data: item,
              }))
            )
        );
      }

      if (tab === "all" || tab === "housing") {
        tasks.push(
          db.query.housingListings
            .findMany({
              where: cursorDate ? lt(housingListings.createdAt, cursorDate) : undefined,
              orderBy: [desc(housingListings.createdAt)],
              limit: limit + 1,
              with: {
                author: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    points: true,
                  },
                },
                institution: {
                  columns: { id: true, name: true, slug: true },
                },
              },
            })
            .then((items) =>
              items.map((item) => ({
                itemType: "HOUSING",
                createdAt: item.createdAt,
                id: "housing_" + item.id,
                data: item,
              }))
            )
        );
      }

      if (tab === "all" || tab === "academics") {
        tasks.push(
          db.query.academicResources
            .findMany({
              where: cursorDate ? lt(academicResources.createdAt, cursorDate) : undefined,
              orderBy: [desc(academicResources.createdAt)],
              limit: limit + 1,
              with: {
                uploader: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    points: true,
                  },
                },
                institution: {
                  columns: { id: true, name: true, slug: true },
                },
              },
            })
            .then((items) =>
              items.map((item) => ({
                itemType: "ACADEMICS",
                createdAt: item.createdAt,
                id: "acad_" + item.id,
                data: item,
              }))
            )
        );
      }

      const batches = await Promise.all(tasks);
      return batches.flat();
    }

    const [postItems, utilityItems] = await Promise.all([
      loadPosts(),
      loadUtilityFeeds(),
    ]);

    const feedItems = [...postItems, ...utilityItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const hasMore = feedItems.length > limit;
    const pageItems = feedItems.slice(0, limit);
    const nextCursor =
      pageItems.length > 0
        ? new Date(pageItems[pageItems.length - 1].createdAt).toISOString()
        : null;

    return NextResponse.json({
      items: pageItems,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/communities/feed error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
