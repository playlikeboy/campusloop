import { buildLlmsFullTxt } from "@/lib/guide/llms";

export const dynamic = "force-static";

/** The whole product in one plain-text file for AI models, generated from the guide catalogue. */
export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
