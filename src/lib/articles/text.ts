/**
 * Plain-text helpers for articles, shared by the app API and the Articles MCP.
 * Fenced blocks (code and smart blocks) are excluded: chart CSV or calculator
 * JSON should never appear in an excerpt or inflate reading time.
 */

export function articlePlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateReadingTime(content: string): number {
  const words = articlePlainText(content).split(/\s+/).filter(Boolean).length;
  // Each interactive block takes roughly half a minute to read or use.
  const blocks = (content.match(/^```(chart|table|comparison|timeline|steps|stats|calculator|quiz|faq)\s*$/gm) ?? []).length;
  return Math.max(1, Math.ceil(words / 200 + blocks * 0.5));
}

export function createExcerpt(content: string): string {
  const plainText = articlePlainText(content);
  return plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");
}
