import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getCommunityDirectory } from "@/lib/communities/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(1, Number(limitParam) || 20), 60)
      : 36;
    const sort = url.searchParams.get("sort") === "recent" ? "recent" : "popular";
    const search = url.searchParams.get("search") || url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || "All";
    const joinedOnly = url.searchParams.get("joined") === "true";

    let currentProfileId: string | null = null;

    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        const db = getDb();
        const profile = await db
          .select({ id: userProfiles.id })
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1);
        currentProfileId = profile[0]?.id ?? null;
      }
    } catch {
      currentProfileId = null;
    }

    const communities = await getCommunityDirectory({
      profileId: currentProfileId,
      limit,
      search,
      category,
      joinedOnly,
      sort,
    });

    return NextResponse.json(
      communities.map((community) => ({
        ...community,
        membersCount: community.memberCount,
        memberCount: community.memberCount,
        isPrivate: community.privacy === "PRIVATE",
      }))
    );
  } catch (error) {
    console.error("Error fetching communities API:", error);
    return NextResponse.json([], { status: 200 });
  }
}
