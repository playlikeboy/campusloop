import { and, desc, eq, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bikeBookings, bikes } from "@/db/schema";
import { resolveMerchantSession } from "@/lib/merchant-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const merchant = await resolveMerchantSession();
    if (!merchant) {
      return NextResponse.json({ error: "Unauthorized or merchant not found" }, { status: 401 });
    }

    if (merchant.categorySlug !== "rentals") {
      return NextResponse.json(
        { error: "Forbidden: Merchant is not in the rentals category" },
        { status: 403 }
      );
    }

    const db = getDb();

    // Fetch all active fleet bikes
    const fleetBikes = await db.query.bikes.findMany({
      where: and(eq(bikes.merchantId, merchant.id), ne(bikes.status, "INACTIVE")),
      orderBy: [desc(bikes.createdAt)],
    });

    const availableCount = fleetBikes.filter((b) => b.status === "AVAILABLE").length;
    const rentedCount = fleetBikes.filter((b) => b.status === "RENTED").length;
    const maintenanceCount = fleetBikes.filter((b) => b.status === "MAINTENANCE").length;
    const bookedCount = fleetBikes.filter((b) => b.status === "BOOKED").length;

    // Fetch Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysBookings = await db.query.bikeBookings.findMany({
      where: and(
        eq(bikeBookings.merchantId, merchant.id),
        sql`${bikeBookings.startAt} >= ${today} AND ${bikeBookings.startAt} < ${tomorrow}`
      ),
      orderBy: [desc(bikeBookings.startAt)],
      with: {
        bike: true,
        student: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      merchant,
      fleetSummary: {
        totalVehicles: fleetBikes.length,
        availableCount,
        rentedCount,
        maintenanceCount,
        bookedCount,
      },
      fleetBikes,
      todaysBookings,
    });
  } catch (error) {
    console.error("Error in merchant bikes GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
