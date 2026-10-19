import { buildLlmsTxt } from "@/lib/guide/llms";

export const dynamic = "force-static";

/** llms.txt index for AI models, generated from the Product Guide catalogue. */
export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
