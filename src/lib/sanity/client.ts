import { createClient } from "@sanity/client";
import { campusSeedData } from "../../../sanity/seed/campus-data";

export const isLiveSanityConfigured = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "demo-campusloop"
);

export const sanityClient = isLiveSanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2024-03-01",
      useCdn: process.env.NODE_ENV === "production",
      token: process.env.SANITY_API_READ_TOKEN,
    })
  : null;

/**
 * Fetch documents using live GROQ if configured, or fallback to the in-memory
 * seeded knowledge graph for deterministic demos and offline evaluation.
 */
export async function querySanity<T = any>(groqQuery: string, params: Record<string, any> = {}): Promise<T> {
  if (sanityClient) {
    try {
      return await sanityClient.fetch<T>(groqQuery, params);
    } catch (err) {
      console.warn("[Sanity Client] Live fetch failed, falling back to local campus seed data:", err);
    }
  }

  // Fallback simulator for offline evaluation and instant zero-config testing
  return executeMockGroq<T>(groqQuery, params);
}

function executeMockGroq<T>(query: string, params: Record<string, any>): T {
  // 1. Resolve document types
  let docs = campusSeedData;

  // Hydrate references for graph queries
  const docMap = new Map(docs.map((d) => [d._id, d]));

  const hydrated = docs.map((d) => {
    const clone = { ...d };
    if (d.organizer && typeof d.organizer === "object" && d.organizer._ref) {
      clone.organizer = docMap.get(d.organizer._ref) || clone.organizer;
    }
    if (d.venue && typeof d.venue === "object" && d.venue._ref) {
      clone.venue = docMap.get(d.venue._ref) || clone.venue;
    }
    if (d.relatedEvent && typeof d.relatedEvent === "object" && d.relatedEvent._ref) {
      clone.relatedEvent = docMap.get(d.relatedEvent._ref) || clone.relatedEvent;
    }
    if (d.relatedClub && typeof d.relatedClub === "object" && d.relatedClub._ref) {
      clone.relatedClub = docMap.get(d.relatedClub._ref) || clone.relatedClub;
    }
    return clone;
  });

  if (query.includes('_type == "club"')) {
    return hydrated.filter((d) => d._type === "club") as unknown as T;
  }
  if (query.includes('_type == "event"')) {
    return hydrated.filter((d) => d._type === "event") as unknown as T;
  }
  if (query.includes('_type == "venue"')) {
    return hydrated.filter((d) => d._type === "venue") as unknown as T;
  }
  if (query.includes('_type == "person"')) {
    return hydrated.filter((d) => d._type === "person") as unknown as T;
  }
  if (query.includes('_type == "announcement"')) {
    return hydrated.filter((d) => d._type === "announcement") as unknown as T;
  }

  return hydrated as unknown as T;
}
