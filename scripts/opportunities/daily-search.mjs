/**
 * CampusLoop Daily Opportunities
 *
 * Discover → open-source verification → deduplicate → publish → report.
 * This intentionally fails closed: search snippets alone never qualify an item
 * for publication; the source page must be fetched and provide a future deadline.
 */
const MCP_URL = process.env.CAMPUSLOOP_MCP_URL || "https://campusloop.space/mcp/events";
const MCP_KEY = process.env.CAMPUSLOOP_MCP_API_KEY;
const SERP_KEY = process.env.SERPAPI_API_KEY;
const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);
const added = [];
const postersUpdated = [];
const duplicates = [];
const skipped = [];
const failures = [];
let rpcId = 1;

if (!MCP_KEY || !SERP_KEY) {
  console.error("Missing required credential(s): CAMPUSLOOP_MCP_API_KEY and SERPAPI_API_KEY.");
  process.exit(1);
}

function normalize(value = "") {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’'‘]/g, "")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
function canonicalUrl(value = "") {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|ref|referrer|source|campaign)$/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, "");
  } catch { return ""; }
}
function safeText(value = "") {
  return String(value).replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
async function get(url, headers = {}) {
  const response = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(20000) });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${new URL(url).hostname}`);
  return { url: response.url || url, text, contentType: response.headers.get("content-type") || "" };
}
async function mcpCall(name, args = {}) {
  const response = await fetch(MCP_URL, {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "x-api-key": MCP_KEY,
      "mcp-protocol-version": "2024-11-05",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name, arguments: args } }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`CampusLoop MCP HTTP ${response.status}`);
  let envelope;
  try { envelope = JSON.parse(raw); } catch { throw new Error("MCP response was not JSON"); }
  if (envelope.error) throw new Error(`MCP ${name} failed: ${JSON.stringify(envelope.error)}`);
  if (envelope.result?.isError) throw new Error(`MCP ${name} failed: ${(envelope.result.content || []).map((x) => x.text || "").join(" ").slice(0, 300)}`);
  const text = (envelope.result?.content || []).filter((x) => x.type === "text").map((x) => x.text || "").join("\n");
  if (text) { try { return JSON.parse(text); } catch { return text; } }
  return envelope.result?.structuredContent ?? envelope.result;
}
async function googleSearch(query) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", SERP_KEY);
  url.searchParams.set("num", "10");
  const result = await get(url.toString());
  const payload = JSON.parse(result.text);
  if (payload.error) throw new Error(payload.error);
  return (payload.organic_results || []).map((item) => ({
    title: item.title || "",
    link: canonicalUrl(item.link || ""),
    snippet: item.snippet || "",
  })).filter((item) => item.title && item.link);
}
function pickMeta(html, name) {
  const target = name.toLowerCase();
  for (const tagMatch of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = {};
    for (const attr of tagMatch[0].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? "";
    }
    if ((attrs.name || attrs.property || "").toLowerCase() === target) return attrs.content || "";
  }
  return "";
}

function extractPosterImage(html, pageUrl, jsonLd) {
  const candidates = [
    pickMeta(html, "og:image"),
    pickMeta(html, "og:image:url"),
    pickMeta(html, "twitter:image"),
    pickMeta(html, "twitter:image:src"),
  ];
  const addJsonLdImage = (value) => {
    if (Array.isArray(value)) {
      for (const entry of value) addJsonLdImage(entry);
    } else if (typeof value === "string") {
      candidates.push(value);
    } else if (value && typeof value === "object") {
      if (typeof value.url === "string") candidates.push(value.url);
      if (typeof value.contentUrl === "string") candidates.push(value.contentUrl);
    }
  };
  addJsonLdImage(jsonLd?.image);

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    try {
      const parsed = new URL(candidate.trim(), pageUrl);
      if (parsed.protocol !== "https:" || !parsed.hostname) continue;
      if (/\/(?:favicon|apple-touch-icon)(?:[-.]|$)/i.test(parsed.pathname)) continue;
      return parsed.toString();
    } catch { /* Skip malformed metadata and try the next candidate. */ }
  }
  return null;
}

function monthNumber(value) {
  return ({ jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 })[String(value || "").toLowerCase().slice(0, 3)] || 0;
}
function dayDate(year, month, day) {
  const y = Number(year), m = Number(month), d = Number(day);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const value = new Date(Date.UTC(y, m - 1, d) - 330 * 60 * 1000);
  return Number.isFinite(value.getTime()) ? value : null;
}
function localDayKey(date) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function sourceOffset(context, sourceUrl) {
  const value = (String(context || "") + " " + String(sourceUrl || "")).toLowerCase();
  if (/jst|japan standard time|utc\s*\+\s*0?9|gmt\s*\+\s*0?9/.test(value)) return "+09:00";
  if (/pdt|pacific daylight time|utc\s*-\s*0?7|gmt\s*-\s*0?7/.test(value)) return "-07:00";
  if (/pst|pacific standard time|utc\s*-\s*0?8|gmt\s*-\s*0?8/.test(value)) return "-08:00";
  if (/edt|eastern daylight time|utc\s*-\s*0?4|gmt\s*-\s*0?4/.test(value)) return "-04:00";
  if (/est|eastern standard time|utc\s*-\s*0?5|gmt\s*-\s*0?5/.test(value)) return "-05:00";
  if (/utc|gmt/.test(value) && !/utc\s*[+-]\s*\d/.test(value)) return "+00:00";
  return "+05:30";
}
function parseExplicitDate(text, sourceUrl = "") {
  const patterns = [
    /(?:registration|application|submission|entry|applications?)\s+(?:deadline|closes|close|ends|end date|last date)[^\n.;]{0,160}?(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+(20\d{2})/i,
    /(?:registration|application|submission|entry|applications?)\s+(?:deadline|closes|close|ends|end date|last date)[^\n.;]{0,160}?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})/i,
    /(?:last date|closing date|deadline|last day)[^\n.;]{0,160}?(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+(20\d{2})/i,
    /(?:last date|closing date|deadline|last day)[^\n.;]{0,160}?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})/i,
    /(?:last date|closing date|deadline|applications? close)[^\n.;]{0,140}?(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/i,
    /(?:last date|closing date|deadline|applications? close)[^\n.;]{0,140}?(20\d{2}-\d{2}-\d{2})/i,
  ];
  for (let index = 0; index < patterns.length; index++) {
    const match = patterns[index].exec(text);
    if (!match) continue;
    let year, month, day;
    if (index === 0 || index === 2) {
      day = Number(match[1]); month = monthNumber(match[2]); year = Number(match[3]);
    } else if (index === 1 || index === 3) {
      month = monthNumber(match[1]); day = Number(match[2]); year = Number(match[3]);
    } else if (index === 4) {
      day = Number(match[1]); month = Number(match[2]); year = Number(match[3]);
    } else {
      const parts = match[1].split("-");
      year = Number(parts[0]); month = Number(parts[1]); day = Number(parts[2]);
    }
    if (!year || !month || !day) continue;
    const context = text.slice(Math.max(0, match.index - 40), Math.min(text.length, match.index + match[0].length + 140));
    const offset = sourceOffset(context, sourceUrl);
    const timeMatch = context.slice(Math.max(0, context.indexOf(match[0]) + match[0].length)).match(/\b(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\b/i);
    let hour = 23, minute = 59, second = 59;
    if (timeMatch) {
      hour = Number(timeMatch[1]); minute = Number(timeMatch[2]); second = 0;
      if (timeMatch[3]) {
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === "PM" && hour < 12) hour += 12;
        if (meridiem === "AM" && hour === 12) hour = 0;
      }
    }
    const dateText = String(year).padStart(4, "0") + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    const timeText = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0") + ":" + String(second).padStart(2, "0");
    const date = new Date(dateText + "T" + timeText + offset);
    if (Number.isFinite(date.getTime())) return date;
  }
  return null;
}
function parseDateList(text) {
  const dates = new Map();
  const add = (year, month, day) => {
    const parsed = dayDate(year, month, day);
    if (parsed) dates.set(localDayKey(parsed), parsed);
  };
  for (const match of text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) add(match[1], match[2], match[3]);
  const month = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const dayFirst = new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+" + month + "[,\\s]+(20\\d{2})\\b", "gi");
  const monthFirst = new RegExp("\\b" + month + "\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})\\b", "gi");
  for (const match of text.matchAll(dayFirst)) add(match[3], monthNumber(match[2]), match[1]);
  for (const match of text.matchAll(monthFirst)) add(match[4], monthNumber(match[1]), match[2]);
  for (const match of text.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/g)) add(match[3], match[2], match[1]);
  return [...dates.values()].sort((a, b) => a - b);
}
function parseStartEnd(text, deadline, jsonLd) {
  const startLd = jsonLd?.startDate ? new Date(jsonLd.startDate) : null;
  const endLd = jsonLd?.endDate ? new Date(jsonLd.endDate) : null;
  let start = startLd && Number.isFinite(startLd.getTime()) ? startLd : null;
  let end = endLd && Number.isFinite(endLd.getTime()) ? endLd : null;
  const dates = parseDateList(text);
  const deadlineKey = deadline ? localDayKey(deadline) : null;
  const nonDeadlineDates = dates.filter((date) => localDayKey(date) !== deadlineKey);
  const todayKey = new Date(NOW.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nearFuture = nonDeadlineDates.filter((date) => localDayKey(date) >= todayKey);
  if (!start) start = nearFuture[0] || nonDeadlineDates[0] || null;
  if (!end && start) {
    const startKey = localDayKey(start);
    const endCandidates = nonDeadlineDates.filter((date) => localDayKey(date) >= startKey && date.getTime() - start.getTime() <= 210 * 86400000);
    end = endCandidates.at(-1) || start;
    if (end.getUTCHours() === 18 && end.getUTCMinutes() === 30 && end.getUTCSeconds() === 0) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1000);
    }
  }
  if (!start && deadline && /internship|job|scholarship|fellowship|grant|research program|graduate program/.test(text.toLowerCase())) {
    const localToday = new Date(NOW.getTime() + 5.5 * 60 * 60 * 1000);
    start = dayDate(localToday.getUTCFullYear(), localToday.getUTCMonth() + 1, localToday.getUTCDate());
  }
  if (!end && deadline && start) end = deadline;
  if (start && end && end < start) end = start;
  return { start, end };
}

function inferCategory(text) {
  const lower = text.toLowerCase();
  if (/scholarship|tuition support/.test(lower)) return "SCHOLARSHIP";
  if (/fellowship/.test(lower)) return "FELLOWSHIP";
  if (/internship|intern programme|intern program/.test(lower)) return "INTERNSHIP";
  if (/graduate role|entry level job|hiring challenge|job opening|careers? opportunity/.test(lower)) return "JOB";
  if (/grant|funding call|research funding/.test(lower)) return "GRANT";
  if (/hackathon|hack day|buildathon/.test(lower)) return "HACKATHON";
  if (/workshop|bootcamp|masterclass|global hack week/.test(lower)) return "WORKSHOP";
  if (/case competition|case challenge|pitch competition|business plan/.test(lower)) return "COMPETITION";
  if (/contest|quiz|olympiad|coding challenge/.test(lower)) return "CONTEST";
  if (/conference|summit|seminar|symposium/.test(lower)) return "SEMINAR";
  if (/cultural fest|college fest|festival/.test(lower)) return "FEST";
  if (/sports tournament|chess tournament|football tournament/.test(lower)) return "SPORTS";
  if (/meetup|networking event/.test(lower)) return "MEETUP";
  return "COMPETITION";
}
function inferMode(text) {
  const lower = text.toLowerCase();
  if (/hybrid|online round.{0,70}offline|offline final|in.person final|physical finale/.test(lower)) return "HYBRID";
  if (/in.person|offline venue|campus venue|physical hackathon/.test(lower)) return "OFFLINE";
  return "ONLINE";
}
function parseJsonLd(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const value = JSON.parse(match[1]);
      const items = Array.isArray(value) ? value : Array.isArray(value["@graph"]) ? value["@graph"] : [value];
      const event = items.find((item) => item && (item["@type"] === "Event" || item["@type"] === "EducationEvent" || item.startDate));
      if (event) return event;
    } catch { /* Invalid/partial JSON-LD, use safe fallback text rules. */ }
  }
  return null;
}
function trustedListingHost(url) {
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  return host === "unstop.com" || host.endsWith(".unstop.com") ||
    host === "devfolio.co" || host.endsWith(".devfolio.co") ||
    host === "events.mlh.com" || host === "ghw.mlh.com" ||
    host === "hack2skill.com" || host.endsWith(".hack2skill.com") ||
    host.endsWith(".edu") || host.endsWith(".ac.in") ||
    host === "developers.google.com" || host === "ethindia.co" ||
    host === "licindia.in" || host.endsWith(".licindia.in") ||
    host === "oist.jp" || host.endsWith(".oist.jp") ||
    host === "isro.gov.in" || host.endsWith(".isro.gov.in") ||
    host === "apps.lpsc.gov.in";
}
function hasClosedSignal(text) {
  return /registration closed|applications are closed|applications closed|deadline has passed|registration has ended|not accepting applications|event has ended/i.test(text);
}

const queries = [
  "site:unstop.com/hackathons 2026 registration deadline October November student hackathon",
  "site:unstop.com/competitions 2026 registration deadline student contest case competition",
  "site:unstop.com/competitions registration deadline October 2026",
  "site:unstop.com/internships OR site:unstop.com/jobs OR site:unstop.com/scholarships 2026 student applications open",
  "site:oist.jp/admissions/research-internship Spring 2027 application deadline",
  "site:web.licindia.in/golden-jubilee-foundation scholarship 2026 application deadline",
  "site:apps.lpsc.gov.in/commonC/advt.jsp 2026 Scientist Engineer recruitment deadline",
  "site:devfolio.co/hackathons open hackathon India October November 2026",
  "site:events.mlh.com/events 2026 hackathon student registration",
  "site:hack2skill.com 2026 hackathon challenge student registration",
  "official student scholarship fellowship research grant application deadline October November 2026 India",
];
const candidateMap = new Map();
for (const query of queries) {
  try {
    for (const result of await googleSearch(query)) {
      const host = new URL(result.link).hostname;
      if (!trustedListingHost(result.link)) continue;
      if (!/(unstop|devfolio|mlh\.com|hack2skill|\.edu|\.ac\.in|developers\.google\.com|ethindia\.co)/i.test(host)) continue;
      if (!candidateMap.has(result.link)) candidateMap.set(result.link, result);
    }
  } catch (error) {
    failures.push({ title: query, reason: `Search error: ${error.message}` });
  }
}

const listed = await mcpCall("list_events", { limit: 100, mode: "ALL", category: "ALL" });
const catalog = Array.isArray(listed) ? listed : listed?.events || listed?.data || [];
const liveCatalog = catalog.filter((item) => String(item.status || "PUBLISHED").toUpperCase() === "PUBLISHED");
const existingUrls = new Set(liveCatalog.map((event) => canonicalUrl(event.externalUrl || event.registrationUrl || event.meetingUrl || "")).filter(Boolean));
const existingTitles = liveCatalog.map((event) => ({
  id: event.id,
  title: normalize(event.title),
  organizer: normalize(event.clubName || ""),
  start: event.startDate ? new Date(event.startDate).getTime() : null,
  url: canonicalUrl(event.externalUrl || event.registrationUrl || event.meetingUrl || ""),
}));

const reportRows = [];
// Enrich existing published records that have a trusted official URL but no poster.
// Only allowlist-approved source hosts are fetched; anything else keeps its category gradient.
for (const event of liveCatalog.filter((item) => !item.bannerUrl && (item.externalUrl || item.registrationUrl)).slice(0, 40)) {
  const sourceUrl = canonicalUrl(event.externalUrl || event.registrationUrl || "");
  if (!sourceUrl || !trustedListingHost(sourceUrl)) continue;
  try {
    const page = await get(sourceUrl, {
      "user-agent": "CampusLoopOpportunityBot/1.0 (+https://campusloop.space/events)",
      accept: "text/html,application/xhtml+xml",
    });
    const jsonLd = parseJsonLd(page.text);
    const posterImageUrl = extractPosterImage(page.text, page.url, jsonLd);
    if (!posterImageUrl) continue;
    await mcpCall("update_event", { idOrSlug: event.id || event.slug, bannerUrl: posterImageUrl });
    event.bannerUrl = posterImageUrl;
    postersUpdated.push({
      title: event.title,
      campusUrl: event.publicUrl || (event.slug ? "https://campusloop.space/events/" + event.slug : ""),
      posterUrl: posterImageUrl,
    });
  } catch (error) {
    failures.push({ title: event.title || "Existing event poster", source: sourceUrl, reason: "Poster enrichment failed: " + error.message });
  }
}

for (const candidate of candidateMap.values()) {
  const canonical = candidate.link;
  if (existingUrls.has(canonical)) {
    duplicates.push({ title: candidate.title, url: canonical, reason: "Canonical URL already exists" });
    continue;
  }
  try {
    const page = await get(canonical, {
      "user-agent": "CampusLoopOpportunityBot/1.0 (+https://campusloop.space/events)",
      accept: "text/html,application/xhtml+xml",
    });
    const title = safeText(pickMeta(page.text, "og:title") || (page.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || candidate.title);
    const description = safeText(pickMeta(page.text, "og:description") || pickMeta(page.text, "description"));
    const jsonLd = parseJsonLd(page.text);
    const posterImageUrl = extractPosterImage(page.text, page.url, jsonLd);
    const body = safeText(page.text).slice(0, 50000);
    const sourceText = `${title}\n${description}\n${body}\n${candidate.snippet}`;
    if (!trustedListingHost(page.url)) {
      skipped.push({ title, url: canonical, reason: "Redirected to an untrusted host" });
      continue;
    }
    if (hasClosedSignal(sourceText)) {
      skipped.push({ title, url: canonical, reason: "Source indicates registration is closed" });
      continue;
    }
    const deadline = parseExplicitDate(sourceText, canonical);
    if (!deadline || deadline <= NOW) {
      skipped.push({ title, url: canonical, reason: "No verifiable future deadline on fetched source page" });
      continue;
    }
    const { start, end } = parseStartEnd(sourceText, deadline, jsonLd);
    if (!start || !end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      skipped.push({ title, url: canonical, reason: "Could not verify event/application window from source page" });
      continue;
    }
    const cleanTitle = title.replace(/\s*[|–-]\s*(Unstop|Devfolio|MLH).*/i, "").trim();
    if (cleanTitle.length < 10 || cleanTitle.length > 180) {
      skipped.push({ title, url: canonical, reason: "Title is not sufficiently descriptive" });
      continue;
    }
    if (description.length < 90) {
      skipped.push({ title: cleanTitle, url: canonical, reason: "Source description is too short to produce a useful listing" });
      continue;
    }
    const titleKey = normalize(cleanTitle);
    const organizerText = safeText((sourceText.match(/(?:organis(?:er|ed by|ing organization)|host(?:ed by)?|presented by)\s*[:—-]?\s*([^.;\n]{3,90})/i) || [])[1] || new URL(canonical).hostname);
    const organizerKey = normalize(organizerText);
    const duplicate = existingTitles.find((item) =>
      item.title === titleKey ||
      (item.organizer === organizerKey && item.start && Math.abs(item.start - start.getTime()) < 45 * 86400000)
    );
    if (duplicate) {
      duplicates.push({ title: cleanTitle, url: canonical, reason: `Similar existing listing: ${duplicate.id}` });
      continue;
    }

    const category = inferCategory(`${cleanTitle} ${description} ${sourceText.slice(0, 1500)}`);
    const mode = inferMode(sourceText);
    const deadlineLabel = deadline.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    const seoDescription = [
      description,
      `Application deadline: ${deadlineLabel} (IST).`,
      `Official source and registration: ${canonical}`,
      "Check the official organizer page for eligibility, submission rules, fees and timeline changes before applying.",
    ].join("\n\n").slice(0, 5000);
    const tagline = `${category.charAt(0)}${category.slice(1).toLowerCase()} opportunity · Apply by ${deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}`;
    const created = await mcpCall("create_remote_event", {
      title: cleanTitle,
      tagline,
      description: seoDescription,
      clubName: organizerText.slice(0, 120) || new URL(canonical).hostname,
      eventType: category,
      mode,
      venue: mode === "ONLINE" ? "Online — check official listing" : "Check the official organizer listing",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      registrationDeadline: deadline.toISOString(),
      externalUrl: canonical,
      ...(posterImageUrl ? { bannerUrl: posterImageUrl } : {}),
      status: "PUBLISHED",
      isPaid: /entry fee|registration fee|paid registration/i.test(sourceText) && !/free (?:to|for) (?:register|participate|apply)/i.test(sourceText),
      entryFee: /free (?:to|for) (?:register|participate|apply)|no application fee/i.test(sourceText) ? "Free" : "Check official listing",
      perks: ["Official application link", "Student opportunity discovery"],
      loopPointsReward: 30,
    });
    const record = created?.event || created?.data?.event || created;
    const campusUrl = record.publicUrl || record.eventUrl || (record.slug ? `https://campusloop.space/events/${record.slug}` : "");
    if (!campusUrl) {
      failures.push({ title: cleanTitle, reason: "MCP returned success without a public URL; verify manually", source: canonical });
      continue;
    }
    existingUrls.add(canonical);
    existingTitles.push({ id: record.id || "new", title: titleKey, organizer: organizerKey, start: start.getTime(), url: canonical });
    added.push({ title: cleanTitle, campusUrl, sourceUrl: canonical, deadline: deadlineLabel, category, posterUrl: posterImageUrl || null });
    reportRows.push(`- [${cleanTitle}](${campusUrl}) — deadline ${deadlineLabel}; [official source](${canonical}); ${posterImageUrl ? `[source poster](${posterImageUrl})` : "category gradient artwork (no source poster found)"}`);
  } catch (error) {
    failures.push({ title: candidate.title, source: canonical, reason: error.message });
  }
}

const summary = [
  "# CampusLoop daily opportunity discovery",
  `Run date: ${TODAY} (UTC; deadlines shown in IST)`,
  "",
  `- Newly published: **${added.length}**`,
  `- Existing event posters added: **${postersUpdated.length}**`,
  `- Skipped as duplicate: **${duplicates.length}**`,
  `- Skipped by quality/deadline checks: **${skipped.length}**`,
  `- Errors requiring attention: **${failures.length}**`,
  "",
  "## Published this run",
  ...(reportRows.length ? reportRows : ["- No new listings met all verification and SEO-quality checks."]),
  "",
  "## Existing posters added",
  ...(postersUpdated.length ? postersUpdated.map((x) => `- [${x.title}](${x.campusUrl || "https://campusloop.space/events"}) — [poster image](${x.posterUrl})`) : ["- No existing source posters were found on trusted pages during this run. Category gradients remain as the fallback."]),
  "",
  "## Duplicate candidates",
  ...(duplicates.length ? duplicates.map((x) => `- ${x.title}: ${x.reason} — ${x.url}`) : ["- None."]),
  "",
  "## Skipped candidates",
  ...(skipped.length ? skipped.map((x) => `- ${x.title}: ${x.reason} — ${x.url}`) : ["- None."]),
  "",
  "## Errors",
  ...(failures.length ? failures.map((x) => `- ${x.title}: ${x.reason || "unknown error"} ${x.source ? `— ${x.source}` : ""}`) : ["- None."]),
  "",
  "## SEO and data quality",
  "- Unique descriptive title; natural keywords from the official page; no keyword stuffing.",
  "- Description preserves source facts and includes the application deadline in IST plus the canonical source link.",
  "- Canonical URLs have tracking parameters removed for duplicate detection.",
  "- Candidates without a fetched source, verified future deadline, adequate description or non-duplicate title are not published.",
].join("\n");
await (await import("node:fs/promises")).writeFile("opportunity-report.md", summary + "\n", "utf8");
if (process.env.GITHUB_STEP_SUMMARY) {
  await (await import("node:fs/promises")).appendFile(process.env.GITHUB_STEP_SUMMARY, summary + "\n", "utf8");
}
console.log(JSON.stringify({
  runDate: TODAY,
  discovered: candidateMap.size,
  published: added,
  postersUpdated,
  duplicateCount: duplicates.length,
  skippedCount: skipped.length,
  failures,
}, null, 2));
