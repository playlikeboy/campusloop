import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { lostAndFoundItems, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { rejectIfLacksCapability } from "@/lib/capabilities";
import { recordStreakActivity } from "@/lib/streaks/streak-service";

export const dynamic = "force-dynamic";

function textQuery(q: string) {
  return q.trim() ? "%" + q.trim() + "%" : null;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);

    let currentProfile = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user?.id) {
        currentProfile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
        });
      }
    } catch {
      // Guest viewer
    }

    const type = searchParams.get("type"); // "LOST" | "FOUND" | "all"
    const category = searchParams.get("category");
    const scope = searchParams.get("scope") || "MY_CAMPUS"; // "MY_CAMPUS" | "ALL"
    const institutionIdParam = searchParams.get("institutionId");
    const isResolvedParam = searchParams.get("isResolved");
    const rawSearch = searchParams.get("q") || "";
    const q = textQuery(rawSearch);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(4, Number.parseInt(searchParams.get("limit") || "16", 10)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Campus scoping
    if (scope === "MY_CAMPUS" && currentProfile?.institutionId) {
      conditions.push(eq(lostAndFoundItems.institutionId, currentProfile.institutionId));
    } else if (institutionIdParam && institutionIdParam !== "ALL") {
      conditions.push(eq(lostAndFoundItems.institutionId, institutionIdParam));
    }

    // Type filter
    if (type && type !== "all" && type !== "ALL") {
      conditions.push(eq(lostAndFoundItems.type, type.toUpperCase()));
    }

    // Category filter
    if (category && category !== "all" && category !== "ALL") {
      conditions.push(eq(lostAndFoundItems.category, category));
    }

    // Resolution status
    if (isResolvedParam === "false") {
      conditions.push(eq(lostAndFoundItems.isResolved, false));
    } else if (isResolvedParam === "true") {
      conditions.push(eq(lostAndFoundItems.isResolved, true));
    }

    // Keyword search
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
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: rows,
      page,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
      userCampusId: currentProfile?.institutionId || null,
    });
  } catch (error) {
    console.error("GET /api/lost-and-found error:", error);
    return NextResponse.json({ error: "Failed to fetch lost and found items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const guardResponse = await rejectIfLacksCapability(profile, "CREATE_POST");
    if (guardResponse) return guardResponse;

    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const {
      type = "LOST",
      title,
      description = "",
      category = "Other",
      location,
      itemDate,
      imageUrl,
      contactInfo,
      reward,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Item title is required" }, { status: 400 });
    }

    if (!location || !location.trim()) {
      return NextResponse.json({ error: "Campus location is required" }, { status: 400 });
    }

    const rawTitle = title.trim();
    const baseSlug = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const itemType = type.toUpperCase() === "FOUND" ? "found" : "lost";
    const shortId = crypto.randomUUID().slice(0, 8);
    const slug = `${itemType}-${baseSlug}-${shortId}`;

    let safeImageUrl: string | null = null;
    if (typeof imageUrl === "string" && imageUrl.trim()) {
      const trimmedUrl = imageUrl.trim();
      if (/^https?:\/\/[^\s]+$/i.test(trimmedUrl) || trimmedUrl.startsWith("/api/files/r2/")) {
        safeImageUrl = trimmedUrl;
      }
    }

    const [item] = await db
      .insert(lostAndFoundItems)
      .values({
        institutionId: profile.institutionId,
        authorId: profile.id,
        type: itemType.toUpperCase(),
        title: rawTitle,
        description: description?.trim() || "",
        category: category || "Other",
        location: location.trim(),
        itemDate: itemDate || new Date().toISOString().split("T")[0],
        imageUrl: safeImageUrl,
        contactInfo: contactInfo?.trim() || `@${profile.username}`,
        reward: reward?.trim() || null,
        slug,
      })
      .returning();

    recordStreakActivity({
      userId: profile.id,
      eventType: "UTILITY_LIST",
      resourceId: item.id,
    }).catch((err) => console.warn("Failed to record streak for lost & found item:", err));

    return NextResponse.json({ success: true, item, slug }, { status: 201 });
  } catch (error) {
    console.error("POST /api/lost-and-found error:", error);
    return NextResponse.json({ error: "Failed to report item" }, { status: 500 });
  }
}
