import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { bikeBookings, bikes } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;
    const db = auth.db;

    const allBikes = await db.query.bikes.findMany({
      orderBy: [desc(bikes.createdAt)],
      with: {
        merchant: {
          columns: { id: true, name: true, address: true, phone: true },
        },
      },
    });

    const allBookings = await db.query.bikeBookings.findMany({
      orderBy: [desc(bikeBookings.createdAt)],
      with: {
        bike: true,
        merchant: {
          columns: { id: true, name: true },
        },
        student: {
          columns: { id: true, displayName: true, username: true },
        },
        documents: true,
        inspections: true,
      },
    });

    return NextResponse.json({ bikes: allBikes, bookings: allBookings });
  } catch (error) {
    console.error("Error in admin rentals GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;
    const db = auth.db;

    const body = (await req.json()) as Record<string, any>;
    const { bookingId, status, depositRefundStatus } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (status) updatePayload.status = status;
    if (depositRefundStatus) updatePayload.depositRefundStatus = depositRefundStatus;

    const [updated] = await db
      .update(bikeBookings)
      .set(updatePayload)
      .where(eq(bikeBookings.id, bookingId))
      .returning();

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Error in admin rentals PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
