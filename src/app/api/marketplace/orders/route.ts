import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { marketplaceOrders } from "@/db/schema";
import { pageOf, parseBefore, parseLimit } from "@/lib/pagination";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "active", "completed", "cancelled", "all"
    const limit = parseLimit(searchParams, 50, 100);
    const before = parseBefore(searchParams);

    const conditions: any[] = [eq(marketplaceOrders.studentId, profile.id)];
    if (before) conditions.push(lt(marketplaceOrders.createdAt, before));

    if (filter === "active") {
      conditions.push(
        inArray(marketplaceOrders.status, [
          "PLACED",
          "ACCEPTED",
          "PREPARING",
          "READY",
          "OUT_FOR_DELIVERY",
          "READY_FOR_PICKUP",
        ])
      );
    } else if (filter === "completed") {
      conditions.push(inArray(marketplaceOrders.status, ["DELIVERED", "PICKED_UP"]));
    } else if (filter === "cancelled") {
      conditions.push(inArray(marketplaceOrders.status, ["REJECTED", "CANCELLED"]));
    }

    const rows = await db.query.marketplaceOrders.findMany({
      where: and(...conditions),
      orderBy: [desc(marketplaceOrders.createdAt)],
      limit: limit + 1,
      with: {
        merchant: {
          columns: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            phone: true,
            address: true,
            categorySlug: true,
          },
        },
        items: true,
      },
    });

    const { page: orders, hasMore, nextCursor } = pageOf(rows, limit);

    return NextResponse.json({ orders, hasMore, nextCursor });
  } catch (error) {
    console.error("Error fetching student marketplace orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
