import { buildCampaignEmailHtml, CAMPAIGN_BODY_STYLES } from "@/lib/email-templates";
import { SITE_URL } from "@/lib/seo/constants";

/**
 * Turns campaign content (subject, preheader, heading, simple markdown body,
 * one button) plus one recipient's variables into a ready-to-send email.
 *
 * Variables: {{first_name}}, {{college}}, {{username}}, each with an optional
 * inline fallback: {{first_name|buddy}}. Every variable value is escaped for
 * the context it lands in, so a display name like `<script>` or `**x**` or
 * `[a](javascript:…)` is shown as text and never becomes HTML or markdown.
 */

export const CAMPAIGN_VARIABLES = ["first_name", "college", "username"] as const;
export type CampaignVariable = (typeof CAMPAIGN_VARIABLES)[number];
export type CampaignVariables = Record<CampaignVariable, string | null | undefined>;

export const VARIABLE_FALLBACKS: Record<CampaignVariable, string> = {
  first_name: "there",
  college: "your college",
  username: "friend",
};

export interface CampaignContent {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
}

export interface RenderedCampaignEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

const VARIABLE_RE = /\{\{\s*([a-z_]+)\s*(?:\|\s*([^}]*?))?\s*\}\}/gi;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips control characters (CR/LF included) so a value can never break a header or a line. */
function cleanValue(value: string | null | undefined): string {
  return (value ?? "")
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function isKnownVariable(name: string): name is CampaignVariable {
  return (CAMPAIGN_VARIABLES as readonly string[]).includes(name);
}

/** The raw (unescaped) value for a variable, falling back when the student left it empty. */
export function resolveVariable(name: CampaignVariable, vars: Partial<CampaignVariables>, inlineFallback?: string) {
  const value = cleanValue(vars[name]);
  if (value) return value;
  const fallback = cleanValue(inlineFallback);
  return fallback || VARIABLE_FALLBACKS[name];
}

/**
 * Replaces variables in plain text. `encode` is applied to each value only,
 * never to the surrounding template text.
 */
export function substituteVariables(
  template: string,
  vars: Partial<CampaignVariables>,
  encode: (value: string) => string = (v) => v
): string {
  return template.replace(VARIABLE_RE, (match, rawName: string, fallback?: string) => {
    const name = rawName.toLowerCase();
    if (!isKnownVariable(name)) return match;
    return encode(resolveVariable(name, vars, fallback));
  });
}

/** Variable names used in a template that are not supported (shown as a warning in the editor). */
export function unknownVariables(...templates: string[]): string[] {
  const unknown = new Set<string>();
  for (const template of templates) {
    for (const m of template.matchAll(VARIABLE_RE)) {
      const name = m[1].toLowerCase();
      if (!isKnownVariable(name)) unknown.add(name);
    }
  }
  return [...unknown];
}

/** Subject lines are a header: plain text, one line, no control characters. */
export function renderSubject(subject: string, vars: Partial<CampaignVariables>): string {
  return cleanHeaderText(substituteVariables(subject, vars)).slice(0, 200);
}

function cleanHeaderText(value: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Accepts https://, http:// and site-relative "/path" URLs (made absolute on
 * campusloop.space). Everything else (javascript:, data:, mailto: tricks,
 * protocol-relative //evil) returns null.
 */
export function safeUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) {
    try {
      return new URL(value, SITE_URL).toString();
    } catch {
      return null;
    }
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// Placeholders survive escaping and markdown untouched: no markdown or HTML characters.
const PH_OPEN = "\u0001";
const PH_CLOSE = "\u0002";

type Placeholders = string[];

function toPlaceholders(source: string, vars: Partial<CampaignVariables>, store: Placeholders): string {
  return source.replace(VARIABLE_RE, (match, rawName: string, fallback?: string) => {
    const name = rawName.toLowerCase();
    if (!isKnownVariable(name)) return match;
    store.push(resolveVariable(name, vars, fallback));
    return `${PH_OPEN}${store.length - 1}${PH_CLOSE}`;
  });
}

function fromPlaceholders(text: string, store: Placeholders, encode: (value: string) => string): string {
  return text.replace(new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g"), (_m, i: string) =>
    encode(store[Number(i)] ?? "")
  );
}

const STYLE = CAMPAIGN_BODY_STYLES;

function unescapeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function emphasis(escaped: string): string {
  let out = escaped.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
  return out;
}

/**
 * Inline markdown on already-escaped text: links, **bold**, *italic* / _italic_.
 * Finished anchors are parked behind markers so emphasis never rewrites an href.
 */
function inlineMarkdown(escaped: string, store: Placeholders): string {
  const anchors: string[] = [];
  const withLinks = escaped.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
    const rawHref = fromPlaceholders(unescapeEntities(href), store, encodeURIComponent);
    const url = safeUrl(rawHref);
    if (!url) return label;
    anchors.push(`<a href="${escapeHtml(url)}" target="_blank" style="${STYLE.a}">${emphasis(label)}</a>`);
    return `\u0003${anchors.length - 1}\u0004`;
  });
  return emphasis(withLinks).replace(/\u0003(\d+)\u0004/g, (_m, i: string) => anchors[Number(i)] ?? "");
}

/** Simple markdown to email-safe HTML with inline styles. Variable values are escaped. */
export function renderBodyHtml(body: string, vars: Partial<CampaignVariables>): string {
  const store: Placeholders = [];
  // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder markers must not come from input
  const source = body.replace(/\r\n?/g, "\n").replace(/[\u0001-\u0004]/g, "");
  const withPh = toPlaceholders(source, vars, store);
  const blocks = withPh
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const html = blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim());
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      const items = lines
        .map((l) => `<li style="${STYLE.li}">${inlineMarkdown(escapeHtml(l.replace(/^[-*]\s+/, "")), store)}</li>`)
        .join("");
      return `<ul style="${STYLE.ul}">${items}</ul>`;
    }
    if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0])) {
      return `<h2 style="${STYLE.h2}">${inlineMarkdown(escapeHtml(lines[0].replace(/^#{1,3}\s+/, "")), store)}</h2>`;
    }
    const inner = lines.map((l) => inlineMarkdown(escapeHtml(l), store)).join("<br>");
    return `<p style="${STYLE.p}">${inner}</p>`;
  });

  return fromPlaceholders(html.join("\n"), store, escapeHtml);
}

/** Plain-text alternative: markdown markers removed, links as "label (url)". */
export function renderBodyText(body: string, vars: Partial<CampaignVariables>): string {
  return substituteVariables(body.replace(/\r\n?/g, "\n"), vars)
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      const url = safeUrl(href);
      return url ? `${label} (${url})` : label;
    })
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .trim();
}

export function renderCampaignEmail(
  content: CampaignContent,
  vars: Partial<CampaignVariables>,
  options: { unsubscribeUrl?: string | null } = {}
): RenderedCampaignEmail {
  const subject = renderSubject(content.subject, vars) || "News from CampusLoop";
  const preheader = cleanHeaderText(substituteVariables(content.preheader ?? "", vars)).slice(0, 200);
  const heading = cleanHeaderText(substituteVariables(content.heading ?? "", vars)).slice(0, 200);
  const buttonUrl = safeUrl(content.buttonUrl);
  const buttonLabel = cleanHeaderText(substituteVariables(content.buttonLabel ?? "", vars)).slice(0, 60);

  const html = buildCampaignEmailHtml({
    subject,
    preheader,
    heading,
    bodyHtml: renderBodyHtml(content.body ?? "", vars),
    buttonLabel: buttonUrl ? buttonLabel : null,
    buttonUrl: buttonLabel ? buttonUrl : null,
    unsubscribeUrl: options.unsubscribeUrl ?? null,
  });

  const textParts = [heading, renderBodyText(content.body ?? "", vars)];
  if (buttonLabel && buttonUrl) textParts.push(`${buttonLabel}: ${buttonUrl}`);
  if (options.unsubscribeUrl) textParts.push(`Unsubscribe from these emails: ${options.unsubscribeUrl}`);
  const text = textParts.filter(Boolean).join("\n\n");

  return { subject, preheader, html, text };
}

/** First name from the official name, else the display name (first word only). */
export function firstNameFrom(officialName?: string | null, displayName?: string | null): string {
  const source = cleanValue(officialName) || cleanValue(displayName);
  const first = source.split(" ")[0] ?? "";
  return first.slice(0, 40);
}
