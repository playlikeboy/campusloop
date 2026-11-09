import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResources } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const resource = await db.query.academicResources.findFirst({
      where: eq(academicResources.id, id),
      with: {
        uploader: {
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

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const sourceUrls = [resource.fileUrl, resource.driveUrl, ...(Array.isArray(resource.attachments) ? resource.attachments.map((attachment: any) => attachment?.url) : [])];
    const hasPlaceholderSource = /academic-sample[.]pdf|campusloop-demo|placeholder|sample[.]pdf/i.test(sourceUrls.filter(Boolean).join(" "));
    return NextResponse.json({ resource: { ...resource, isVerified: Boolean(resource.isVerified) && !hasPlaceholderSource } });
  } catch (error) {
    console.error("Error fetching single academic resource:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const db = getDb();

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const resource = await db.query.academicResources.findFirst({
      where: eq(academicResources.id, id),
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (resource.uploaderId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(academicResources).where(eq(academicResources.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting academic resource:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
