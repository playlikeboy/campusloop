"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { isStandaloneEmbedLine, standaloneUrl } from "@/lib/articles/article-embeds";
import { HeadingIds } from "@/lib/articles/headings";
import { isSmartBlockType } from "@/lib/articles/smart-blocks";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

// Smart blocks (charts, calculators...) load as their own chunk so plain posts
// and event descriptions never pay for chart code.
const SmartBlock = dynamic(() => import("@/components/articles/smart-blocks/smart-block"), {
  loading: () => <div className="my-6 h-40 animate-pulse rounded-2xl bg-muted/50" aria-hidden />,
});

/**
 * CampusLoop Markdown Renderer
 *
 * Renders a markdown string to React elements — never to raw HTML — so a post,
 * article or event description can never inject markup into the page.
 *
 * Smart blocks: fences tagged chart/table/comparison/timeline/steps/callout/
 * stats/calculator/quiz/faq render as interactive components (see
 * src/lib/articles/smart-blocks.ts).
 *
 * Supported blocks: `#`/`##`/`###` headings, `>` quotes, fenced code, bullet and
 * numbered lists, `---` rules, standalone images, and GFM-style tables.
 * Supported inline: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``,
 * `[text](url)`, `![alt](url)` and bare links.
 *
 * Hashtags and @mentions are deliberately NOT linkified here: long-form content
 * legitimately contains `#include`, `#define` and `@decorator`. Short social
 * copy uses `RichText` instead, which does linkify them.
 */

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** Renders tighter spacing for compact surfaces such as event cards. */
  compact?: boolean;
  /** Long-form only: a supported link alone on its own line becomes an embed. */
  autoEmbed?: boolean;
}

type TableAlignment = "left" | "center" | "right";

const INLINE_PATTERN = new RegExp(
  [
    "!\\[([^\\]]*)\\]\\(([^)\\s]+)\\)", // 1,2  image
    "\\[([^\\]]+)\\]\\(([^)\\s]+)\\)", // 3,4  link
    "`([^`]+)`", // 5    inline code
    "\\*\\*([^*]+)\\*\\*", // 6    bold
    "__([^_]+)__", // 7    bold
    "~~([^~]+)~~", // 8    strikethrough
    "\\*([^*\\n]+)\\*", // 9    italic
    "(https?:\\/\\/[^\\s<>\"')]+)", // 10   bare url
  ].join("|"),
  "g"
);

const MAX_INLINE_DEPTH = 4;


/** Splits a pipe-delimited markdown table row while respecting escaped pipes. */
function splitTableRow(line: string): string[] {
  let row = line.trim();

  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);

  const cells: string[] = [];
  let current = "";

  for (let index = 0; index < row.length; index++) {
    const character = row[index];

    if (character === "\\") {
      const nextCharacter = row[index + 1];
      if (nextCharacter === "|") {
        current += "|";
        index++;
        continue;
      }
    }

    if (character === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function getTableAlignment(delimiter: string): TableAlignment {
  const value = delimiter.trim();

  if (value.startsWith(":") && value.endsWith(":")) return "center";
  if (value.startsWith(":")) return "left";
  if (value.endsWith(":")) return "right";
  return "left";
}

function isTableDelimiterRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function isTableStart(lines: string[], index: number): boolean {
  if (index + 1 >= lines.length) return false;

  const headerCells = splitTableRow(lines[index]);
  const delimiterCells = splitTableRow(lines[index + 1]);

  return (
    lines[index].includes("|") &&
    headerCells.length >= 2 &&
    headerCells.length === delimiterCells.length &&
    isTableDelimiterRow(delimiterCells)
  );
}

/** Parses inline markdown into React nodes, recursing for nested emphasis. */
function parseInline(text: string, keyPrefix: string, depth = 0): React.ReactNode[] {
  if (!text) return [];
  if (depth >= MAX_INLINE_DEPTH) return [text];

  const nodes: React.ReactNode[] = [];
  const pattern = new RegExp(INLINE_PATTERN.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;
    const [, imgAlt, imgUrl, linkText, linkUrl, code, bold, boldAlt, strike, italic, bareUrl] = match;

    if (imgUrl !== undefined) {
      nodes.push(
        <img
          key={key}
          src={imgUrl}
          alt={imgAlt || "Image"}
          loading="lazy"
          className="my-3 max-h-[32rem] w-full rounded-2xl border border-border/40 object-cover"
        />
      );
    } else if (linkUrl !== undefined) {
      nodes.push(
        <a
          key={key}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          {linkText}
        </a>
      );
    } else if (code !== undefined) {
      nodes.push(
        <code
          key={key}
          className="rounded-md border border-border/40 bg-muted/60 px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {code}
        </code>
      );
    } else if (bold !== undefined || boldAlt !== undefined) {
      nodes.push(
        <strong key={key} className="font-black text-foreground">
          {parseInline((bold ?? boldAlt)!, key, depth + 1)}
        </strong>
      );
    } else if (strike !== undefined) {
      nodes.push(
        <s key={key} className="opacity-70">
          {parseInline(strike, key, depth + 1)}
        </s>
      );
    } else if (italic !== undefined) {
      nodes.push(
        <em key={key} className="italic">
          {parseInline(italic, key, depth + 1)}
        </em>
      );
    } else if (bareUrl !== undefined) {
      nodes.push(
        <a
          key={key}
          href={bareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline break-all"
        >
          {bareUrl.replace(/^https?:\/\//, "")}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}


function MarkdownTable({
  headers,
  alignments,
  rows,
  compact,
  tableKey,
}: {
  headers: string[];
  alignments: TableAlignment[];
  rows: string[][];
  compact: boolean;
  tableKey: number;
}) {
  const normalizedRows = rows.map((row) =>
    Array.from({ length: headers.length }, (_, index) => row[index] ?? "")
  );

  const headerPadding = compact ? "px-3 py-2.5" : "px-4 py-3";
  const bodyPadding = compact ? "px-3 py-2.5" : "px-4 py-3";

  return (
    <div className="my-6 -mx-1 overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-xs sm:mx-0">
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-[14px] sm:text-[15px]">
        <thead>
          <tr className="bg-muted/45">
            {headers.map((header, columnIndex) => {
              const alignment = alignments[columnIndex] ?? "left";
              return (
                <th
                  key={["h", tableKey, columnIndex].join("-")}
                  scope="col"
                  className={cn(
                    "border-b border-border/70 font-black text-foreground align-middle",
                    headerPadding,
                    alignment === "center" && "text-center",
                    alignment === "right" && "text-right",
                    alignment === "left" && "text-left"
                  )}
                >
                  {parseInline(header, ["table", tableKey, "h", columnIndex].join("-"))}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {normalizedRows.map((row, rowIndex) => (
            <tr
              key={["r", tableKey, rowIndex].join("-")}
              className={cn(
                "align-top transition-colors",
                rowIndex % 2 === 1 ? "bg-muted/10" : "bg-card",
                "hover:bg-muted/30"
              )}
            >
              {row.map((cell, columnIndex) => {
                const alignment = alignments[columnIndex] ?? "left";
                return (
                  <td
                    key={["r", tableKey, rowIndex, "c", columnIndex].join("-")}
                    className={cn(
                      "border-b border-border/40 leading-relaxed text-foreground/85",
                      bodyPadding,
                      alignment === "center" && "text-center",
                      alignment === "right" && "text-right",
                      alignment === "left" && "text-left"
                    )}
                  >
                    {parseInline(cell, ["table", tableKey, "r", rowIndex, "c", columnIndex].join("-"))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownContent({ content, className, compact = false, autoEmbed = false }: MarkdownContentProps) {
  if (!content?.trim()) return null;

  const blocks: React.ReactNode[] = [];
  // Long-form pages get heading anchors for the table of contents.
  const headingIds = autoEmbed ? new HeadingIds() : null;
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    // Blank line — collapses into block spacing.
    if (!trimmed) {
      index++;
      continue;
    }


    // GFM-style table. Detect before paragraph/list parsing so pipe-heavy
    // content cannot collapse into the raw "|...|---|..." layout.
    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const delimiterCells = splitTableRow(lines[index + 1]);
      const alignments = delimiterCells.map(getTableAlignment);
      const rows: string[][] = [];

      index += 2;

      while (index < lines.length) {
        const tableLine = lines[index].trim();

        if (!tableLine || !tableLine.includes("|")) break;

        const cells = splitTableRow(tableLine);
        if (cells.length < 2) break;

        rows.push(cells);
        index++;
      }

      blocks.push(
        <MarkdownTable
          key={key}
          headers={headers}
          alignments={alignments}
          rows={rows}
          compact={compact}
          tableKey={key}
        />
      );
      key++;
      continue;
    }

    // Fenced code block.
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const body: string[] = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        body.push(lines[index]);
        index++;
      }
      index++; // consume the closing fence
      if (isSmartBlockType(language)) {
        blocks.push(<SmartBlock key={key++} type={language.toLowerCase()} body={body.join("\n")} />);
        continue;
      }
      blocks.push(
        <CodeBlock
          key={key++}
          code={body.join("\n")}
          language={language || "typescript"}
          showLineNumbers={!compact}
        />
      );
      continue;
    }

    // Horizontal rule.
    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-6 border-border/40" />);
      index++;
      continue;
    }

    // Headings.
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const inline = parseInline(text, `h${key}`);
      const anchor = headingIds ? { id: headingIds.next(text), className: "scroll-mt-24" } : null;
      if (level === 1) {
        blocks.push(
          <h2 key={key++} id={anchor?.id} className={cn("border-b border-border/30 pb-2 pt-4 text-2xl font-black tracking-tight text-foreground md:text-3xl", anchor?.className)}>
            {inline}
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h3 key={key++} id={anchor?.id} className={cn("pt-3 text-xl font-black tracking-tight text-foreground md:text-2xl", anchor?.className)}>
            {inline}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={key++} id={anchor?.id} className={cn("pt-2 text-lg font-bold text-foreground md:text-xl", anchor?.className)}>
            {inline}
          </h4>
        );
      }
      index++;
      continue;
    }

    // Blockquote (consumes consecutive `>` lines).
    if (trimmed.startsWith(">")) {
      const body: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        body.push(lines[index].trim().replace(/^>\s?/, ""));
        index++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="rounded-xl border border-border/50 bg-muted/20 py-2.5 px-4 italic text-foreground/80"
        >
          {parseInline(body.join(" "), `q${key}`)}
        </blockquote>
      );
      continue;
    }

    // Bullet list.
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index++;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-1.5 pl-5 marker:text-primary">
          {items.map((item, i) => (
            <li key={i}>{parseInline(item, `ul${key}-${i}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list.
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index++;
      }
      blocks.push(
        <ol
          key={key++}
          className="list-decimal space-y-1.5 pl-5 font-medium marker:font-black marker:text-primary"
        >
          {items.map((item, i) => (
            <li key={i}>{parseInline(item, `ol${key}-${i}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph — consumes until a blank line or the start of another block.
    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (
        !current ||
        current.startsWith("```") ||
        current.startsWith(">") ||
        /^(#{1,3})\s+/.test(current) ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current) ||
        /^(---|\*\*\*|___)$/.test(current) ||
        isTableStart(lines, index)
      ) {
        break;
      }
      paragraph.push(current);
      index++;
    }

    if (autoEmbed && paragraph.length === 1 && isStandaloneEmbedLine(paragraph[0])) {
      blocks.push(<SmartBlock key={key++} type="embed" body={standaloneUrl(paragraph[0]) ?? paragraph[0]} />);
      continue;
    }

    if (paragraph.length > 0) {
      blocks.push(
        <p key={key++} className="leading-relaxed text-foreground/90">
          {parseInline(paragraph.join(" "), `p${key}`)}
        </p>
      );
    }
  }

  return (
    <div
      className={cn(
        "max-w-none break-words text-[15px] text-foreground",
        compact ? "space-y-2.5" : "space-y-4",
        className
      )}
    >
      {blocks}
    </div>
  );
}
