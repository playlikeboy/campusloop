import { buildSkillMarkdown } from "@/lib/oauth/skill";

/** Public agent skill for Login with CampusLoop (no secrets). Linked from /developers and the portal prompts. */
export function GET() {
  return new Response(buildSkillMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "index, follow",
    },
  });
}
