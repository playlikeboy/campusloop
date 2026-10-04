import { and, desc, eq, ne, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { lostAndFoundItems, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "at", "with", "and", "or", "of", "to", "for", "on", "is", "my",
  "found", "lost", "item", "please", "help", "from", "near", "room", "floor", "block",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Synonyms map to detect cross-brand or equivalent objects (e.g. bluetooth, earbuds, airdopes, airpods, headphones)
const SYNONYM_GROUPS: string[][] = [
  ["bluetooth", "earbuds", "earphones", "airpods", "airdopes", "headphones", "headset", "tws", "audio"],
  ["cycle", "bicycle", "bike", "gear", "lock"],
  ["calculator", "casio", "scientific", "classwiz"],
  ["wallet", "purse", "id", "card", "admit"],
  ["keys", "keychain", "lanyard", "lock"],
  ["charger", "adapter", "cable", "c-type", "usbc", "lightning"],
  ["watch", "smartwatch", "titan", "noise", "fireboltt", "fastrack"],
];

function expandKeywords(words: string[]): string[] {
  const set = new Set(words);
  for (const word of words) {
    for (const group of SYNONYM_GROUPS) {
      if (group.includes(word)) {
        for (const syn of group) {
          set.add(syn);
        }
      }
    }
  }
  return Array.from(set);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();

    // 1. Try finding by slug first, then by exact id
    let item = await db.query.lostAndFoundItems.findFirst({
      where: eq(lostAndFoundItems.slug, slug),
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

    if (!item) {
      item = await db.query.lostAndFoundItems.findFirst({
        where: eq(lostAndFoundItems.id, slug),
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
    }

    // Fallback: match by short prefix ID if slug ends with -<shortId>
    if (!item && slug.includes("-")) {
      const parts = slug.split("-");
      const candidateId = parts[parts.length - 1];
      if (candidateId && candidateId.length >= 6) {
        const candidates = await db.query.lostAndFoundItems.findMany({
          with: {
            author: {
              columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true },
            },
            institution: {
              columns: { id: true, name: true, slug: true },
            },
          },
        });
        item = candidates.find((c) => c.id.startsWith(candidateId));
      }
    }

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 2. Similarity Search Engine
    // Extract keywords from title and description, and expand with semantic synonyms
    const baseKeywords = extractKeywords(`${item.title} ${item.description || ""} ${item.category}`);
    const expandedWords = expandKeywords(baseKeywords);

    // Fetch potential candidates in the same institution or across the network
    const allOtherItems = await db.query.lostAndFoundItems.findMany({
      where: ne(lostAndFoundItems.id, item.id),
      orderBy: [desc(lostAndFoundItems.createdAt)],
      limit: 50,
      with: {
        author: {
          columns: { id: true, username: true, displayName: true, avatarUrl: true, points: true },
        },
        institution: {
          columns: { id: true, name: true, slug: true },
        },
      },
    });

    // Score candidates based on matching signals
    const scored = allOtherItems.map((candidate) => {
      const candidateWords = new Set(
        extractKeywords(`${candidate.title} ${candidate.description || ""} ${candidate.category}`)
      );

      let score = 0;
      const matchedTokens: string[] = [];

      for (const word of expandedWords) {
        if (candidateWords.has(word)) {
          score += 3;
          matchedTokens.push(word);
        }
      }

      // Bonus for exact category match
      if (candidate.category === item.category && item.category !== "Other") {
        score += 4;
      }

      // Bonus for same campus location or same institution
      if (candidate.institutionId === item.institutionId) {
        score += 2;
      }
      if (
        candidate.location &&
        item.location &&
        candidate.location.toLowerCase().includes(item.location.toLowerCase())
      ) {
        score += 3;
      }

      // Flag if this is a direct counterpart (LOST vs FOUND)
      const isOppositeType = candidate.type !== item.type;
      if (isOppositeType && score > 0) {
        score += 5; // Heavy boost for potential recovery match!
      }

      return {
        item: candidate,
        score,
        matchedTokens: Array.from(new Set(matchedTokens)),
        isOppositeType,
        isSameCampus: candidate.institutionId === item.institutionId,
      };
    });

    // Filter relevant items with score > 2
    const potentialMatches = scored
      .filter((s) => s.isOppositeType && s.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => ({
        ...s.item,
        similarityScore: s.score,
        matchedTokens: s.matchedTokens,
        matchReason: `Potential recovery match: ${s.matchedTokens.join(", ") || s.item.category}`,
      }));

    const similarReports = scored
      .filter((s) => !s.isOppositeType && s.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => ({
        ...s.item,
        similarityScore: s.score,
        matchedTokens: s.matchedTokens,
        matchReason: `Similar ${s.item.category} item`,
      }));

    return NextResponse.json({
      item,
      potentialMatches,
      similarReports,
    });
  } catch (error) {
    console.error("GET /api/lost-and-found/[slug] error:", error);
    return NextResponse.json({ error: "Failed to load item" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const item = await db.query.lostAndFoundItems.findFirst({
      where: or(eq(lostAndFoundItems.slug, slug), eq(lostAndFoundItems.id, slug)),
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Only owner or admin can update status
    if (item.authorId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const isResolved = Boolean(body.isResolved);

    const [updated] = await db
      .update(lostAndFoundItems)
      .set({
        isResolved,
        updatedAt: new Date(),
      })
      .where(eq(lostAndFoundItems.id, item.id))
      .returning();

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("PATCH /api/lost-and-found/[slug] error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
