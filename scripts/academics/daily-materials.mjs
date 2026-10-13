/**
 * CampusLoop Daily Academics: verify → deduplicate → index source links → report.
 * No files are mirrored or rehosted. Auto-indexed entries remain unverified.
 */
const MCP_URL = process.env.CAMPUSLOOP_ACADEMICS_MCP_URL || "https://campusloop.space/mcp/academics";
const MCP_KEY = process.env.CAMPUSLOOP_ACADEMICS_MCP_API_KEY;
const SERP_KEY = process.env.SERPAPI_API_KEY;
const MAX_NEW = Math.min(20, Math.max(1, Number(process.env.MAX_NEW_PER_RUN || 5)));
const LIMIT = 100;
const today = new Date().toISOString().slice(0, 10);
let rpcId = 1;
const created = [], duplicates = [], skipped = [], errors = [];
if (!MCP_KEY || !SERP_KEY) throw new Error("Missing CAMPUSLOOP_ACADEMICS_MCP_API_KEY or SERPAPI_API_KEY.");

async function get(url, options = {}) {
  const r = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
    ...options,
    headers: {
      "user-agent": "CampusLoopAcademicIndexer/1.0 (+https://campusloop.space/academics)",
      ...(options.headers || {}),
    },
  });
  if (!r.ok) throw new Error("HTTP " + r.status + " from " + new URL(url).hostname);
  return r;
}
function canonical(url) {
  try {
    const u = new URL(String(url || "").trim());
    if (u.protocol !== "https:") return "";
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    for (const k of [...u.searchParams.keys()]) {
      if (k.toLowerCase().startsWith("utm_") || ["ref","referrer","source","campaign","fbclid","gclid"].includes(k.toLowerCase())) u.searchParams.delete(k);
    }
    let out = u.toString();
    if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
    return out;
  } catch { return ""; }
}
function norm(s) { return String(s || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " "); }
function titleKey(x) {
  return [norm(x.title).replace(/\b(pdf|pptx?|download|free download)\b/g, " ").trim(),
    String(x.subjectCode || "").trim().toUpperCase(), norm(x.branch || "All"),
    String(x.semester || ""), String(x.resourceType || "")].join("|");
}
function trusted(url) {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return h === "openstax.org" || h.endsWith(".openstax.org") ||
      h === "ocw.mit.edu" || h.endsWith(".mit.edu") ||
      h === "nptel.ac.in" || h.endsWith(".nptel.ac.in") ||
      h === "swayam.gov.in" || h.endsWith(".swayam.gov.in") ||
      h.endsWith(".ac.in") || h.endsWith(".edu.in") || h.endsWith(".edu") || h.endsWith(".gov.in");
  } catch { return false; }
}
async function mcp(tool, args) {
  const r = await get(MCP_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "x-api-key": MCP_KEY, "mcp-protocol-version": "2024-11-05" },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name: tool, arguments: args || {} } }),
  });
  const envelope = await r.json();
  if (envelope.error) throw new Error("MCP " + tool + ": " + (envelope.error.message || JSON.stringify(envelope.error)));
  if (envelope.result && envelope.result.isError) throw new Error("MCP " + tool + ": " + (envelope.result.content || []).map((x) => x.text || "").join(" ").slice(0, 300));
  const txt = (envelope.result && envelope.result.content || []).filter((x) => x.type === "text").map((x) => x.text || "").join("\n");
  if (txt) { try { return JSON.parse(txt); } catch { return txt; } }
  return envelope.result && (envelope.result.structuredContent || envelope.result);
}
async function search(q) {
  const u = new URL("https://serpapi.com/search.json");
  u.searchParams.set("engine", "google"); u.searchParams.set("q", q); u.searchParams.set("num", "10"); u.searchParams.set("api_key", SERP_KEY);
  const r = await get(u.toString()); const d = await r.json();
  if (d.error) throw new Error(String(d.error));
  return (d.organic_results || []).map((x) => ({ title: String(x.title || ""), url: canonical(x.link), snippet: String(x.snippet || "") })).filter((x) => x.title && x.url);
}
async function restCatalogFallback() {
  const items = [];
  const first = await (await get("https://campusloop.space/api/academics?scope=global&limit=50&page=1")).json();
  if (!Array.isArray(first.items) || !Number.isFinite(Number(first.totalPages))) throw new Error("Cannot safely scan the catalog; API pagination is unavailable.");
  items.push(...first.items);
  for (let p = 2; p <= Number(first.totalPages); p += 8) {
    const pages = [];
    for (let n = p; n < Math.min(p + 8, Number(first.totalPages) + 1); n++) pages.push(n);
    const results = await Promise.all(pages.map(async (n) => {
      const d = await (await get("https://campusloop.space/api/academics?scope=global&limit=50&page=" + n)).json();
      if (!Array.isArray(d.items)) throw new Error("Invalid catalog page " + n);
      return d.items;
    }));
    for (const result of results) items.push(...result);
  }
  if (items.length < Number(first.total)) throw new Error("Catalog scan was incomplete; indexing cancelled.");
  return items;
}
async function fullCatalog() {
  const all = [], signatures = new Set();
  try {
    for (let offset = 0; offset < 250000; offset += LIMIT) {
      const data = await mcp("list_academic_resources", { limit: LIMIT, offset, resourceType: "ALL" });
      const page = Array.isArray(data) ? data : (data.items || data.resources || data.data);
      if (!Array.isArray(page)) throw new Error("Unknown MCP resource-list response shape.");
      const signature = page.map((x) => x.id || x.title || "").join("|");
      if (signature && signatures.has(signature)) throw new Error("MCP did not honor offset pagination.");
      if (signature) signatures.add(signature);
      all.push(...page);
      if (page.length < LIMIT) return { items: all, via: "MCP offset pagination" };
    }
    throw new Error("Catalog exceeds safety limit.");
  } catch (e) {
    console.warn("MCP catalog scan was not complete; using REST pagination before any publishing.");
    return { items: await restCatalogFallback(), via: "paginated Academics REST fallback (" + (e instanceof Error ? e.message : String(e)) + ")" };
  }
}
function htmlText(s) {
  return String(s || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}
function meta(html, names) {
  const wanted = new Set(names);
  for (const m of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const a = {};
    for (const x of m[0].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) a[x[1].toLowerCase()] = x[2] ?? x[3] ?? "";
    if (wanted.has((a.property || a.name || "").toLowerCase()) && a.content) return a.content;
  }
  return "";
}
function semesterOf(s) {
  const t = String(s || "");
  let m = /\b([1-8])(?:st|nd|rd|th)?\s*semester\b/i.exec(t);
  if (m) return Number(m[1]);
  m = /\bsemester\s*(?:no\.?\s*)?[:#-]?\s*([1-8])\b/i.exec(t);
  if (m) return Number(m[1]);
  m = /\bsem(?:ester)?[\s._-]*([1-8])\b/i.exec(t);
  if (m) return Number(m[1]);
  m = /\b(?:semester|sem)\s*(VIII|VII|VI|V|IV|III|II|I)\b/i.exec(t);
  if (m) return ({ I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8 })[m[1].toUpperCase()];
  return null;
}
function branchOf(s) {
  const t = String(s || "").toLowerCase();
  if (/\b(computer science|cse|information technology|software engineering)\b/.test(t)) return "Computer Science";
  if (/\b(electronics|ece|electrical and electronics)\b/.test(t)) return "ECE";
  if (/\b(electrical engineering|eee|power systems)\b/.test(t)) return "Electrical";
  if (/\b(mechanical engineering|thermodynamics|manufacturing engineering)\b/.test(t)) return "Mechanical";
  if (/\b(civil engineering|structural engineering)\b/.test(t)) return "Civil";
  return "All";
}
function subjectOf(s) {
  const pairs = [
    [/data structures?(?: and algorithms)?|\bdsa\b/i,"Data Structures and Algorithms"],
    [/database management systems?|\bdbms\b/i,"Database Management Systems"],
    [/operating systems?|\bos\b/i,"Operating Systems"], [/compiler design/i,"Compiler Design"],
    [/computer networks?/i,"Computer Networks"], [/artificial intelligence|\bAI\b/i,"Artificial Intelligence"],
    [/machine learning|\bML\b/i,"Machine Learning"], [/engineering mathematics|linear algebra|calculus/i,"Engineering Mathematics"],
    [/digital logic|logic design/i,"Digital Logic Design"], [/microprocessors?|microcontrollers?/i,"Microprocessors and Microcontrollers"],
    [/signals? and systems?|signal processing/i,"Signals and Systems"], [/programming in c|c programming/i,"Programming in C"],
    [/python|numpy|pandas/i,"Python Programming"], [/physics|electromagnetism|optics/i,"Engineering Physics"],
    [/chemistry/i,"Engineering Chemistry"], [/thermodynamics/i,"Thermodynamics"], [/control systems?/i,"Control Systems"],
  ];
  for (const [pattern, value] of pairs) if (pattern.test(String(s || ""))) return value;
  return "";
}
function courseCode(s) {
  const matches = [...String(s || "").matchAll(/\b([A-Z]{2,8}[- ]?\d{2,4}[A-Z]?)\b/g)].map((x) => x[1].replace(/[\s-]/g, "").toUpperCase());
  return matches.find((x) => !/^20\d{2}$/.test(x) && !["PDF2026","ISBN13","ISBN10"].includes(x)) || "";
}
function resourceType(s) {
  const t = String(s || "").toLowerCase();
  if (/previous year|previous question|question paper|\bpyq\b|past exam/.test(t)) return "PYQ";
  if (/lab manual|laboratory manual|lab practical/.test(t)) return "LAB_MANUAL";
  if (/formula sheet|cheat sheet|quick reference|formulae/.test(t)) return "CHEAT_SHEET";
  if (/\b(pptx?|slides|presentation)\b/.test(t)) return "PPT";
  if (/\bmodule\b|unit\s*[1-8]|chapter\s*[1-9]/.test(t)) return "MODULE";
  if (/textbook|open textbook|book chapter/.test(t)) return "BOOK";
  return "NOTES";
}
async function verify(candidate) {
  if (!trusted(candidate.url)) throw new Error("Source is not on the official education allowlist.");
  const r = await get(candidate.url, { headers: { accept: "text/html,application/xhtml+xml,application/pdf,*/*" } });
  const url = canonical(r.url || candidate.url);
  if (!url || !trusted(url)) throw new Error("Redirect left the official education allowlist.");
  const type = (r.headers.get("content-type") || "").toLowerCase();
  let title = candidate.title, description = candidate.snippet, typeText = candidate.title + " " + candidate.snippet + " " + url, pdf = false;
  if (type.includes("application/pdf") || /\.pdf(?:$|[?#])/i.test(url)) {
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength < 512) throw new Error("PDF is too small to be a plausible document.");
    pdf = true;
  } else if (type.includes("text/html") || type.includes("application/xhtml")) {
    const html = await r.text();
    if (html.length < 500) throw new Error("Source page is too short to verify.");
    const tm = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    title = htmlText(meta(html, ["og:title","twitter:title"]) || (tm ? tm[1] : "") || candidate.title);
    description = htmlText(meta(html, ["og:description","description","twitter:description"]) || candidate.snippet);
    typeText = title + " " + description + " " + htmlText(html).slice(0, 25000) + " " + url;
    if (!/\b(notes?|lecture|syllabus|semester|question paper|pyq|lab manual|course material|study material|open textbook|course content|formula sheet|module|chapter)\b/i.test(typeText)) throw new Error("Page content did not verify an academic material.");
  } else throw new Error("Unsupported source content-type " + (type || "(missing)"));
  const term = title + " " + description + " " + typeText + " " + url;
  const semester = semesterOf(term);
  if (!semester) throw new Error("Semester is not explicit; skipped instead of guessing.");
  const subjectName = subjectOf(term) || title.replace(/\s*[|·—-]\s*(PDF|notes|question paper|download).*$/i, "").trim().slice(0, 180);
  if (subjectName.length < 3) throw new Error("Unable to infer a useful subject name.");
  const code = courseCode(term) || ("OER-" + subjectName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) + "-S" + semester);
  const kind = resourceType(term);
  const branch = branchOf(term);
  const cleanTitle = title.replace(/\s+/g, " ").slice(0, 240);
  if (cleanTitle.length < 10) throw new Error("Title is not descriptive enough.");
  const body = [description && description.length > 20 ? description : "", "Semester " + semester + " " + kind.toLowerCase().replace(/_/g, " ") + " indexed from an official/public education source.", "This is a link to the original material; CampusLoop does not mirror or rehost it. Check your syllabus and follow the source site's licence and usage terms.", "Original source: " + url].filter(Boolean).join("\n\n").slice(0, 8000);
  const payload = {
    title: cleanTitle, subjectCode: code.slice(0, 64), subjectName, branch, semester, resourceType: kind,
    description: body, moduleOrChapter: "Semester " + semester + " material",
    tags: ["academic-index","source-linked","needs-community-review",kind.toLowerCase(),"semester-" + semester],
    isVerified: false,
  };
  if (pdf) payload.fileUrl = url; else payload.driveUrl = url;
  return { url, payload };
}
async function main() {
  const catalogResult = await fullCatalog(), catalog = catalogResult.items;
  const urlSet = new Set(), titles = new Set();
  for (const item of catalog) {
    for (const value of [item.fileUrl,item.driveUrl,...(Array.isArray(item.attachments) ? item.attachments.map((x) => x.url) : [])]) {
      const u = canonical(value); if (u) urlSet.add(u);
    }
    titles.add(titleKey(item));
  }

  const queries = [
    "site:bitmesra.ac.in/uploadeddocuments/adminexam/files PDF semester question paper",
    "site:bitmesra.ac.in/uploadeddocuments PDF semester lab manual lecture notes",
    "site:ac.in filetype:pdf \"previous year question paper\" semester engineering",
    "site:ac.in filetype:pdf semester \"lab manual\" engineering",
    "site:edu.in filetype:pdf semester question paper computer science",
    "site:ac.in \"course code\" \"semester\" computer science notes pdf",
    "site:openstax.org/books open textbook university semester",
    "site:ocw.mit.edu/courses course notes semester",
    "site:nptel.ac.in semester course material notes pdf",
    "site:swayam.gov.in engineering semester course notes pdf",
  ];
  const found = new Map();
  for (const query of queries) {
    try {
      for (const item of await search(query)) if (trusted(item.url) && !found.has(item.url)) found.set(item.url, item);
    } catch (e) { errors.push({ candidate: query, reason: e instanceof Error ? e.message : String(e) }); }
  }

  for (const candidate of found.values()) {
    if (created.length >= MAX_NEW) break;
    const url = canonical(candidate.url);
    if (!url) { skipped.push({ title: candidate.title, url: candidate.url, reason: "Not HTTPS." }); continue; }
    if (urlSet.has(url)) { duplicates.push({ title: candidate.title, url, reason: "Canonical URL exists in catalog." }); continue; }
    try {
      const result = await verify(candidate);
      const key = titleKey(result.payload);
      if (titles.has(key)) { duplicates.push({ title: result.payload.title, url, reason: "Normalized title/course/branch/semester/type exists." }); continue; }
      const response = await mcp("create_academic_resource", result.payload);
      if (response && response.duplicate === true) {
        duplicates.push({ title: result.payload.title, url, reason: "MCP create returned duplicate; nothing was inserted." });
        continue;
      }
      const resource = response && (response.resource || response.data && response.data.resource);
      if (!resource || !resource.id) {
        errors.push({ candidate: result.payload.title, source: url, reason: "No returned resource ID; publication not counted." });
        continue;
      }
      const campusUrl = resource.publicUrl || "https://campusloop.space/academics/" + resource.id;
      created.push({ title: resource.title || result.payload.title, campusUrl, sourceUrl: url, subjectCode: result.payload.subjectCode, subjectName: result.payload.subjectName, semester: result.payload.semester, resourceType: result.payload.resourceType });
      urlSet.add(url); titles.add(key);
    } catch (e) { skipped.push({ title: candidate.title, url, reason: e instanceof Error ? e.message : String(e) }); }
  }

  const report = [
    "# CampusLoop Daily Academic Materials",
    "",
    "Run date: " + today + " (UTC)",
    "",
    "- Catalog records checked: " + catalog.length + " (" + catalogResult.via + ")",
    "- Search candidates found: " + found.size,
    "- Newly indexed: " + created.length,
    "- Duplicates skipped: " + duplicates.length,
    "- Quality/eligibility skips: " + skipped.length,
    "- Errors requiring attention: " + errors.length,
    "- Every automatically indexed material is **unverified pending curator review**.",
    "",
    "## Newly indexed",
    ...(created.length ? created.map((x) => "- [" + x.title + "](" + x.campusUrl + ") — " + x.subjectName + " (" + x.subjectCode + "), Semester " + x.semester + ", " + x.resourceType + "; [official source](" + x.sourceUrl + ")") : ["- No materials passed every verification and deduplication check this run."]),
    "",
    "## Duplicates",
    ...(duplicates.length ? duplicates.map((x) => "- " + x.title + ": " + x.reason + " — " + x.url) : ["- None."]),
    "",
    "## Skipped",
    ...(skipped.length ? skipped.map((x) => "- " + x.title + ": " + x.reason + " — " + x.url) : ["- None."]),
    "",
    "## Errors",
    ...(errors.length ? errors.map((x) => "- " + x.candidate + ": " + x.reason + (x.source ? " — " + x.source : "")) : ["- None."]),
    "",
    "## Safeguards",
    "- Only allowlisted official universities/governments and selected open-education hosts; each link is fetched directly.",
    "- Requires explicit semester context; never invents semester, course-code, or licensing facts.",
    "- Normalized canonical URLs and course/title keys are checked against the full catalog before publishing.",
    "- Placeholder/demo URLs and unverified, broken or irrelevant source pages are rejected.",
    "- Content is linked, never mirrored or rehosted; follow original licence and terms.",
  ].join("\n") + "\n";

  const fs = await import("node:fs/promises");
  await fs.writeFile("academic-material-report.md", report, "utf8");
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, report + "\n", "utf8");
  console.log(JSON.stringify({ runDate: today, catalogRecordsChecked: catalog.length, catalogSource: catalogResult.via, searchCandidates: found.size, created, duplicateCount: duplicates.length, skippedCount: skipped.length, errors }, null, 2));
}
main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; });