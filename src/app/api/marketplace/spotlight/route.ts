import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { marketplaceItems } from "@/db/schema/marketplace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const items = await db.query.marketplaceItems.findMany({
      where: eq(marketplaceItems.isSold, false),
      orderBy: [desc(marketplaceItems.createdAt)],
      limit: 6,
      with: {
        seller: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
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

    const parsed = items.map((item) => {
      let imageUrl = null;
      try {
        if (item.images) {
          const arr = JSON.parse(item.images);
          if (Array.isArray(arr) && arr.length > 0) {
            imageUrl = arr[0];
          }
        }
      } catch {
        // Fallback
      }

      return {
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        category: item.category,
        condition: item.condition,
        hostelLocation: item.hostelLocation,
        imageUrl,
        seller: item.seller,
        institution: item.institution,
      };
    });

    return NextResponse.json({ items: parsed });
  } catch (error) {
    console.error("GET /api/marketplace/spotlight error:", error);
    return NextResponse.json({ items: [] });
  }
}
