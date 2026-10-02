import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(1, Number(limitParam) || 20), 50) : 24;
    const pageParam = url.searchParams.get("page");
    const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
    const offset = (page - 1) * limit;

    const sort = url.searchParams.get("sort") || "popular";
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q") || url.searchParams.get("search");

    const db = getDb();

    // Check logged in user profile ID for membership status
    let currentProfileId: string | null = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        const profile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
          columns: { id: true },
        });
        currentProfileId = profile?.id ?? null;
      }
    } catch {
      // Guest visitor
    }

    const filters = [ne(communities.privacy, "UNLISTED")];

    if (category && category !== "All") {
      filters.push(eq(communities.category, category));
    }

    if (q && q.trim().length > 0) {
      const pattern = `%${q.trim()}%`;
      filters.push(or(ilike(communities.name, pattern), ilike(communities.description, pattern)) as never);
    }

    const where = and(...filters);

    const allCommunities = await db.query.communities.findMany({
      where,
      orderBy:
        sort === "popular"
          ? [desc(communities.points), desc(communities.createdAt)]
          : [desc(communities.createdAt)],
      limit,
      offset,
      with: {
        members: true,
        creator: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const response = allCommunities.map((comm) => {
      const membersCount = comm.members ? comm.members.filter((m) => m.status === "ACTIVE").length : 0;
      const isMember = currentProfileId
        ? (comm.members || []).some((m) => m.userId === currentProfileId && m.status === "ACTIVE")
        : false;

      return {
        ...comm,
        slug: comm.slug || comm.name.toLowerCase().replace(/\s+/g, "-"),
        membersCount,
        memberCount: membersCount,
        isPrivate: comm.privacy === "PRIVATE",
        isMember,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching communities API:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be signed in to create a community" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found", message: "Student profile is required" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const {
      name,
      slug: customSlug,
      description,
      category = "General",
      privacy = "PUBLIC",
      allowAnonymousPosts = true,
      rules,
      avatarUrl,
      bannerUrl,
    } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json(
        { error: "Invalid Name", message: "Community name must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    const baseSlug = customSlug && typeof customSlug === "string" && customSlug.trim()
      ? slugify(customSlug)
      : slugify(trimmedName);

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const uniqueSlug = `${baseSlug}-${randomSuffix}`;
    const inviteCode = `join_${Math.random().toString(36).substring(2, 10)}`;

    const validPrivacy = ["PUBLIC", "PRIVATE", "UNLISTED"].includes(privacy) ? privacy : "PUBLIC";

    const [newCommunity] = await db
      .insert(communities)
      .values({
        name: trimmedName,
        slug: uniqueSlug,
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        category: typeof category === "string" ? category : "General",
        privacy: validPrivacy,
        allowAnonymousPosts: Boolean(allowAnonymousPosts),
        rules: typeof rules === "string" ? rules : Array.isArray(rules) ? JSON.stringify(rules) : null,
        avatarUrl: typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null,
        bannerUrl: typeof bannerUrl === "string" && bannerUrl.trim() ? bannerUrl.trim() : null,
        creatorId: profile.id,
        inviteCode,
        points: 100, // Founding clout bonus
      })
      .returning();

    // Auto-join creator as ADMIN
    await db.insert(communityMembers).values({
      communityId: newCommunity.id,
      userId: profile.id,
      role: "ADMIN",
      status: "ACTIVE",
    });

    // Award +100 LP to the founding student
    await db
      .update(userProfiles)
      .set({ points: sql`${userProfiles.points} + 100` })
      .where(eq(userProfiles.id, profile.id));

    revalidatePath("/communities");
    revalidatePath(`/communities/${newCommunity.slug || newCommunity.id}`);

    return NextResponse.json(
      {
        success: true,
        community: {
          ...newCommunity,
          isMember: true,
          membersCount: 1,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json(
        { error: "Conflict", message: "A community with this name or slug already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating community via REST API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create community" },
      { status: 500 }
    );
  }
}
