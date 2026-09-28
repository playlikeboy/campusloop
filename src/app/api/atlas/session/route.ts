import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sessionPath = path.join(process.cwd(), "sanity", "AGENT_SESSION.md");
    if (fs.existsSync(sessionPath)) {
      const markdown = fs.readFileSync(sessionPath, "utf-8");
      return new Response(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "Session file not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
