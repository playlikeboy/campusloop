import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { getDb } from "@/db";
import { outreachContacts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "ALL").toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const offset = (page - 1) * limit;

    const db = getDb();

    // Compute metrics across all outreach contacts
    const [statsResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${outreachContacts.status} = 'PENDING')::int`,
        sent: sql<number>`count(*) filter (where ${outreachContacts.status} in ('SENT', 'DELIVERED', 'OPENED', 'REPLIED'))::int`,
        delivered: sql<number>`count(*) filter (where ${outreachContacts.status} in ('DELIVERED', 'OPENED', 'REPLIED'))::int`,
        replied: sql<number>`count(*) filter (where ${outreachContacts.status} = 'REPLIED')::int`,
      })
      .from(outreachContacts);

    const metrics = {
      total: statsResult?.total ?? 0,
      pending: statsResult?.pending ?? 0,
      sent: statsResult?.sent ?? 0,
      delivered: statsResult?.delivered ?? 0,
      replied: statsResult?.replied ?? 0,
      replyRate:
        (statsResult?.sent ?? 0) > 0
          ? Math.round(((statsResult?.replied ?? 0) / (statsResult?.sent ?? 1)) * 100)
          : 0,
    };

    // Filter conditions
    const conditions = [];

    if (status !== "ALL") {
      conditions.push(eq(outreachContacts.status, status));
    }

    if (q) {
      const searchPattern = `%${q}%`;
      conditions.push(
        or(
          ilike(outreachContacts.name, searchPattern),
          ilike(outreachContacts.email, searchPattern),
          ilike(outreachContacts.collegeName, searchPattern),
          ilike(outreachContacts.role, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch contacts with pagination
    const [contacts, [totalFiltered]] = await Promise.all([
      db
        .select()
        .from(outreachContacts)
        .where(whereClause)
        .orderBy(desc(outreachContacts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(outreachContacts)
        .where(whereClause),
    ]);

    const totalCount = totalFiltered?.count ?? 0;

    return NextResponse.json({
      success: true,
      metrics,
      contacts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[Admin Outreach GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch outreach contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      collegeName?: string;
      collegeSlug?: string;
      role?: string;
      notes?: string;
      source?: string;
    };
    const { name, email, collegeName, collegeSlug, role, notes, source } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Contact name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email address is required" }, { status: 400 });
    }

    if (!collegeName || typeof collegeName !== "string") {
      return NextResponse.json({ success: false, error: "College name is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const slug = (collegeSlug || collegeName.toLowerCase().replace(/[^a-z0-9]/g, "")).slice(0, 50);

    const db = getDb();

    // Check if contact already exists
    const existing = await db
      .select({ id: outreachContacts.id })
      .from(outreachContacts)
      .where(eq(outreachContacts.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "A contact with this email already exists" },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(outreachContacts)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        collegeName: collegeName.trim(),
        collegeSlug: slug,
        role: role?.trim() || "Campus Representative",
        notes: notes?.trim() || null,
        source: source?.trim() || "admin_manual",
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ success: true, contact: created });
  } catch (error) {
    console.error("[Admin Outreach POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add outreach contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const body = (await req.json()) as {
      id?: string;
      status?: string;
      notes?: string;
      replied?: boolean;
    };
    const { id, status, notes, replied } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Contact ID is required" }, { status: 400 });
    }

    const db = getDb();

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updatePayload.status = status;
    }

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    if (replied === true) {
      updatePayload.status = "REPLIED";
      updatePayload.repliedAt = new Date();
    } else if (replied === false) {
      updatePayload.repliedAt = null;
    }

    const [updated] = await db
      .update(outreachContacts)
      .set(updatePayload)
      .where(eq(outreachContacts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact: updated });
  } catch (error) {
    console.error("[Admin Outreach PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update outreach contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Contact ID is required" }, { status: 400 });
    }

    const db = getDb();
    await db.delete(outreachContacts).where(eq(outreachContacts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Outreach DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete outreach contact" },
      { status: 500 }
    );
  }
}
