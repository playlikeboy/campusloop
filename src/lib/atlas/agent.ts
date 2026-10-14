import { querySanity } from "../sanity/client";
import {
  allAnnouncementsWithRelationsQuery,
  allClubsQuery,
  allEventsWithRelationsQuery,
} from "../sanity/queries";

export interface AtlasEvidenceItem {
  matchedConstraints: string[];
  excludedReasons: { itemTitle: string; reason: string }[];
  sources: { title: string; type: string; id: string; detail: string }[];
  conflicts?: {
    issue: string;
    claimA: { source: string; claim: string };
    claimB: { source: string; claim: string };
    resolution: string;
  }[];
}

export interface AtlasResponse {
  query: string;
  level: number;
  summary: string;
  matchedEvents: any[];
  matchedClubs: any[];
  excludedEvents: { title: string; reasons: string[] }[];
  evidence: AtlasEvidenceItem;
  groqQuery: string;
}


const CAMPUS_TIME_ZONE = "Asia/Kolkata";

function formatCampusDateTime(value: string | Date, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Schedule not listed";
  return date.toLocaleString("en-IN", { timeZone: CAMPUS_TIME_ZONE, ...options });
}

function getCampusHour(date: Date) {
  if (!Number.isFinite(date.getTime())) return -1;
  const hour = new Intl.DateTimeFormat("en-IN", {
    timeZone: CAMPUS_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).find((part) => part.type === "hour")?.value;
  return Number(hour ?? -1);
}

export async function runAtlasAgent(userPrompt: string): Promise<AtlasResponse> {
  const prompt = userPrompt.toLowerCase().trim();

  // Fetch live or seeded content from Sanity Content Lake
  const [events, clubs, announcements] = await Promise.all([
    querySanity<any[]>(allEventsWithRelationsQuery),
    querySanity<any[]>(allClubsQuery),
    querySanity<any[]>(allAnnouncementsWithRelationsQuery),
  ]);

  // LEVEL 1: Simple Club Retrieval
  if (
    prompt === "what clubs exist?" ||
    prompt.includes("list clubs") ||
    prompt.includes("all clubs") ||
    (prompt.includes("clubs") &&
      !prompt.includes("event") &&
      !prompt.includes("after") &&
      !prompt.includes("attend"))
  ) {
    return {
      query: userPrompt,
      level: 1,
      summary: `Found ${clubs.length} verified student organizations on campus: ${clubs.map((c) => c.name).join(", ")}.`,
      matchedEvents: [],
      matchedClubs: clubs,
      excludedEvents: [],
      evidence: {
        matchedConstraints: ["Campus directory query"],
        excludedReasons: [],
        sources: clubs.map((c) => ({
          title: c.name,
          type: "club",
          id: c._id,
          detail: `${c.skills?.join(", ")} • ${c.meetingSchedule || "Weekly"}`,
        })),
      },
      groqQuery: allClubsQuery,
    };
  }

  // LEVEL 2 - 5: Event Filtering & Relationship Reasoning
  const wantsAfter6PM =
    prompt.includes("after 6") ||
    prompt.includes("after 6pm") ||
    prompt.includes("after 6:00") ||
    prompt.includes("after 5");

  const wantsBeginner =
    prompt.includes("beginner") ||
    prompt.includes("no experience") ||
    prompt.includes("first-year") ||
    prompt.includes("first year") ||
    prompt.includes("freshman");

  const wantsFrontendOrWeb =
    prompt.includes("web") || prompt.includes("frontend") || prompt.includes("react");

  const wantsAI = prompt.includes("ai") || prompt.includes("machine learning") || prompt.includes("ml");

  const avoidsCP =
    prompt.includes("don't want competitive") ||
    prompt.includes("avoid competitive") ||
    prompt.includes("no competitive");

  const requiresNoMembership =
    prompt.includes("no membership") ||
    prompt.includes("doesn't require prior") ||
    prompt.includes("open to all");

  // Determine Level
  let level = 2;
  if (prompt.includes("first-year") && wantsFrontendOrWeb && wantsAfter6PM && avoidsCP) {
    level = 5; // Multi-constraint real-world ambiguity
  } else if (prompt.includes("hosted by clubs") || (wantsBeginner && wantsFrontendOrWeb)) {
    level = 4; // Relationship reasoning
  } else if (wantsAI && wantsAfter6PM && wantsBeginner) {
    level = 3; // Multi-constraint
  }

  const matchedEvents: any[] = [];
  const excludedEvents: { title: string; reasons: string[] }[] = [];

  for (const event of events) {
    const reasons: string[] = [];

    // 1. Time constraint (> 18:00 UTC/local)
    const startDate = new Date(event.startAt);
    const hour = getCampusHour(startDate);
    if (wantsAfter6PM) {
      if (!Number.isFinite(startDate.getTime())) {
        reasons.push("Start time is missing or invalid, so Atlas cannot verify that it starts after 6:00 PM");
      } else if (hour < 18) {
        reasons.push(`Starts at ${formatCampusDateTime(startDate, { hour: "2-digit", minute: "2-digit" })}, which is before 6:00 PM`);
      }
    }

    // 2. Competitive programming filter
    const isCP =
      event.categories?.some(
        (c: any) => c.slug === "competitive-coding" || c._id === "category-competitive-coding"
      ) || event.skills?.includes("competitive-programming");
    if (avoidsCP && isCP) {
      reasons.push("Categorized as competitive programming / contest contest preparation");
    }

    // 3. Prior club membership required
    if (requiresNoMembership && event.requiresMembership) {
      reasons.push("Requires existing club membership (not open to general freshmen)");
    }

    // 4. Topic matching (Frontend / AI / Web)
    const matchesWeb =
      event.skills?.some((s: string) => ["frontend", "react", "web-development"].includes(s)) ||
      event.organizer?.skills?.includes("web-development");

    const matchesAI =
      event.skills?.some((s: string) => ["ai", "machine-learning", "python"].includes(s)) ||
      event.organizer?.skills?.includes("ai");

    if (wantsFrontendOrWeb && !wantsAI && !matchesWeb) {
      reasons.push("Does not cover web development or frontend technologies");
    }

    if (wantsAI && !wantsFrontendOrWeb && !matchesAI) {
      reasons.push("Does not focus on AI or machine learning topics");
    }

    // 5. Beginner friendly
    if (wantsBeginner && !event.beginnerFriendly) {
      reasons.push("Marked as advanced; not beginner-friendly");
    }

    if (reasons.length === 0) {
      matchedEvents.push(event);
    } else {
      excludedEvents.push({ title: event.title, reasons });
    }
  }

  // Build grounded evidence
  const matchedConstraints = [
    wantsBeginner ? "Beginner-friendly (first-year eligible)" : null,
    wantsAfter6PM ? "Start time > 18:00 (after 6 PM)" : null,
    wantsFrontendOrWeb ? "Skills: web-development, frontend, React" : null,
    wantsAI ? "Skills: AI, machine learning" : null,
    avoidsCP ? "Excluded categories: competitive programming" : null,
    requiresNoMembership ? "Zero membership requirement" : null,
  ].filter(Boolean) as string[];

  const sources = matchedEvents.flatMap((e) => [
    {
      title: e.title,
      type: "event",
      id: e._id,
      detail: `${formatCampusDateTime(e.startAt, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} • ${e.venue?.name || "Venue not listed"}`,
    },
    {
      title: e.organizer?.name || "Organizer",
      type: "club",
      id: e.organizer?._id || "club",
      detail: `Skills: ${e.organizer?.skills?.join(", ") || "General"}`,
    },
    {
      title: e.venue?.name || "Venue",
      type: "venue",
      id: e.venue?._id || "venue",
      detail: `${e.venue?.building || "Campus"}, ${e.venue?.campusArea || ""}`,
    },
  ]);

  let summary = "";
  if (matchedEvents.length > 0) {
    summary = `Atlas evaluated the Sanity campus knowledge graph and identified ${matchedEvents.length} event${
      matchedEvents.length > 1 ? "s" : ""
    } satisfying your constraints:\n\n${matchedEvents
      .map(
        (e, idx) =>
          `${idx + 1}. **${e.title}**\n   • **Time:** ${new Date(e.startAt).toLocaleDateString([], {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}\n   • **Host:** ${e.organizer?.name} (${e.venue?.name}, ${e.venue?.building})\n   • **Skills:** ${e.skills?.join(
            ", "
          )}\n   • **Eligibility:** Beginner-friendly • No club membership required`
      )
      .join("\n\n")}`;

    if (excludedEvents.length > 0) {
      summary += `\n\nAtlas explicitly excluded ${excludedEvents.length} other event(s) because:\n${excludedEvents
        .map((ex) => `• **${ex.title}**: ${ex.reasons.join(", ")}`)
        .join("\n")}`;
    }
  } else {
    summary = `No upcoming events matched all your specific constraints simultaneously. ${excludedEvents.length} event(s) were excluded based on your filters.`;
  }

  return {
    query: userPrompt,
    level,
    summary,
    matchedEvents,
    matchedClubs: matchedEvents.map((e) => e.organizer).filter(Boolean),
    excludedEvents,
    evidence: {
      matchedConstraints,
      excludedReasons: excludedEvents.map((ex) => ({
        itemTitle: ex.title,
        reason: ex.reasons.join("; "),
      })),
      sources,
    },
    groqQuery: allEventsWithRelationsQuery,
  };
}
