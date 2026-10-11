import { and, count, desc, eq, gte, ilike, isNotNull, lt, lte, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  academicResources,
  gamingLobbies,
  housingListings,
  lostAndFoundItems,
  marketplaceItems,
  posts,
  ridesharePools,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

function getPage(value: string | null) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function textQuery(q: string) {
  return q.trim() ? "%" + q.trim() + "%" : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all";
    const cursor = searchParams.get("cursor");
    const pageValue = searchParams.get("page");
    const limit = Math.min(20, Math.max(5, Number.parseInt(searchParams.get("limit") || "12", 10)));
    const q = textQuery(searchParams.get("q") || "");

    // Numbered pagination is used by dedicated hubs and community discussions.
    // Cursor pagination remains supported for existing consumers of the combined feed.
    if (pageValue !== null && tab !== "all") {
      const page = getPage(pageValue);
      const offset = (page - 1) * limit;

      if (tab === "discussions") {
        const conditions: any[] = [isNotNull(posts.communityId), eq(posts.status, "PUBLISHED"), eq(posts.isSeeded, false)];
        if (q) conditions.push(or(ilike(posts.title, q), ilike(posts.body, q)));
        const where = and(...conditions);
        const [{ value: totalValue }] = await db.select({ value: count(posts.id) }).from(posts).where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.posts.findMany({
          where,
          orderBy: [desc(posts.createdAt)],
          limit,
          offset,
          with: {
            author: true,
            institution: true,
            community: true,
            votes: true,
            comments: true,
            pollOptions: { with: { votes: true } },
          },
        });

        const items = rows.map((post) => {
          const votesCount = (post.votes || []).reduce((sum, vote) => sum + vote.value, 0);
          const commentsCount = (post.comments || []).length;
          const userVote = (post.votes || []).find((vote) => vote.userId === profile.id)?.value || 0;
          const pollOptions = post.pollOptions?.map((option) => ({
            id: option.id,
            text: option.text,
            votesCount: (option.votes || []).length,
            userVoted: (option.votes || []).some((vote) => vote.userId === profile.id),
          }));
          return {
            itemType: "POST",
            createdAt: post.createdAt,
            id: "post_" + post.id,
            data: {
              ...post,
              votesCount,
              commentsCount,
              userVote,
              pollOptions,
              hasVotedPoll: pollOptions?.some((option) => option.userVoted) || false,
              totalPollVotes: pollOptions?.reduce((sum, option) => sum + option.votesCount, 0) || 0,
              votes: undefined,
              comments: undefined,
            },
          };
        });

        return NextResponse.json({
          items,
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }

      if (tab === "lost_found") {
        const conditions: any[] = [];
        if (q) {
          conditions.push(
            or(
              ilike(lostAndFoundItems.title, q),
              ilike(lostAndFoundItems.description, q),
              ilike(lostAndFoundItems.location, q),
              ilike(lostAndFoundItems.category, q)
            )
          );
        }
        const where = conditions.length ? and(...conditions) : undefined;
        const [{ value: totalValue }] = await db
          .select({ value: count(lostAndFoundItems.id) })
          .from(lostAndFoundItems)
          .where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.lostAndFoundItems.findMany({
          where,
          orderBy: [desc(lostAndFoundItems.createdAt)],
          limit,
          offset,
          with: {
            author: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
            institution: { columns: { id: true, name: true, slug: true } },
          },
        });

        return NextResponse.json({
          items: rows.map((item) => ({ itemType: "LOST_FOUND", createdAt: item.createdAt, id: "lf_" + item.id, data: item })),
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }

      if (tab === "marketplace" || tab === "buy-and-sell" || tab === "buy_and_sell") {
        const conditions: any[] = [];
        const category = searchParams.get("category");
        const priceFilter = searchParams.get("price");
        const hideSold = searchParams.get("available") === "1";

        if (q) {
          conditions.push(
            or(
              ilike(marketplaceItems.title, q),
              ilike(marketplaceItems.description, q),
              ilike(marketplaceItems.category, q),
              ilike(marketplaceItems.hostelLocation, q)
            )
          );
        }
        if (category && category !== "all") conditions.push(eq(marketplaceItems.category, category));
        if (hideSold) conditions.push(eq(marketplaceItems.isSold, false));
        if (priceFilter === "under_500") conditions.push(lte(marketplaceItems.price, 499));
        if (priceFilter === "500_2000") conditions.push(and(gte(marketplaceItems.price, 500), lte(marketplaceItems.price, 2000)));
        if (priceFilter === "above_2000") conditions.push(gte(marketplaceItems.price, 2001));
        const where = conditions.length ? and(...conditions) : undefined;
        const [{ value: totalValue }] = await db
          .select({ value: count(marketplaceItems.id) })
          .from(marketplaceItems)
          .where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.marketplaceItems.findMany({
          where,
          orderBy: [desc(marketplaceItems.createdAt)],
          limit,
          offset,
          with: {
            seller: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
            institution: { columns: { id: true, name: true, slug: true } },
          },
        });

        return NextResponse.json({
          items: rows.map((item) => ({ itemType: "MARKETPLACE", createdAt: item.createdAt, id: "mp_" + item.id, data: item })),
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }

      if (tab === "gaming") {
        const conditions: any[] = [];
        if (q) {
          conditions.push(
            or(
              ilike(gamingLobbies.gameName, q),
              ilike(gamingLobbies.title, q),
              ilike(gamingLobbies.description, q),
              ilike(gamingLobbies.mode, q),
              ilike(gamingLobbies.rankTier, q)
            )
          );
        }
        const where = conditions.length ? and(...conditions) : undefined;
        const [{ value: totalValue }] = await db
          .select({ value: count(gamingLobbies.id) })
          .from(gamingLobbies)
          .where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.gamingLobbies.findMany({
          where,
          orderBy: [desc(gamingLobbies.createdAt)],
          limit,
          offset,
          with: {
            host: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
            institution: { columns: { id: true, name: true, slug: true } },
          },
        });

        return NextResponse.json({
          items: rows.map((item) => ({ itemType: "GAMING", createdAt: item.createdAt, id: "gaming_" + item.id, data: item })),
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }

      if (tab === "rideshare") {
        const conditions: any[] = [];
        if (q) {
          conditions.push(
            or(
              ilike(ridesharePools.origin, q),
              ilike(ridesharePools.destination, q),
              ilike(ridesharePools.departureTime, q),
              ilike(ridesharePools.vehicleType, q),
              ilike(ridesharePools.notes, q)
            )
          );
        }
        const where = conditions.length ? and(...conditions) : undefined;
        const [{ value: totalValue }] = await db
          .select({ value: count(ridesharePools.id) })
          .from(ridesharePools)
          .where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.ridesharePools.findMany({
          where,
          orderBy: [desc(ridesharePools.createdAt)],
          limit,
          offset,
          with: {
            creator: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
            institution: { columns: { id: true, name: true, slug: true } },
          },
        });

        return NextResponse.json({
          items: rows.map((item) => ({ itemType: "RIDESHARE", createdAt: item.createdAt, id: "ride_" + item.id, data: item })),
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }

      if (tab === "housing") {
        const conditions: any[] = [];
        if (q) {
          conditions.push(
            or(
              ilike(housingListings.title, q),
              ilike(housingListings.description, q),
              ilike(housingListings.location, q),
              ilike(housingListings.distanceFromCampus, q),
              ilike(housingListings.occupancyType, q),
              ilike(housingListings.genderPreference, q)
            )
          );
        }
        const where = conditions.length ? and(...conditions) : undefined;
        const [{ value: totalValue }] = await db
          .select({ value: count(housingListings.id) })
          .from(housingListings)
          .where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.housingListings.findMany({
          where,
          orderBy: [desc(housingListings.createdAt)],
          limit,
          offset,
          with: {
            author: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
            institution: { columns: { id: true, name: true, slug: true } },
          },
        });

        return NextResponse.json({
          items: rows.map((item) => ({ itemType: "HOUSING", createdAt: item.createdAt, id: "housing_" + item.id, data: item })),
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }

      if (tab === "academics") {
        const conditions: any[] = [];
        if (q) {
          conditions.push(
            or(
              ilike(academicResources.title, q),
              ilike(academicResources.description, q),
              ilike(academicResources.subjectCode, q),
              ilike(academicResources.subjectName, q),
              ilike(academicResources.branch, q),
              ilike(academicResources.resourceType, q),
              ilike(academicResources.moduleOrChapter, q)
            )
          );
        }
        const where = conditions.length ? and(...conditions) : undefined;
        const [{ value: totalValue }] = await db
          .select({ value: count(academicResources.id) })
          .from(academicResources)
          .where(where);
        const total = Number(totalValue || 0);

        const rows = await db.query.academicResources.findMany({
          where,
          orderBy: [desc(academicResources.createdAt)],
          limit,
          offset,
          with: {
            uploader: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
            institution: { columns: { id: true, name: true, slug: true } },
          },
        });

        return NextResponse.json({
          items: rows.map((item) => ({ itemType: "ACADEMICS", createdAt: item.createdAt, id: "acad_" + item.id, data: item })),
          page,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasMore: page * limit < total,
          nextCursor: null,
        });
      }
    }

    const cursorDate = cursor ? new Date(cursor) : undefined;
    const feedItems: any[] = [];

    const formatPost = (post: any) => {
      const votesCount = (post.votes || []).reduce((acc: number, v: any) => acc + v.value, 0);
      const commentsCount = (post.comments || []).length;
      const userVote = (post.votes || []).find((v: any) => v.userId === profile.id)?.value || 0;
      const formattedPollOptions = post.pollOptions?.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        votesCount: (opt.votes || []).length,
        userVoted: (opt.votes || []).some((v: any) => v.userId === profile.id),
      }));
      return {
        itemType: "POST",
        createdAt: post.createdAt,
        id: "post_" + post.id,
        data: {
          ...post,
          votesCount,
          commentsCount,
          userVote,
          pollOptions: formattedPollOptions,
          hasVotedPoll: formattedPollOptions?.some((opt: any) => opt.userVoted) || false,
          totalPollVotes: formattedPollOptions?.reduce((acc: number, opt: any) => acc + opt.votesCount, 0) || 0,
          votes: undefined,
          comments: undefined,
        },
      };
    };

    if (tab === "all" || tab === "discussions") {
      const postConditions = [isNotNull(posts.communityId), eq(posts.status, "PUBLISHED"), eq(posts.isSeeded, false)];
      if (cursorDate) postConditions.push(lt(posts.createdAt, cursorDate));
      const communityPosts = await db.query.posts.findMany({
        where: and(...postConditions),
        orderBy: [desc(posts.createdAt)],
        limit,
        with: {
          author: true,
          institution: true,
          community: true,
          votes: true,
          comments: true,
          pollOptions: { with: { votes: true } },
        },
      });
      feedItems.push(...communityPosts.map(formatPost));
    }

    if (tab === "all" || tab === "lost_found") {
      const conditions: any[] = [];
      if (cursorDate) conditions.push(lt(lostAndFoundItems.createdAt, cursorDate));
      const rows = await db.query.lostAndFoundItems.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(lostAndFoundItems.createdAt)],
        limit,
        with: {
          author: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
          institution: { columns: { id: true, name: true, slug: true } },
        },
      });
      feedItems.push(...rows.map((item) => ({ itemType: "LOST_FOUND", createdAt: item.createdAt, id: "lf_" + item.id, data: item })));
    }

    if (tab === "all" || tab === "marketplace" || tab === "buy-and-sell" || tab === "buy_and_sell") {
      const conditions: any[] = [];
      if (cursorDate) conditions.push(lt(marketplaceItems.createdAt, cursorDate));
      const rows = await db.query.marketplaceItems.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(marketplaceItems.createdAt)],
        limit,
        with: {
          seller: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
          institution: { columns: { id: true, name: true, slug: true } },
        },
      });
      feedItems.push(...rows.map((item) => ({ itemType: "MARKETPLACE", createdAt: item.createdAt, id: "mp_" + item.id, data: item })));
    }

    if (tab === "all" || tab === "gaming") {
      const conditions: any[] = [];
      if (cursorDate) conditions.push(lt(gamingLobbies.createdAt, cursorDate));
      const rows = await db.query.gamingLobbies.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(gamingLobbies.createdAt)],
        limit,
        with: {
          host: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
          institution: { columns: { id: true, name: true, slug: true } },
        },
      });
      feedItems.push(...rows.map((item) => ({ itemType: "GAMING", createdAt: item.createdAt, id: "gaming_" + item.id, data: item })));
    }

    if (tab === "all" || tab === "rideshare") {
      const conditions: any[] = [];
      if (cursorDate) conditions.push(lt(ridesharePools.createdAt, cursorDate));
      const rows = await db.query.ridesharePools.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(ridesharePools.createdAt)],
        limit,
        with: {
          creator: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
          institution: { columns: { id: true, name: true, slug: true } },
        },
      });
      feedItems.push(...rows.map((item) => ({ itemType: "RIDESHARE", createdAt: item.createdAt, id: "ride_" + item.id, data: item })));
    }

    if (tab === "all" || tab === "housing") {
      const conditions: any[] = [];
      if (cursorDate) conditions.push(lt(housingListings.createdAt, cursorDate));
      const rows = await db.query.housingListings.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(housingListings.createdAt)],
        limit,
        with: {
          author: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
          institution: { columns: { id: true, name: true, slug: true } },
        },
      });
      feedItems.push(...rows.map((item) => ({ itemType: "HOUSING", createdAt: item.createdAt, id: "housing_" + item.id, data: item })));
    }

    if (tab === "all" || tab === "academics") {
      const conditions: any[] = [];
      if (cursorDate) conditions.push(lt(academicResources.createdAt, cursorDate));
      const rows = await db.query.academicResources.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(academicResources.createdAt)],
        limit,
        with: {
          uploader: { columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true } },
          institution: { columns: { id: true, name: true, slug: true } },
        },
      });
      feedItems.push(...rows.map((item) => ({ itemType: "ACADEMICS", createdAt: item.createdAt, id: "acad_" + item.id, data: item })));
    }

    feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const pageItems = feedItems.slice(0, limit);
    const hasMore = feedItems.length > limit;
    const nextCursor = pageItems.length > 0 ? new Date(pageItems[pageItems.length - 1].createdAt).toISOString() : null;

    return NextResponse.json({ items: pageItems, nextCursor, hasMore });
  } catch (error) {
    console.error("GET /api/communities/feed error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
