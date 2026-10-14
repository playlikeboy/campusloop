import { NextResponse } from "next/server";
import { hexclaveServerApp } from "@/hexclave/server";
import { isLiveSanityConfigured } from "@/lib/sanity/client";
import { runAtlasAgent } from "@/lib/atlas/agent";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      service: "CampusLoop Atlas",
      status: "ready",
      dataSource: isLiveSanityConfigured ? "configured" : "preview",
      capabilities: ["clubs", "events", "announcements"],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to ask Atlas about campus records." }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { prompt?: unknown; query?: unknown; message?: unknown } | null;
    const rawPrompt = body?.prompt ?? body?.query ?? body?.message;
    if (typeof rawPrompt !== "string") {
      return NextResponse.json({ success: false, error: "Enter a question to search campus records." }, { status: 400 });
    }

    const prompt = rawPrompt.trim();
    if (prompt.length < 3) {
      return NextResponse.json({ success: false, error: "Your question needs at least 3 characters." }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ success: false, error: "Questions must be 500 characters or fewer." }, { status: 400 });
    }

    const result = await runAtlasAgent(prompt);

    return NextResponse.json(
      {
        success: true,
        sanityConnected: isLiveSanityConfigured,
        result,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[Atlas API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Atlas is temporarily unavailable. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
