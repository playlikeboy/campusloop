import { ImageResponse } from "next/og";

/**
 * Dynamic share card: /og?title=Events%20near%20you&kicker=Events
 *
 * Violet field, white sticker tile with the page title, logo "C" badge.
 * Uses only the font bundled with next/og and inline shapes, so it needs no
 * node:fs and no network fetch. OpenNext for Cloudflare patches @vercel/og to
 * run on the workers runtime. If it ever fails in production, pages that use
 * `ogImageUrl()` should switch back to the static /og-image.png (the default
 * in buildMetadata), which is why this route is opt-in.
 *
 * Do not add `export const runtime = "edge"`: OpenNext runs routes on its
 * own Node-compatible worker and does not support the edge runtime flag.
 */

const WIDTH = 1200;
const HEIGHT = 630;

// ds-allow: satori cannot read CSS variables; these mirror --b-500, --n-900, --n-0 in src/styles/tokens.css
const VIOLET = "#6b3df5";
// ds-allow: mirrors --n-900
const INK = "#15131d";
// ds-allow: mirrors --n-0
const WHITE = "#ffffff";
// ds-allow: soft offset sticker shadow, mirrors the sticker lift token
const LIFT = "rgba(21, 19, 29, 0.28)";
// ds-allow: muted white caption on the violet field
const ON_FIELD_MUTED = "rgba(255, 255, 255, 0.85)";

function clamp(value: string | null, max: number, fallback: string): string {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clamp(searchParams.get("title"), 90, "Your campus, in one app");
  const kicker = clamp(searchParams.get("kicker"), 32, "campusloop.space");
  const fontSize = title.length > 60 ? 56 : title.length > 32 ? 68 : 84;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: VIOLET,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: WHITE,
            color: VIOLET,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          C
        </div>
        <div style={{ display: "flex", color: WHITE, fontSize: 36, fontWeight: 700 }}>CampusLoop</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          background: WHITE,
          borderRadius: 32,
          padding: "44px 52px",
          boxShadow: `8px 14px 32px ${LIFT}`,
          transform: "rotate(-1.5deg)",
          maxWidth: 1000,
        }}
      >
        <div style={{ display: "flex", color: INK, fontSize, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
        <div style={{ display: "flex", color: VIOLET, fontSize: 26, fontWeight: 700 }}>{kicker}</div>
      </div>

      <div style={{ display: "flex", color: ON_FIELD_MUTED, fontSize: 26 }}>
        Made for college students in India
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" },
    }
  );
}
