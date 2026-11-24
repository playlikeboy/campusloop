/**
 * Meme War: one weekly theme for every campus, one meme per student per week,
 * campus upvotes decide the winner. Voter ids are never returned.
 */
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { playMemes, playMemeThemes, playMemeVotes, userProfiles } from "@/db/schema";
import { MEME_THEME_FALLBACKS } from "@/constants/play";
import { previousWeekKey, weekEndsAt, weekKey } from "@/lib/play/week";
import type { Player } from "./context";

const realAuthor = and(eq(userProfiles.isSeeded, false), eq(userProfiles.status, "ACTIVE"));

/** This week's theme. If none was seeded, one is picked by week number and saved. */
export async function getOrCreateTheme(week: string) {
  const db = getDb();
  const [found] = await db.select().from(playMemeThemes).where(eq(playMemeThemes.weekKey, week)).limit(1);
  if (found) return found;
  const n = Number(week.split("-W")[1] ?? 0) + Number(week.slice(0, 4));
  const pick = MEME_THEME_FALLBACKS[n % MEME_THEME_FALLBACKS.length];
  await db.insert(playMemeThemes).values({ weekKey: week, ...pick }).onConflictDoNothing();
  const [created] = await db.select().from(playMemeThemes).where(eq(playMemeThemes.weekKey, week)).limit(1);
  return created ?? null;
}

export interface MemeCard {
  id: string;
  imageUrl: string;
  caption: string | null;
  upvotes: number;
  viewerVoted: boolean;
  isOwn: boolean;
  createdAt: string;
  author: { displayName: string; username: string; avatarUrl: string | null };
}

const memeColumns = {
  id: playMemes.id,
  profileId: playMemes.profileId,
  imageUrl: playMemes.imageUrl,
  caption: playMemes.caption,
  upvotes: playMemes.upvotes,
  createdAt: playMemes.createdAt,
  displayName: userProfiles.displayName,
  username: userProfiles.username,
  avatarUrl: userProfiles.avatarUrl,
};

/** Top meme of a finished week at a campus: most upvotes, earliest post breaks ties. */
export async function memeWeekWinner(institutionId: string, week: string) {
  const db = getDb();
  const [winner] = await db
    .select(memeColumns)
    .from(playMemes)
    .innerJoin(userProfiles, eq(userProfiles.id, playMemes.profileId))
    .where(
      and(
        eq(playMemes.institutionId, institutionId),
        eq(playMemes.weekKey, week),
        eq(playMemes.status, "ACTIVE"),
        realAuthor
      )
    )
    .orderBy(desc(playMemes.upvotes), asc(playMemes.createdAt))
    .limit(1);
  if (!winner) return null;
  const [field] = await db
    .select({ n: count() })
    .from(playMemes)
    .where(
      and(eq(playMemes.institutionId, institutionId), eq(playMemes.weekKey, week), eq(playMemes.status, "ACTIVE"))
    );
  return { ...winner, field: Number(field?.n ?? 0) };
}

export async function getMemeWar(profile: Player, blocked: Set<string>, sort: "top" | "new") {
  const db = getDb();
  const week = weekKey();
  const lastWeek = previousWeekKey();
  const [theme, rows, winner, lastTheme] = await Promise.all([
    getOrCreateTheme(week),
    db
      .select(memeColumns)
      .from(playMemes)
      .innerJoin(userProfiles, eq(userProfiles.id, playMemes.profileId))
      .where(
        and(
          eq(playMemes.institutionId, profile.institutionId),
          eq(playMemes.weekKey, week),
          eq(playMemes.status, "ACTIVE"),
          realAuthor
        )
      )
      .orderBy(...(sort === "top" ? [desc(playMemes.upvotes), asc(playMemes.createdAt)] : [desc(playMemes.createdAt)]))
      .limit(100),
    memeWeekWinner(profile.institutionId, lastWeek),
    db.select().from(playMemeThemes).where(eq(playMemeThemes.weekKey, lastWeek)).limit(1),
  ]);

  const visible = rows.filter((r) => !blocked.has(r.profileId));
  const ids = visible.map((r) => r.id);
  const myVotes = ids.length
    ? await db
        .select({ memeId: playMemeVotes.memeId })
        .from(playMemeVotes)
        .where(and(eq(playMemeVotes.voterId, profile.id), inArray(playMemeVotes.memeId, ids)))
    : [];
  const voted = new Set(myVotes.map((v) => v.memeId));

  const [mine] = await db
    .select({ id: playMemes.id, status: playMemes.status })
    .from(playMemes)
    .where(and(eq(playMemes.profileId, profile.id), eq(playMemes.weekKey, week)))
    .limit(1);

  const toCard = (r: (typeof rows)[number]): MemeCard => ({
    id: r.id,
    imageUrl: r.imageUrl,
    caption: r.caption,
    upvotes: r.upvotes,
    viewerVoted: voted.has(r.id),
    isOwn: r.profileId === profile.id,
    createdAt: r.createdAt.toISOString(),
    author: { displayName: r.displayName, username: r.username, avatarUrl: r.avatarUrl },
  });

  return {
    week,
    endsAt: weekEndsAt(),
    theme: theme ? { title: theme.title, description: theme.description } : null,
    memes: visible.map(toCard),
    /** "ACTIVE" = posted, "DELETED" = removed by you (you may post again), "HIDDEN" = reported. */
    myMemeStatus: (mine?.status ?? null) as "ACTIVE" | "DELETED" | "HIDDEN" | null,
    lastWeek:
      winner && !blocked.has(winner.profileId) && winner.upvotes > 0
        ? {
            theme: lastTheme[0]?.title ?? null,
            meme: {
              id: winner.id,
              imageUrl: winner.imageUrl,
              caption: winner.caption,
              upvotes: winner.upvotes,
              author: { displayName: winner.displayName, username: winner.username, avatarUrl: winner.avatarUrl },
            },
          }
        : null,
  };
}

export type PostMemeResult = { ok: true; id: string } | { ok: false; error: string; status: number };

export async function postMeme(profile: Player, imageUrl: string, caption: string | null): Promise<PostMemeResult> {
  const db = getDb();
  const week = weekKey();
  const theme = await getOrCreateTheme(week);
  const [existing] = await db
    .select({ id: playMemes.id, status: playMemes.status })
    .from(playMemes)
    .where(and(eq(playMemes.profileId, profile.id), eq(playMemes.weekKey, week)))
    .limit(1);

  if (existing?.status === "ACTIVE") return { ok: false, error: "You already posted a meme this week.", status: 409 };
  if (existing?.status === "HIDDEN") {
    return { ok: false, error: "Your meme was hidden after reports. You can post again next week.", status: 403 };
  }
  if (existing) {
    // Deleted earlier this week: replace it and start from zero votes.
    await db.delete(playMemeVotes).where(eq(playMemeVotes.memeId, existing.id));
    await db
      .update(playMemes)
      .set({ status: "ACTIVE", imageUrl, caption, upvotes: 0, themeId: theme?.id ?? null, createdAt: new Date() })
      .where(and(eq(playMemes.id, existing.id), eq(playMemes.status, "DELETED")));
    return { ok: true, id: existing.id };
  }
  const [row] = await db
    .insert(playMemes)
    .values({
      themeId: theme?.id ?? null,
      weekKey: week,
      institutionId: profile.institutionId,
      profileId: profile.id,
      imageUrl,
      caption,
    })
    .onConflictDoNothing()
    .returning({ id: playMemes.id });
  if (!row) return { ok: false, error: "You already posted a meme this week.", status: 409 };
  return { ok: true, id: row.id };
}

export async function deleteMeme(profile: Player, memeId: string) {
  const updated = await getDb()
    .update(playMemes)
    .set({ status: "DELETED" })
    .where(and(eq(playMemes.id, memeId), eq(playMemes.profileId, profile.id), eq(playMemes.status, "ACTIVE")))
    .returning({ id: playMemes.id });
  return updated.length > 0;
}

export type MemeVoteResult =
  | { ok: true; voted: boolean; upvotes: number }
  | { ok: false; error: string; status: number };

/** Tap to upvote, tap again to take it back. Only this week's memes at your campus. */
export async function toggleMemeVote(profile: Player, blocked: Set<string>, memeId: string): Promise<MemeVoteResult> {
  const db = getDb();
  const [meme] = await db
    .select({
      id: playMemes.id,
      profileId: playMemes.profileId,
      institutionId: playMemes.institutionId,
      weekKey: playMemes.weekKey,
      status: playMemes.status,
    })
    .from(playMemes)
    .where(eq(playMemes.id, memeId))
    .limit(1);
  if (
    !meme ||
    meme.status !== "ACTIVE" ||
    meme.institutionId !== profile.institutionId ||
    meme.weekKey !== weekKey() ||
    blocked.has(meme.profileId)
  ) {
    return { ok: false, error: "Voting on this meme is closed.", status: 409 };
  }
  if (meme.profileId === profile.id) return { ok: false, error: "You can't vote for your own meme.", status: 400 };

  const added = await db
    .insert(playMemeVotes)
    .values({ memeId, voterId: profile.id })
    .onConflictDoNothing()
    .returning({ memeId: playMemeVotes.memeId });

  let voted = true;
  if (added.length === 0) {
    const removed = await db
      .delete(playMemeVotes)
      .where(and(eq(playMemeVotes.memeId, memeId), eq(playMemeVotes.voterId, profile.id)))
      .returning({ memeId: playMemeVotes.memeId });
    voted = false;
    if (removed.length === 0) voted = true;
  }

  const [row] = await db
    .update(playMemes)
    .set({
      upvotes: sql`(SELECT count(*)::int FROM play_meme_votes v WHERE v.meme_id = ${memeId})`,
    })
    .where(eq(playMemes.id, memeId))
    .returning({ upvotes: playMemes.upvotes });
  return { ok: true, voted, upvotes: row?.upvotes ?? 0 };
}
