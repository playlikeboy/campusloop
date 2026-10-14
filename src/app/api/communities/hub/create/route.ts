import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  academicResources,
  gamingLobbies,
  gamingLobbyMembers,
  housingListings,
  lostAndFoundItems,
  marketplaceItems,
  ridesharePools,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

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

    const institutionId = profile.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "College institution required" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      hubType?: string;
      [key: string]: any;
    };
    const { hubType, ...data } = body;

    if (!hubType) {
      return NextResponse.json({ error: "hubType is required" }, { status: 400 });
    }

    switch (hubType) {
      case "lost_found": {
        const rawTitle = (data.title || "item").trim();
        const baseSlug = rawTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50);
        const itemType = (data.type || "LOST").toLowerCase();
        const shortId = crypto.randomUUID().slice(0, 8);
        const slug = `${itemType}-${baseSlug}-${shortId}`;

        const [item] = await db
          .insert(lostAndFoundItems)
          .values({
            institutionId,
            authorId: profile.id,
            type: data.type || "LOST",
            title: rawTitle,
            description: data.description || "",
            category: data.category || "Other",
            location: data.location || "Campus",
            itemDate: data.itemDate || new Date().toISOString().split("T")[0],
            imageUrl: data.imageUrl || null,
            contactInfo: data.contactInfo || `@${profile.username}`,
            reward: data.reward || null,
            slug,
          })
          .returning();
        return NextResponse.json({ success: true, item, slug });
      }

      case "marketplace": {
        const [item] = await db
          .insert(marketplaceItems)
          .values({
            institutionId,
            sellerId: profile.id,
            title: data.title,
            description: data.description || "",
            price: Math.max(0, parseInt(data.price, 10) || 0),
            originalPrice: data.originalPrice ? parseInt(data.originalPrice, 10) : null,
            condition: data.condition || "GOOD",
            category: data.category || "Other",
            hostelLocation: data.hostelLocation || "Campus",
            isNegotiable: data.isNegotiable !== false,
            images: data.images ? JSON.stringify(data.images) : null,
          })
          .returning();
        return NextResponse.json({ success: true, item });
      }

      case "gaming": {
        const title = typeof data.title === "string" ? data.title.trim() : "";
        if (!title || title.length > 140) {
          return NextResponse.json({ error: "Lobby title must be between 1 and 140 characters." }, { status: 400 });
        }

        const allowedModes = ["5v5 Competitive", "Casual", "Scrim", "Tournament"];
        if (typeof data.mode !== "string" || !allowedModes.includes(data.mode)) {
          return NextResponse.json({ error: "Choose a valid match format." }, { status: 400 });
        }

        const allowedGames = ["Valorant", "BGMI", "CS2", "Dota 2", "FIFA", "Chess"];
        const gameName = typeof data.gameName === "string" ? data.gameName : "Valorant";
        if (!allowedGames.includes(gameName)) {
          return NextResponse.json({ error: "Choose a supported game." }, { status: 400 });
        }

        const parsedSlots = Number(data.slotsTotal ?? 5);
        if (!Number.isInteger(parsedSlots) || parsedSlots < 2 || parsedSlots > 20) {
          return NextResponse.json({ error: "Squad size must be between 2 and 20 players." }, { status: 400 });
        }

        const description = typeof data.description === "string" ? data.description.trim() : "";
        if (description.length > 1600) {
          return NextResponse.json({ error: "Description must be 1,600 characters or fewer." }, { status: 400 });
        }

        const gamerTag = typeof data.gamerTag === "string" ? data.gamerTag.trim().slice(0, 80) : "";
        const scheduledAt = typeof data.scheduledAt === "string" ? data.scheduledAt.trim().slice(0, 120) : "";
        let discordOrVoiceUrl: string | null = null;
        if (typeof data.discordOrVoiceUrl === "string" && data.discordOrVoiceUrl.trim()) {
          try {
            const parsedUrl = new URL(data.discordOrVoiceUrl.trim());
            if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
              throw new Error("Unsupported link protocol");
            }
            discordOrVoiceUrl = parsedUrl.toString();
          } catch {
            return NextResponse.json({ error: "Enter a valid HTTP or HTTPS voice invite link." }, { status: 400 });
          }
        }

        const [lobby] = await db
          .insert(gamingLobbies)
          .values({
            institutionId,
            hostId: profile.id,
            gameName,
            title,
            description,
            mode: data.mode,
            rankTier: typeof data.rankTier === "string" ? data.rankTier.trim().slice(0, 80) || null : null,
            gamerTag: gamerTag || profile.username,
            slotsTotal: parsedSlots,
            slotsFilled: 1,
            discordOrVoiceUrl,
            scheduledAt: scheduledAt || null,
            players: JSON.stringify([
              {
                userId: profile.id,
                username: profile.username,
                displayName: profile.displayName,
                avatarUrl: profile.avatarUrl ?? null,
                gamerTag: gamerTag || profile.username,
                role: "Host",
              },
            ]),
          })
          .returning();

        await db
          .insert(gamingLobbyMembers)
          .values({
            lobbyId: lobby.id,
            userId: profile.id,
            role: "Host",
            gamerTag: data.gamerTag || profile.username,
          })
          .onConflictDoNothing();

        return NextResponse.json({ success: true, item: lobby });
      }

      case "rideshare": {
        const [ride] = await db
          .insert(ridesharePools)
          .values({
            institutionId,
            creatorId: profile.id,
            origin: data.origin || "Campus Gate",
            destination: data.destination,
            departureTime: data.departureTime || "Soon",
            vehicleType: data.vehicleType || "AUTO",
            totalSeats: Math.max(1, parseInt(data.totalSeats, 10) || 4),
            availableSeats: Math.max(1, parseInt(data.availableSeats, 10) || 3),
            pricePerSeat: Math.max(0, parseInt(data.pricePerSeat, 10) || 50),
            contactInfo: data.contactInfo || `@${profile.username}`,
            notes: data.notes || "",
            passengers: JSON.stringify([
              {
                userId: profile.id,
                displayName: profile.displayName,
                seats: 1,
              },
            ]),
          })
          .returning();
        return NextResponse.json({ success: true, item: ride });
      }

      case "housing": {
        const [flat] = await db
          .insert(housingListings)
          .values({
            institutionId,
            authorId: profile.id,
            title: data.title,
            description: data.description || "",
            location: data.location || "Near Campus",
            distanceFromCampus: data.distanceFromCampus || "5 min walk",
            rentPerMonth: Math.max(0, parseInt(data.rentPerMonth, 10) || 0),
            deposit: data.deposit ? parseInt(data.deposit, 10) : null,
            occupancyType: data.occupancyType || "SINGLE_ROOM",
            genderPreference: data.genderPreference || "ANY",
            amenities: data.amenities ? JSON.stringify(data.amenities) : null,
            contactInfo: data.contactInfo || `@${profile.username}`,
          })
          .returning();
        return NextResponse.json({ success: true, item: flat });
      }

      case "academics": {
        const [resource] = await db
          .insert(academicResources)
          .values({
            institutionId,
            uploaderId: profile.id,
            title: data.title,
            description: data.description || "",
            subjectCode: data.subjectCode || "GEN101",
            subjectName: data.subjectName || data.title,
            branch: data.branch || "All",
            semester: Math.max(1, parseInt(data.semester, 10) || 1),
            resourceType: data.resourceType || "NOTES",
            fileUrl: data.fileUrl || null,
            driveUrl: data.driveUrl || null,
          })
          .returning();
        return NextResponse.json({ success: true, item: resource });
      }

      default:
        return NextResponse.json({ error: "Invalid hubType" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/communities/hub/create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
