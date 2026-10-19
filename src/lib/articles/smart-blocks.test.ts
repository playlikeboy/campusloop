import { describe, expect, it } from "vitest";
import { looksLikeMarkdown, markdownToEditorHtml } from "./markdown-to-editor-html";
import { evaluateFormula } from "./safe-formula";
import { SMART_BLOCK_TEMPLATES } from "./smart-block-templates";
import { parseSmartBlock, SMART_BLOCK_TYPES, smartifyMarkdown, validateSmartBlocks } from "./smart-blocks";
import { calculateReadingTime, createExcerpt } from "./text";

describe("smart block parsing", () => {
  it("every editor template parses", () => {
    for (const type of SMART_BLOCK_TYPES) {
      const r = parseSmartBlock(type, SMART_BLOCK_TEMPLATES[type].body);
      expect(r.ok, `${type}: ${!r.ok ? r.error : ""}`).toBe(true);
    }
  });

  it("parses chart CSV with header lines and currency/percent values", () => {
    const r = parseSmartBlock("chart", "type: line\ntitle: Fees\nsource: Office\nyear, fee\n2024, ₹1,20,000\n2025, ₹1,32,000");
    expect(r.ok).toBe(true);
    if (r.ok && r.block.kind === "chart") {
      expect(r.block.chartType).toBe("line");
      expect(r.block.series[0].values).toEqual([120000, 132000]);
      expect(r.block.source).toBe("Office");
    }
  });

  it("parses chart JSON data rows", () => {
    const r = parseSmartBlock("chart", JSON.stringify({ type: "pie", data: [{ label: "A", share: 60 }, { label: "B", share: 40 }] }));
    expect(r.ok && r.block.kind === "chart" && r.block.chartType === "pie").toBe(true);
  });

  it("reports useful errors instead of throwing", () => {
    expect(parseSmartBlock("chart", "just text")).toMatchObject({ ok: false });
    expect(parseSmartBlock("quiz", '{"question":"Q","options":["a","b"],"answer":5}')).toMatchObject({ ok: false });
    expect(parseSmartBlock("nope", "x")).toMatchObject({ ok: false });
  });

  it("validates blocks in a document with line numbers", () => {
    const md = "# Hi\n\n```chart\nnot a table\n```\n\n```python\nprint(1)\n```";
    expect(validateSmartBlocks(md)).toEqual([expect.objectContaining({ type: "chart", line: 3 })]);
  });
});

describe("ChatGPT paste upgrade", () => {
  it("turns GFM tables and Note quotes into smart blocks, leaving code alone", () => {
    const md = "Intro\n\n| Name | Score |\n| --- | --- |\n| A | 1 |\n\n> **Note:** Check dates.\n\n```md\n| a | b |\n|---|---|\n```";
    const { markdown, upgrades } = smartifyMarkdown(md);
    expect(upgrades).toEqual(["table", "callout"]);
    expect(markdown).toContain("```table\n| Name | Score |");
    expect(markdown).toContain("```callout\ntone: info\nCheck dates.\n```");
    expect(markdown).toContain("```md\n| a | b |");
  });

  it("is idempotent", () => {
    const once = smartifyMarkdown("| a | b |\n|---|---|\n| 1 | 2 |").markdown;
    expect(smartifyMarkdown(once).markdown).toBe(once);
  });

  it("detects pasted Markdown but not single lines", () => {
    expect(looksLikeMarkdown("## Title\n- one\n- two")).toBe(true);
    expect(looksLikeMarkdown("just a sentence")).toBe(false);
  });
});

describe("editor import", () => {
  it("keeps fence languages and blank lines, escapes HTML", () => {
    const html = markdownToEditorHtml("```chart\na, b\n\nc, 1\n```\n\n<script>x</script> **bold**");
    expect(html).toContain('<pre><code class="language-chart">a, b\n\nc, 1</code></pre>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("drops unsafe link schemes", () => {
    expect(markdownToEditorHtml("[x](javascript:alert(1))")).not.toContain("href");
  });
});

describe("safe formulas", () => {
  it("evaluates arithmetic, functions and variables", () => {
    expect(evaluateFormula("(rent + bills) / people", { rent: 18000, bills: 2400, people: 3 })).toBe(6800);
    expect(evaluateFormula("round(2 ^ 10 / 3, 2)", {})).toBe(341.33);
    expect(evaluateFormula("-x + max(1, 5)", { x: 2 })).toBe(3);
  });

  it("rejects anything that is not arithmetic", () => {
    expect(() => evaluateFormula("constructor", {})).toThrow();
    expect(() => evaluateFormula("alert(1)", {})).toThrow();
    expect(() => evaluateFormula("a; b", { a: 1, b: 2 })).toThrow();
  });
});

describe("article text helpers", () => {
  it("excludes fenced blocks from excerpts", () => {
    expect(createExcerpt("Hello world\n\n```chart\nsecret, 1\n```")).toBe("Hello world");
    expect(calculateReadingTime("word ".repeat(200) + "\n```chart\na, b\nx, 1\n```")).toBe(2);
  });
});
