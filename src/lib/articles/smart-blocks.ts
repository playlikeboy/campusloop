/**
 * Smart blocks: CampusLoop's take on ChatGPT's Intelligent UI for articles.
 *
 * A smart block is a fenced code block whose language is a block type:
 *
 *   ```chart
 *   type: bar
 *   title: Placement offers by branch
 *   source: Placement cell, 2026
 *   label, offers
 *   CSE, 142
 *   ECE, 96
 *   ```
 *
 * Why fences: they survive copy-paste, the TipTap editor, turndown, RSS and
 * llms.txt untouched, and degrade to readable text anywhere smart rendering is
 * unavailable. Every block accepts a forgiving plain-text format (easy to type
 * or paste) and most also accept JSON (precise, for MCP agents).
 *
 * This module is pure (no React) so the renderer, editor, MCP server and tests
 * share one parser and one validator.
 */

import { parseStart } from "./article-embeds";

export const SMART_BLOCK_TYPES = [
  "chart",
  "table",
  "comparison",
  "timeline",
  "steps",
  "callout",
  "stats",
  "calculator",
  "quiz",
  "faq",
  "embed",
] as const;

export type SmartBlockType = (typeof SMART_BLOCK_TYPES)[number];

export function isSmartBlockType(lang: string): lang is SmartBlockType {
  return (SMART_BLOCK_TYPES as readonly string[]).includes(lang.trim().toLowerCase());
}

export interface ChartBlock {
  kind: "chart";
  chartType: "bar" | "line" | "area" | "pie";
  title?: string;
  unit?: string;
  source?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
}
export interface TableBlock {
  kind: "table";
  title?: string;
  source?: string;
  headers: string[];
  rows: string[][];
}
export interface ComparisonBlock {
  kind: "comparison";
  title?: string;
  options: { name: string; summary?: string; pros: string[]; cons: string[]; bestFor?: string }[];
  verdict?: string;
}
export interface TimelineBlock {
  kind: "timeline";
  title?: string;
  items: { when: string; title: string; detail?: string }[];
}
export interface StepsBlock {
  kind: "steps";
  title?: string;
  steps: string[];
}
export interface CalloutBlock {
  kind: "callout";
  tone: "info" | "tip" | "warning" | "success";
  title?: string;
  text: string;
}
export interface StatsBlock {
  kind: "stats";
  title?: string;
  source?: string;
  items: { value: string; label: string; hint?: string }[];
}
export interface CalculatorBlock {
  kind: "calculator";
  title?: string;
  inputs: { id: string; label: string; default: number; min?: number; max?: number; step?: number; unit?: string }[];
  outputs: { label: string; formula: string; unit?: string; decimals?: number }[];
  note?: string;
}
export interface QuizBlock {
  kind: "quiz";
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}
export interface FaqBlock {
  kind: "faq";
  title?: string;
  items: { q: string; a: string }[];
}

export interface EmbedBlock {
  kind: "embed";
  urls: string[];
  caption?: string;
  start?: number;
  height?: number;
}

export type SmartBlock =
  | ChartBlock
  | TableBlock
  | ComparisonBlock
  | TimelineBlock
  | StepsBlock
  | CalloutBlock
  | StatsBlock
  | CalculatorBlock
  | QuizBlock
  | FaqBlock
  | EmbedBlock;

export type ParseResult = { ok: true; block: SmartBlock } | { ok: false; error: string };

const HEADER_KEYS = new Set(["type", "title", "unit", "source", "tone", "verdict", "note", "caption", "start", "height"]);

/** Leading `key: value` lines (known keys only) and the remaining body lines. */
function splitHeader(body: string): { meta: Record<string, string>; lines: string[] } {
  const all = body.replace(/\r\n?/g, "\n").split("\n");
  const meta: Record<string, string> = {};
  let i = 0;
  for (; i < all.length; i++) {
    const m = all[i].match(/^\s*([a-zA-Z]+)\s*:\s*(.+)$/);
    if (!m || !HEADER_KEYS.has(m[1].toLowerCase())) break;
    meta[m[1].toLowerCase()] = m[2].trim();
  }
  return { meta, lines: all.slice(i).filter((l) => l.trim() !== "") };
}

function tryJson(body: string): Record<string, unknown> | null {
  const t = body.trim();
  if (!t.startsWith("{")) return null;
  try {
    const v = JSON.parse(t);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);

/** Parses "1,234.5", "₹12 LPA", "45%" into a number. */
export function toNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,₹$€£%\s]|LPA|lpa|k$/g, "");
  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** CSV split with "quoted, cells" support. */
function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      cells.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

/**
 * Unquoted "1,20,000" or "12,500" splits into digit groups; when a row has more
 * cells than the header, re-join groups that can only be thousands separators.
 */
function mergeDigitGroups(cells: string[], width: number): string[] {
  const out = [...cells];
  for (let i = out.length - 1; i > 0 && out.length > width; i--) {
    if (/^\d{2,3}(,\d{2,3})*(\.\d+)?%?$/.test(out[i]) && /\d$/.test(out[i - 1])) {
      out.splice(i - 1, 2, `${out[i - 1]},${out[i]}`);
    }
  }
  return out;
}

function splitCells(line: string, sep: "," | "|"): string[] {
  let l = line.trim();
  if (sep === ",") return splitCsv(l);
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|")) l = l.slice(0, -1);
  return l.split(sep).map((c) => c.trim());
}

const isDivider = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

function parseGrid(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;
  const sep: "," | "|" = lines[0].includes("|") ? "|" : ",";
  const body = lines.filter((l) => !isDivider(l));
  const headers = splitCells(body[0], sep);
  const rows = body.slice(1).map((l) => (sep === "," ? mergeDigitGroups(splitCells(l, sep), headers.length) : splitCells(l, sep)));
  if (headers.length < 2 || rows.length === 0) return null;
  return { headers, rows: rows.map((r) => headers.map((_, i) => r[i] ?? "")) };
}

function parseChart(body: string): ParseResult {
  const json = tryJson(body);
  const allowed = ["bar", "line", "area", "pie"] as const;
  if (json) {
    const chartType = allowed.find((t) => t === json.type) ?? "bar";
    let labels: string[] = [];
    let series: { name: string; values: number[] }[] = [];
    if (Array.isArray(json.data)) {
      const data = json.data as Record<string, unknown>[];
      labels = data.map((d) => String(d.label ?? d.name ?? ""));
      const keys = Object.keys(data[0] ?? {}).filter((k) => k !== "label" && k !== "name");
      series = keys.map((k) => ({ name: k, values: data.map((d) => Number(d[k])) }));
    } else {
      labels = strArr(json.labels);
      series = (Array.isArray(json.series) ? json.series : []).map((s: Record<string, unknown>) => ({
        name: String(s.name ?? "Series"),
        values: (Array.isArray(s.values) ? s.values : []).map(Number),
      }));
    }
    return finishChart({ chartType, title: str(json.title), unit: str(json.unit), source: str(json.source), labels, series });
  }
  const { meta, lines } = splitHeader(body);
  const grid = parseGrid(lines);
  if (!grid) return { ok: false, error: "chart needs a header row and at least one data row (CSV or table)" };
  const series = grid.headers.slice(1).map((name, i) => ({
    name,
    values: grid.rows.map((r) => toNumber(r[i + 1] ?? "") ?? Number.NaN),
  }));
  return finishChart({
    chartType: allowed.find((t) => t === meta.type) ?? "bar",
    title: meta.title,
    unit: meta.unit,
    source: meta.source,
    labels: grid.rows.map((r) => r[0]),
    series,
  });
}

function finishChart(c: Omit<ChartBlock, "kind">): ParseResult {
  if (c.labels.length === 0) return { ok: false, error: "chart has no rows" };
  if (c.labels.length > 60) return { ok: false, error: "chart supports at most 60 rows" };
  const series = c.series.filter((s) => s.values.length === c.labels.length && s.values.every(Number.isFinite));
  if (series.length === 0) return { ok: false, error: "chart needs at least one numeric column" };
  return { ok: true, block: { kind: "chart", ...c, series: series.slice(0, 6) } };
}

function parseTable(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const grid = parseGrid(lines);
  if (!grid) return { ok: false, error: "table needs a header row and at least one row" };
  return { ok: true, block: { kind: "table", title: meta.title, source: meta.source, ...grid } };
}

function parseComparison(body: string): ParseResult {
  const json = tryJson(body);
  if (json) {
    const options = (Array.isArray(json.options) ? json.options : []).map((o: Record<string, unknown>) => ({
      name: String(o.name ?? "Option"),
      summary: str(o.summary),
      pros: strArr(o.pros),
      cons: strArr(o.cons),
      bestFor: str(o.bestFor),
    }));
    if (options.length < 2) return { ok: false, error: "comparison needs at least 2 options" };
    return { ok: true, block: { kind: "comparison", title: str(json.title), options, verdict: str(json.verdict) } };
  }
  const { meta, lines } = splitHeader(body);
  const options: ComparisonBlock["options"] = [];
  for (const line of lines) {
    const t = line.trim();
    const heading = t.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      options.push({ name: heading[1].trim(), pros: [], cons: [] });
      continue;
    }
    const cur = options[options.length - 1];
    if (!cur) continue;
    if (/^\+\s*/.test(t)) cur.pros.push(t.replace(/^\+\s*/, ""));
    else if (/^-\s*/.test(t)) cur.cons.push(t.replace(/^-\s*/, ""));
    else if (/^best for\s*:/i.test(t)) cur.bestFor = t.replace(/^best for\s*:\s*/i, "");
    else cur.summary = cur.summary ? `${cur.summary} ${t}` : t;
  }
  if (options.length < 2) return { ok: false, error: "comparison needs at least 2 options, each starting with '## Name'" };
  return { ok: true, block: { kind: "comparison", title: meta.title, options, verdict: meta.verdict } };
}

function parseTimeline(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const items = lines
    .map((l) => splitCells(l.replace(/^\s*[-*]\s+/, ""), "|"))
    .filter((c) => c.length >= 2)
    .map(([when, title, detail]) => ({ when, title, detail: detail || undefined }));
  if (items.length === 0) return { ok: false, error: "timeline lines look like: when | title | optional detail" };
  return { ok: true, block: { kind: "timeline", title: meta.title, items } };
}

function parseSteps(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const steps = lines.map((l) => l.replace(/^\s*(\d+[.)]|[-*]|\[ \]|\[x\])\s+/i, "").trim()).filter(Boolean);
  if (steps.length === 0) return { ok: false, error: "steps needs at least one line" };
  return { ok: true, block: { kind: "steps", title: meta.title, steps } };
}

function parseCallout(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const tones = ["info", "tip", "warning", "success"] as const;
  const tone = tones.find((t) => t === (meta.tone ?? meta.type)) ?? "info";
  const text = lines.join("\n").trim();
  if (!text) return { ok: false, error: "callout needs some text" };
  return { ok: true, block: { kind: "callout", tone, title: meta.title, text } };
}

function parseStats(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const items = lines
    .map((l) => splitCells(l.replace(/^\s*[-*]\s+/, ""), "|"))
    .filter((c) => c.length >= 2)
    .map(([value, label, hint]) => ({ value, label, hint: hint || undefined }));
  if (items.length === 0) return { ok: false, error: "stats lines look like: value | label | optional hint" };
  return { ok: true, block: { kind: "stats", title: meta.title, source: meta.source, items: items.slice(0, 8) } };
}

function parseCalculator(body: string): ParseResult {
  const json = tryJson(body);
  if (!json) return { ok: false, error: "calculator must be JSON: { title, inputs: [...], outputs: [...] }" };
  const inputs = (Array.isArray(json.inputs) ? json.inputs : []).map((i: Record<string, unknown>) => ({
    id: String(i.id ?? ""),
    label: String(i.label ?? i.id ?? ""),
    default: Number(i.default ?? 0),
    min: i.min === undefined ? undefined : Number(i.min),
    max: i.max === undefined ? undefined : Number(i.max),
    step: i.step === undefined ? undefined : Number(i.step),
    unit: str(i.unit),
  }));
  const outputs = (Array.isArray(json.outputs) ? json.outputs : []).map((o: Record<string, unknown>) => ({
    label: String(o.label ?? "Result"),
    formula: String(o.formula ?? ""),
    unit: str(o.unit),
    decimals: o.decimals === undefined ? undefined : Number(o.decimals),
  }));
  if (inputs.length === 0 || outputs.length === 0) return { ok: false, error: "calculator needs inputs and outputs" };
  if (inputs.some((i) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(i.id))) {
    return { ok: false, error: "calculator input ids must be letters, digits or _ (e.g. monthly_rent)" };
  }
  return { ok: true, block: { kind: "calculator", title: str(json.title), inputs, outputs, note: str(json.note) } };
}

function parseQuiz(body: string): ParseResult {
  const json = tryJson(body);
  if (!json) return { ok: false, error: 'quiz must be JSON: { "question", "options": [...], "answer": 0 }' };
  const options = strArr(json.options);
  const answer = Number(json.answer);
  if (!str(json.question) || options.length < 2) return { ok: false, error: "quiz needs a question and 2+ options" };
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
    return { ok: false, error: "quiz answer must be the 0-based index of the correct option" };
  }
  return { ok: true, block: { kind: "quiz", question: str(json.question) as string, options, answer, explanation: str(json.explanation) } };
}

function parseFaq(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const items: { q: string; a: string }[] = [];
  for (const line of lines) {
    const q = line.match(/^\s*Q\s*[:.]\s*(.+)$/i);
    const a = line.match(/^\s*A\s*[:.]\s*(.+)$/i);
    if (q) items.push({ q: q[1].trim(), a: "" });
    else if (a && items.length) items[items.length - 1].a = a[1].trim();
    else if (items.length) items[items.length - 1].a += ` ${line.trim()}`;
  }
  const valid = items.filter((i) => i.q && i.a.trim());
  if (valid.length === 0) return { ok: false, error: "faq lines look like: Q: question / A: answer" };
  return { ok: true, block: { kind: "faq", title: meta.title, items: valid } };
}

function parseEmbed(body: string): ParseResult {
  const { meta, lines } = splitHeader(body);
  const urls = lines.map((l) => l.trim().replace(/^url\s*:\s*/i, "")).filter((l) => /^https?:\/\/\S+$/.test(l));
  if (urls.length === 0) return { ok: false, error: "embed needs at least one https:// link, one per line" };
  if (urls.length > 12) return { ok: false, error: "embed supports up to 12 links per block" };
  const start = parseStart(meta.start);
  const height = meta.height ? Number(meta.height) : undefined;
  return {
    ok: true,
    block: {
      kind: "embed",
      urls,
      caption: meta.caption ?? meta.title,
      start,
      height: height && height >= 120 && height <= 1200 ? height : undefined,
    },
  };
}

const PARSERS: Record<SmartBlockType, (body: string) => ParseResult> = {
  chart: parseChart,
  table: parseTable,
  comparison: parseComparison,
  timeline: parseTimeline,
  steps: parseSteps,
  callout: parseCallout,
  stats: parseStats,
  calculator: parseCalculator,
  quiz: parseQuiz,
  faq: parseFaq,
  embed: parseEmbed,
};

export function parseSmartBlock(type: string, body: string): ParseResult {
  const key = type.trim().toLowerCase();
  if (!isSmartBlockType(key)) return { ok: false, error: `unknown block type "${type}"` };
  if (body.length > 20_000) return { ok: false, error: "block is too large (20,000 characters max)" };
  return PARSERS[key](body);
}

/** Finds every smart block in a Markdown document and reports parse errors with line numbers. */
export function validateSmartBlocks(markdown: string): { type: string; line: number; error: string }[] {
  const problems: { type: string; line: number; error: string }[] = [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(/^```(\w+)\s*$/);
    if (!m) continue;
    const start = i;
    const body: string[] = [];
    i++;
    while (i < lines.length && !lines[i].trim().startsWith("```")) body.push(lines[i++]);
    if (isSmartBlockType(m[1])) {
      const r = parseSmartBlock(m[1], body.join("\n"));
      if (!r.ok) problems.push({ type: m[1], line: start + 1, error: r.error });
    }
  }
  return problems;
}

/**
 * Upgrades plain Markdown (for example pasted from ChatGPT) into smart blocks:
 * - GFM tables become ```table blocks (sortable, chartable).
 * - Blockquotes starting with Note/Tip/Warning/Important become callouts.
 * Only unambiguous patterns are converted; richer blocks (comparison, chart,
 * calculator) are left to the author or agent to choose.
 * Text inside existing fences is never touched.
 */
export function smartifyMarkdown(markdown: string): { markdown: string; upgrades: string[] } {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  const upgrades: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (t.startsWith("```")) {
      out.push(line);
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) out.push(lines[i++]);
      if (i < lines.length) out.push(lines[i]);
      continue;
    }

    // GFM table: header row, divider row, body rows.
    if (t.startsWith("|") && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) block.push(lines[i++].trim());
      i--;
      out.push("```table", ...block, "```");
      upgrades.push("table");
      continue;
    }

    // > **Note:** ... / > [!TIP] ... style admonitions.
    const callout = t.match(/^>\s*(?:\*\*)?\[?!?(note|tip|warning|important|caution|success)\]?:?(?:\*\*)?:?\s*(.*)$/i);
    if (callout) {
      const tone = { note: "info", important: "info", tip: "tip", warning: "warning", caution: "warning", success: "success" }[
        callout[1].toLowerCase()
      ] as string;
      const text: string[] = callout[2] ? [callout[2]] : [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith(">")) text.push(lines[++i].trim().replace(/^>\s?/, ""));
      out.push("```callout", `tone: ${tone}`, ...text.filter(Boolean), "```");
      upgrades.push("callout");
      continue;
    }

    out.push(line);
  }
  return { markdown: out.join("\n"), upgrades };
}

/** Short reference shown in the editor and returned to MCP agents. */
export const SMART_BLOCKS_SPEC = `CampusLoop smart blocks (Intelligent UI for articles)
Write a fenced code block whose language is the block type. Plain text formats are forgiving; JSON is exact.
Optional header lines at the top of a block: title:, source:, unit:, type:, tone:, verdict:

chart     type: bar|line|area|pie, then CSV or a pipe table. First column = labels, other columns = numeric series (max 6).
          JSON: {"type":"bar","title":"...","unit":"LPA","source":"...","data":[{"label":"CSE","median":12}]}
table     A pipe table or CSV. Readers can sort columns and chart numeric columns.
comparison  "## Option" headings, then "+ pro", "- con", "best for: ...", other lines = summary. 2+ options.
          JSON: {"options":[{"name":"","summary":"","pros":[],"cons":[],"bestFor":""}],"verdict":""}
timeline  One item per line: when | title | optional detail
steps     One step per line (numbers/bullets optional). Readers can tick steps off.
callout   tone: info|tip|warning|success, then the text.
stats     One per line: value | label | optional hint (max 8).
calculator JSON only: {"title":"","inputs":[{"id":"rent","label":"Monthly rent","default":8000,"min":0,"max":50000,"step":500,"unit":"₹"}],
          "outputs":[{"label":"Per person","formula":"rent / people","unit":"₹","decimals":0}]}
          Formulas: + - * / % ^ ( ) and min max round floor ceil abs sqrt pow log exp, using input ids.
quiz      JSON: {"question":"","options":["",""],"answer":0,"explanation":""}  (answer = 0-based index)
faq       Lines "Q: question" then "A: answer".
embed     One link per line (up to 12; several become a gallery). Optional caption:, start: 1:30 (video start), height: 500.
          Supported: YouTube (incl. Shorts, playlists), Vimeo, Loom, Dailymotion, Twitch, TikTok, TED, X/Twitter, Reddit,
          Instagram, LinkedIn, CodePen, CodeSandbox, StackBlitz, JSFiddle, Replit, GitHub Gist, Observable, Figma,
          Google Docs/Slides/Sheets/Forms/Drive/Maps, Desmos, GeoGebra, Miro, Canva, Calendly, Typeform, Spotify,
          SoundCloud, Apple Music, MP4/MP3/images/PDF. Any other link shows a preview card.
          Shortcut: a supported link alone on its own line embeds automatically.

Pasted ChatGPT Markdown is upgraded automatically: tables become table blocks, "> Note/Tip/Warning" quotes become callouts.
Always include a source: line on charts and stats that present facts.`;
