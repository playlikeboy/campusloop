import { NextResponse } from "next/server";
import { runAtlasAgent } from "@/lib/atlas/agent";
import { isLiveSanityConfigured } from "@/lib/sanity/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prompt = url.searchParams.get("q") || "What clubs exist?";
  const result = await runAtlasAgent(prompt);

  return NextResponse.json({
    service: "CampusLoop Atlas Agent API",
    sanityStatus: isLiveSanityConfigured ? "connected" : "in-memory-seed-fallback",
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo-campusloop",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    result,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const prompt = body?.prompt || body?.query || body?.message || "What clubs exist?";

    const result = await runAtlasAgent(prompt);

    return NextResponse.json({
      success: true,
      sanityConnected: isLiveSanityConfigured,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo-campusloop",
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      result,
    });
  } catch (error: any) {
    console.error("[Atlas API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process query in Atlas Agent" },
      { status: 500 }
    );
  }
}
