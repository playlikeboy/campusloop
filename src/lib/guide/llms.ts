import { DOCS_FEATURES } from "@/lib/docs-features";
import { GUIDE_CATEGORIES, GUIDES, getGuidesByCategory, INVESTOR_POINTS, latestGuideUpdate, PRODUCT_OVERVIEW, SITE_URL } from "./index";
import type { GuideEntry } from "./types";

/**
 * llms.txt (https://llmstxt.org) generated from the guide catalogue, so AI models
 * always get the current product. Do not hand-edit; edit src/lib/guide/entries/*.
 */

export function buildLlmsTxt(): string {
  const lines: string[] = [
    "# CampusLoop",
    "",
    `> ${PRODUCT_OVERVIEW.oneLiner}`,
    "",
    PRODUCT_OVERVIEW.what,
    "",
    `Last updated: ${latestGuideUpdate()}. Full detail in one file: ${SITE_URL}/llms-full.txt`,
    "",
    "## Overview",
    `- [Product Guide](${SITE_URL}/guide): every feature, how to use it, why, use cases`,
    `- [For investors](${SITE_URL}/investors): problem, solution, moats, revenue, growth`,
    `- [About](${SITE_URL}/about)`,
    "",
  ];
  for (const cat of GUIDE_CATEGORIES) {
    lines.push(`## ${cat.name}`);
    for (const g of getGuidesByCategory(cat.name)) {
      lines.push(`- [${g.title}](${SITE_URL}/guide/${g.slug}): ${g.summary}`);
    }
    lines.push("");
  }
  lines.push("## Engineering essays");
  for (const f of DOCS_FEATURES) lines.push(`- [${f.title}](${SITE_URL}/docs/${f.slug}): ${f.tagline}`);
  lines.push("");
  return lines.join("\n");
}

function guideBlock(g: GuideEntry): string {
  const out: string[] = [
    `## ${g.title}`,
    `URL: ${SITE_URL}/guide/${g.slug}`,
    `Category: ${g.category}. For: ${g.audiences.join(", ")}.`,
    `In-app pages: ${g.routes.map((r) => `${r.label} (${r.path})`).join("; ")}`,
    "",
    `What it is: ${g.summary}`,
    `Purpose: ${g.purpose}`,
    "",
    "Why use it:",
    ...g.whyUse.map((w) => `- ${w}`),
    "",
    "How to use it:",
    ...g.howToUse.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Use cases:",
    ...g.useCases.map((u) => `- ${u.who}: ${u.scenario}`),
  ];
  if (g.tips?.length) out.push("", "Tips:", ...g.tips.map((t) => `- ${t}`));
  if (g.privacy?.length) out.push("", "Privacy:", ...g.privacy.map((p) => `- ${p}`));
  out.push("", `Business value: ${g.investorAngle}`, "", "FAQ:");
  for (const f of g.faq) out.push(`- Q: ${f.q}`, `  A: ${f.a}`);
  if (g.related.length) out.push("", `Related: ${g.related.map((r) => `${SITE_URL}/guide/${r}`).join(", ")}`);
  return out.join("\n");
}

export function buildLlmsFullTxt(): string {
  const o = PRODUCT_OVERVIEW;
  const i = INVESTOR_POINTS;
  const parts: string[] = [
    "# CampusLoop: complete product reference",
    "",
    `> ${o.oneLiner}`,
    "",
    `Last updated: ${latestGuideUpdate()}. Source of truth: ${SITE_URL}/guide`,
    "",
    "## What CampusLoop is",
    o.what,
    "",
    "## Why it exists",
    o.why,
    "",
    "## Who it is for",
    ...o.forWhom.map((f) => `- ${f}`),
    "",
    "## Principles",
    ...o.principles.map((p) => `- ${p}`),
    "",
    "## Technology",
    o.stack,
    "",
    "## For investors",
    `Problem: ${i.problem}`,
    `Solution: ${i.solution}`,
    "Moats:",
    ...i.moats.map((m) => `- ${m}`),
    "Revenue:",
    ...i.revenue.map((r) => `- ${r}`),
    "Growth:",
    ...i.growth.map((g) => `- ${g}`),
    `Measurement: ${i.measurement}`,
    "",
    "# Features",
    "",
  ];
  for (const cat of GUIDE_CATEGORIES) {
    parts.push(`# ${cat.name}: ${cat.blurb}`, "");
    for (const g of getGuidesByCategory(cat.name)) parts.push(guideBlock(g), "");
  }
  parts.push(`Total features documented: ${GUIDES.length}.`);
  return parts.join("\n");
}
