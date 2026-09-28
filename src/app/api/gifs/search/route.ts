import { type NextRequest, NextResponse } from "next/server";

// Keep the server-side key private. The public-name fallbacks are retained for
// backwards compatibility with existing deployments.
const GIPHY_API_KEY =
  process.env.GIPHY_API_KEY || process.env.GIFY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY || "";

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const MAX_QUERY_LENGTH = 100;

function getSafeInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export async function GET(request: NextRequest) {
  if (!GIPHY_API_KEY) {
    return NextResponse.json(
      {
        gifs: [],
        error: "GIF service is not configured. Add GIPHY_API_KEY to the server environment.",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q")?.trim() || "").slice(0, MAX_QUERY_LENGTH);
  const limit = getSafeInteger(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = getSafeInteger(searchParams.get("offset"), 0, 0, 500);

  const endpoint = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(
        GIPHY_API_KEY
      )}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&rating=pg-13&lang=en`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(
        GIPHY_API_KEY
      )}&limit=${limit}&offset=${offset}&rating=pg-13`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("[GIF Search] GIPHY request failed:", res.status, res.statusText);
      return NextResponse.json(
        {
          gifs: [],
          error:
            res.status === 429
              ? "GIF service is temporarily rate-limited. Please try again in a moment."
              : "GIF service is temporarily unavailable.",
        },
        { status: res.status === 429 ? 429 : 502 }
      );
    }

    const data = (await res.json()) as {
      data?: Array<{
        id: string;
        title: string;
        images?: {
          fixed_height?: { url: string; width: string; height: string };
          fixed_height_small?: { url: string; width: string; height: string };
          original?: { url: string; width: string; height: string };
        };
      }>;
    };

    const gifs: GifItem[] = (data.data || [])
      .map((item) => {
        const width = Number.parseInt(item.images?.fixed_height?.width || "200", 10);
        const height = Number.parseInt(item.images?.fixed_height?.height || "200", 10);

        return {
          id: item.id,
          title: item.title || "Campus Reaction GIF",
          url: item.images?.fixed_height?.url || item.images?.original?.url || "",
          previewUrl:
            item.images?.fixed_height_small?.url ||
            item.images?.fixed_height?.url ||
            item.images?.original?.url ||
            "",
          width: Number.isFinite(width) && width > 0 ? width : 200,
          height: Number.isFinite(height) && height > 0 ? height : 200,
        };
      })
      .filter((gif) => Boolean(gif.url));

    return NextResponse.json(
      { gifs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[GIF Search] Error fetching from GIPHY:", error);

    return NextResponse.json(
      {
        gifs: [],
        error: "Unable to reach the GIF service. Check your connection and try again.",
      },
      { status: 502 }
    );
  }
}
