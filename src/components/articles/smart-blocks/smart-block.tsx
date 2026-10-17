"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { parseSmartBlock } from "@/lib/articles/smart-blocks";
import {
  CalculatorView,
  CalloutView,
  ComparisonView,
  FaqView,
  QuizView,
  StatsView,
  StepsView,
  TimelineView,
} from "./content-blocks";
import { ChartBlockView, TableBlockView } from "./data-blocks";

/**
 * Renders one smart block. Invalid blocks never break the article: they show
 * the raw text plus a short reason, so authors can fix them and readers still
 * get the content.
 */
export function SmartBlock({ type, body }: { type: string; body: string }) {
  const result = useMemo(() => parseSmartBlock(type, body), [type, body]);

  if (!result.ok) {
    return (
      <div className="not-prose my-6 rounded-2xl bg-muted/50 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-3.5" aria-hidden />
          This {type} block could not be displayed: {result.error}
        </p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-foreground">{body}</pre>
      </div>
    );
  }

  const b = result.block;
  switch (b.kind) {
    case "chart":
      return <ChartBlockView block={b} raw={body} />;
    case "table":
      return <TableBlockView block={b} raw={body} />;
    case "comparison":
      return <ComparisonView block={b} raw={body} />;
    case "timeline":
      return <TimelineView block={b} raw={body} />;
    case "steps":
      return <StepsView block={b} raw={body} />;
    case "callout":
      return <CalloutView block={b} />;
    case "stats":
      return <StatsView block={b} raw={body} />;
    case "calculator":
      return <CalculatorView block={b} raw={body} />;
    case "quiz":
      return <QuizView block={b} raw={body} />;
    case "faq":
      return <FaqView block={b} raw={body} />;
  }
}

export default SmartBlock;
