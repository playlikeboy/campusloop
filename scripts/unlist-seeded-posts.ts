import { getDb } from "../src/db";
import { posts, userProfiles, reels, externalPosts } from "../src/db/schema";
import { inArray, eq, sql, or } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export function classifyUser(u: {
  id: string;
  userId: string;
  username: string;
  email: string | null;
  displayName: string;
}): "REAL" | "SEEDED" {
  // Founder / Owner
  if (u.id === "e446595b-d8fe-4376-9a53-d80f863dc3df" || u.username === "sh20raj") {
    return "REAL";
  }

  // Known seeded prefix in id or userId
  if (
    u.id.startsWith("seed_") ||
    u.userId.startsWith("seed_") ||
    u.id.startsWith("bit_user_") ||
    u.userId.startsWith("bit_auth_") ||
    u.id.startsWith("prof_") ||
    u.userId.startsWith("prof_") ||
    u.userId.startsWith("auth_bulk_") ||
    u.userId.startsWith("reddit_") ||
    u.userId.startsWith("usr_peer_") ||
    u.userId.startsWith("usr_rohit_") ||
    u.userId.startsWith("usr_ananya_") ||
    u.userId.startsWith("usr_arjun_") ||
    u.userId.startsWith("usr_priya_") ||
    u.userId.startsWith("usr_kartik_") ||
    u.userId.startsWith("usr_kavya_") ||
    u.userId.startsWith("usr_sid_") ||
    u.userId.startsWith("usr_tanya_")
  ) {
    return "SEEDED";
  }

  // Known demo or seeded email domains
  if (
    u.email?.endsWith("@campusloop.internal") ||
    u.email?.endsWith("@campusloop.space")
  ) {
    return "SEEDED";
  }

  // Known seed personas created without email or with synthetic usernames
  const knownSeedUsernames = new Set([
    "demo_tester",
    "rohan_mca_dev",
    "ahugebihhdihh",
    "aarav_mehta_cse",
    "devanshaggarwal524",
    "kabir_mbbs",
    "ayuurrr",
    "vis21hal",
    "ananya_mba",
    "dr_priya_phd",
    "btech10215_25",
    "btech10223_25",
    "btechtards",
    "jeeneetards",
    "delhiuniversity",
    "programmerhumor",
    "indianteenagers",
    "indianacademia",
    "college",
    "indiameme",
    "engineeringmemes",
    "rohit_9gag",
    "sneha_memes",
    "priya_music",
    "meera_acoustic",
    "aarav_beats",
    "ananya_lofi",
    "kabir_audio",
    "dev_aryan",
  ]);

  if (knownSeedUsernames.has(u.username.toLowerCase())) {
    return "SEEDED";
  }

  // Synthetic accounts without real email
  if (!u.email) {
    return "SEEDED";
  }

  // Real users with genuine email domains (.ac.in, @gmail.com, etc.)
  return "REAL";
}

export async function unlistSeededPostsAndTagUsers() {
  const db = getDb();
  console.log("🚀 Starting Unlist Seeded Posts, Reddit Content & Tag Seed Accounts...");

  // 1. Fetch all users
  const allUsers = await db
    .select({
      id: userProfiles.id,
      userId: userProfiles.userId,
      username: userProfiles.username,
      displayName: userProfiles.displayName,
      email: userProfiles.email,
    })
    .from(userProfiles);

  const realUserIds: string[] = [];
  const seededUserIds: string[] = [];

  for (const u of allUsers) {
    if (classifyUser(u) === "REAL") {
      realUserIds.push(u.id);
    } else {
      seededUserIds.push(u.id);
    }
  }

  console.log(`📊 Found ${seededUserIds.length} seeded accounts and ${realUserIds.length} real student accounts.`);

  // Tag seeded accounts: isSeeded = true
  for (let i = 0; i < seededUserIds.length; i += 200) {
    const batch = seededUserIds.slice(i, i + 200);
    await db
      .update(userProfiles)
      .set({ isSeeded: true })
      .where(inArray(userProfiles.id, batch));
  }

  // Tag real accounts: isSeeded = false
  for (let i = 0; i < realUserIds.length; i += 200) {
    const batch = realUserIds.slice(i, i + 200);
    await db
      .update(userProfiles)
      .set({ isSeeded: false })
      .where(inArray(userProfiles.id, batch));
  }
  console.log("✅ Seeded and real student accounts tagged in user_profiles.");

  // 2. Unlist all seeded Reddit reels in reels table
  await db
    .update(reels)
    .set({ status: "HIDDEN" })
    .where(or(eq(reels.source, "reddit"), eq(reels.status, "PUBLISHED")));
  console.log("✅ All Reddit reels marked as HIDDEN.");

  // 3. Process posts
  const allPosts = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      pseudonym: posts.pseudonym,
      title: posts.title,
      body: posts.body,
    })
    .from(posts);

  const extPostRows = await db
    .select({ postId: externalPosts.postId })
    .from(externalPosts);
  const extPostIds = new Set(extPostRows.map((r) => r.postId));
  const realUserSet = new Set(realUserIds);

  const seededPostIds: string[] = [];
  const realPostIds: string[] = [];

  for (const p of allPosts) {
    const isRedditLinked = extPostIds.has(p.id);

    const isRedditContent =
      isRedditLinked ||
      p.body.includes("reddit.com") ||
      p.body.includes("redd.it") ||
      p.body.includes("#Btechtards") ||
      p.body.includes("#btechtards") ||
      p.body.includes("#JEENEETards") ||
      p.body.includes("#jeeneetards") ||
      p.body.includes("#delhiuniversity") ||
      p.body.includes("#indianteenagers") ||
      p.body.includes("#programmerhumor") ||
      p.body.includes("#indianacademia") ||
      p.body.includes("#indiameme") ||
      p.body.includes("#engineeringmemes") ||
      p.body.includes("The 75% Attendance Equation") ||
      p.body.includes("Senior at the campus tapri giving life advice") ||
      (p.title && (
        p.title.includes("Bijendra Sir left pw") ||
        p.title.includes("Professor wants to fail me for proxy") ||
        p.title.includes("RA Sir")
      ));

    const isSeededId =
      p.id.startsWith("seed_post_") ||
      p.id.startsWith("bit_post_") ||
      p.id.startsWith("post_bulk_");

    const isRealAnon = p.pseudonym === "shade";

    if (isRedditContent || isSeededId) {
      seededPostIds.push(p.id);
    } else if (p.authorId && realUserSet.has(p.authorId)) {
      realPostIds.push(p.id);
    } else if (isRealAnon) {
      realPostIds.push(p.id);
    } else {
      seededPostIds.push(p.id);
    }
  }

  // Unlist seeded posts
  for (let i = 0; i < seededPostIds.length; i += 200) {
    const batch = seededPostIds.slice(i, i + 200);
    await db
      .update(posts)
      .set({
        isSeeded: true,
        status: "HIDDEN",
      })
      .where(inArray(posts.id, batch));
  }

  // Ensure genuine student posts remain active
  for (let i = 0; i < realPostIds.length; i += 200) {
    const batch = realPostIds.slice(i, i + 200);
    await db
      .update(posts)
      .set({
        isSeeded: false,
        status: "PUBLISHED",
      })
      .where(inArray(posts.id, batch));
  }

  console.log(`✅ Unlisted ${seededPostIds.length} seeded posts (status: 'HIDDEN', isSeeded: true).`);
  console.log(`✅ Kept ${realPostIds.length} genuine student posts active (status: 'PUBLISHED', isSeeded: false).`);
}

if (import.meta.main) {
  unlistSeededPostsAndTagUsers()
    .then(() => {
      console.log("🎉 Complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Failed:", err);
      process.exit(1);
    });
}
