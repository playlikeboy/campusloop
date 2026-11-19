import { and, count, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { comments, follows, posts, streakEvents, votes } from "@/db/schema";
import { STREAK_FREEZE_EVENT } from "@/lib/streaks/streak-freeze";
import { getLocalDateString, getRecentCalendarDays } from "@/lib/streaks/streak-service";

/** A student's last 7 days, every number counted from their own rows. */
export interface WeeklyRecap {
  /** First and last IST day covered, YYYY-MM-DD. */
  from: string;
  to: string;
  activeDays: number;
  posts: number;
  comments: number;
  /** Upvotes other students gave the student's posts. */
  upvotesReceived: number;
  newFollowers: number;
}

export async function getWeeklyRecap(profileId: string, now = new Date()): Promise<WeeklyRecap> {
  const db = getDb();
  const days = getRecentCalendarDays(7, getLocalDateString(now));
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [active, postRows, commentRows, upvoteRows, followerRows] = await Promise.all([
    db
      .select({ n: count() })
      .from(streakEvents)
      .where(
        and(
          eq(streakEvents.userId, profileId),
          inArray(streakEvents.localDate, days),
          ne(streakEvents.eventType, STREAK_FREEZE_EVENT)
        )
      ),
    db
      .select({ n: count() })
      .from(posts)
      .where(and(eq(posts.authorId, profileId), gte(posts.createdAt, since), eq(posts.status, "PUBLISHED"))),
    db
      .select({ n: count() })
      .from(comments)
      .where(and(eq(comments.authorId, profileId), gte(comments.createdAt, since))),
    db
      .select({ n: count() })
      .from(votes)
      .innerJoin(posts, eq(votes.postId, posts.id))
      .where(
        and(
          eq(posts.authorId, profileId),
          ne(votes.userId, profileId),
          sql`${votes.value} > 0`,
          gte(votes.createdAt, since)
        )
      ),
    db
      .select({ n: count() })
      .from(follows)
      .where(and(eq(follows.followingId, profileId), gte(follows.createdAt, since))),
  ]);

  return {
    from: days[0],
    to: days[days.length - 1],
    activeDays: Number(active[0]?.n ?? 0),
    posts: Number(postRows[0]?.n ?? 0),
    comments: Number(commentRows[0]?.n ?? 0),
    upvotesReceived: Number(upvoteRows[0]?.n ?? 0),
    newFollowers: Number(followerRows[0]?.n ?? 0),
  };
}
