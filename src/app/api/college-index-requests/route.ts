import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { institutionRequests } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

function normalizePattern(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^mailto:/, "")
    .replace(/^\*?@/, "")
    .replace(/\s+/g, "");
}

function isValidEmailPattern(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalizePattern(value));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      collegeName?: string;
      emailPattern?: string;
      state?: string;
      district?: string;
    };

    const collegeName = body.collegeName?.trim();
    const emailPattern = normalizePattern(body.emailPattern || "");

    if (!collegeName || collegeName.length < 3) {
      return NextResponse.json({ error: "Please enter the official college name." }, { status: 400 });
    }

    if (!emailPattern || !isValidEmailPattern(emailPattern)) {
      return NextResponse.json(
        { error: "Enter a valid college email domain, for example bitmesra.ac.in." },
        { status: 400 }
      );
    }

    const user = await hexclaveServerApp.getUser();
    const userId = user?.id || "anonymous";

    const db = getDb();
    const existing = await db.query.institutionRequests.findFirst({
      where: (requests, { and, eq }) =>
        and(eq(requests.emailDomain, emailPattern), eq(requests.status, "PENDING")),
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyRequested: true });
    }

    await db.insert(institutionRequests).values({
      userId,
      emailDomain: emailPattern,
      suggestedInstitutionName: collegeName.slice(0, 160),
      state: body.state?.trim().slice(0, 80) || null,
      district: body.district?.trim().slice(0, 80) || null,
      status: "PENDING",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create college indexing request:", error);
    return NextResponse.json({ error: "Could not submit the college request." }, { status: 500 });
  }
}
