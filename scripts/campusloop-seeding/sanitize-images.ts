import { eq, like, or } from "drizzle-orm";
import { getDb } from "../../src/db";
import { communities, events, stories, userProfiles } from "../../src/db/schema";

async function main() {
  const db = getDb();
  console.log("🔄 Updating seeded data: Replacing all Unsplash URLs with DiceBear random SVGs...");

  // 1. Update user profiles
  const seededUsers = await db.query.userProfiles.findMany({
    where: like(userProfiles.id, "seed_202609_%"),
  });
  console.log(`Found ${seededUsers.length} seed users to sanitize.`);

  let updatedUsers = 0;
  for (const user of seededUsers) {
    const isFemale = user.gender === "FEMALE";
    const collection = isFemale ? "lorelei" : "micah";
    const newAvatar = `https://api.dicebear.com/7.x/${collection}/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const newBanner = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.username)}-banner&backgroundColor=0f172a,1e1b4b,312e81,022c22,3f1dcb,172554`;

    await db
      .update(userProfiles)
      .set({
        avatarUrl: newAvatar,
        bannerUrl: newBanner,
      })
      .where(eq(userProfiles.id, user.id));
    updatedUsers++;
  }
  console.log(`✅ Updated ${updatedUsers} user profiles with DiceBear avatars and banners.`);

  // 2. Update communities
  const seededCommunities = await db.query.communities.findMany({
    where: like(communities.id, "seed_202609_%"),
  });
  console.log(`Found ${seededCommunities.length} seed communities to sanitize.`);

  let updatedComm = 0;
  for (const comm of seededCommunities) {
    const commSlug = comm.slug || comm.id;
    const newAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(commSlug)}&backgroundColor=0f172a,18181b,1e1b4b,042f2e`;
    const newBanner = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(commSlug)}-banner&backgroundColor=09090b,18181b,27272a,1e1b4b`;

    await db
      .update(communities)
      .set({
        avatarUrl: newAvatar,
        bannerUrl: newBanner,
      })
      .where(eq(communities.id, comm.id));
    updatedComm++;
  }
  console.log(`✅ Updated ${updatedComm} communities with DiceBear logos and banners.`);

  // 3. Update stories
  const seededStories = await db.query.stories.findMany({
    where: like(stories.id, "seed_202609_%"),
  });
  console.log(`Found ${seededStories.length} seed stories to sanitize.`);

  let updatedStories = 0;
  for (const story of seededStories) {
    if (story.mediaUrl && story.mediaUrl.includes("unsplash.com")) {
      const newMedia = `https://api.dicebear.com/7.x/shapes/svg?seed=story-${encodeURIComponent(story.id)}&backgroundColor=3b82f6,8b5cf6,ec4899,10b981,f59e0b`;
      await db
        .update(stories)
        .set({ mediaUrl: newMedia })
        .where(eq(stories.id, story.id));
      updatedStories++;
    }
  }
  console.log(`✅ Updated ${updatedStories} stories with DiceBear shape visuals.`);

  // 4. Update events
  const seededEvents = await db.query.events.findMany({
    where: like(events.id, "seed_202609_%"),
  });
  console.log(`Found ${seededEvents.length} seed events to sanitize.`);

  let updatedEvents = 0;
  for (const ev of seededEvents) {
    if (ev.bannerUrl && ev.bannerUrl.includes("unsplash.com")) {
      const newBanner = `https://api.dicebear.com/7.x/shapes/svg?seed=event-${encodeURIComponent(ev.id)}&backgroundColor=18181b,27272a,3f3f46,1e1b4b`;
      await db
        .update(events)
        .set({ bannerUrl: newBanner })
        .where(eq(events.id, ev.id));
      updatedEvents++;
    }
  }
  console.log(`✅ Updated ${updatedEvents} events with DiceBear banners.`);

  console.log("\n🎉 ALL SEEDED UNSPLASH PHOTOS REPLACED WITH DICEBEAR RANDOM SVGs!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
