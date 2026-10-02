"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { PostEmbedRenderer } from "@/components/embeds/post-embed-renderer";
import { extractEmbedsFromText } from "@/lib/embeds";
import { parseMarketplaceInquiry, ProductMessageCard } from "./product-message-card";

interface ChatMessageContentProps {
  content: string;
  isMe: boolean;
}

/**
 * Splits text into tokens: @mentions, URLs, and regular text,
 * using industry-standard boundary detection (preventing credentials like mart@password123 from matching).
 * Mentions render as inline semantic links rather than bulky button pills to maintain sentence flow.
 */
function renderFormattedMessage(text: string, isMe: boolean) {
  const tokenRegex = /(https?:\/\/[^\s<>"']+|(?<=^|[\s([{<,;:/])@[a-zA-Z0-9_]{2,32}\b)/gi;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Handle @username mention - inline semantic styling
    if (part.startsWith("@") && part.length > 1) {
      const username = part.slice(1);
      return (
        <Link
          key={index}
          href={`/@${username}`}
          onClick={(e) => e.stopPropagation()}
          className={
            isMe
              ? "font-medium text-emerald-200 hover:text-white underline decoration-emerald-300/40 hover:decoration-white transition-colors select-text inline"
              : "font-medium text-emerald-400 dark:text-emerald-300 hover:text-emerald-200 underline decoration-emerald-400/40 hover:decoration-emerald-400 transition-colors select-text inline"
          }
        >
          {part}
        </Link>
      );
    }

    // Handle URLs
    if (/^https?:\/\//i.test(part)) {
      const cleanUrl = part.replace(/[.,;!?)]+$/, "");
      const trailing = part.slice(cleanUrl.length);

      let isInternal = false;
      let internalHref = cleanUrl;

      try {
        const parsed = new URL(cleanUrl);
        if (
          parsed.hostname === "campusloop.space" ||
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1"
        ) {
          isInternal = true;
          internalHref = parsed.pathname + parsed.search + parsed.hash;
        }
      } catch {
        // Ignore parse error
      }

      if (isInternal) {
        return (
          <React.Fragment key={index}>
            <Link
              href={internalHref}
              onClick={(e) => e.stopPropagation()}
              className={
                isMe
                  ? "inline-flex items-center gap-1 font-medium underline decoration-emerald-200/60 hover:decoration-emerald-200 text-emerald-100 hover:text-white break-all transition-colors"
                  : "inline-flex items-center gap-1 font-medium underline decoration-emerald-400/60 hover:decoration-emerald-400 text-emerald-400 dark:text-emerald-300 hover:text-emerald-200 break-all transition-colors"
              }
            >
              <span>{cleanUrl}</span>
              <ExternalLink className="size-3 shrink-0 opacity-80" />
            </Link>
            {trailing}
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={index}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={
              isMe
                ? "inline-flex items-center gap-1 font-medium underline decoration-emerald-200/60 hover:decoration-emerald-200 text-emerald-100 hover:text-white break-all transition-colors"
                : "inline-flex items-center gap-1 font-medium underline decoration-sky-400/60 hover:decoration-sky-400 text-sky-400 hover:text-sky-300 break-all transition-colors"
            }
          >
            <span>{cleanUrl}</span>
            <ExternalLink className="size-3 shrink-0 opacity-80" />
          </a>
          {trailing}
        </React.Fragment>
      );
    }

    // Normal text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function ChatMessageContent({ content, isMe }: ChatMessageContentProps) {
  // 1. Detect if this message is a structured marketplace listing inquiry
  const marketplaceProduct = useMemo(() => parseMarketplaceInquiry(content), [content]);

  // 2. Filter out bare @username mentions from triggering giant UserProfileEmbed cards in direct chat
  const mediaEmbeds = useMemo(() => {
    const list = extractEmbedsFromText(content);
    return list.filter((e) => e.type !== "internal_profile");
  }, [content]);

  return (
    <div className="space-y-1.5 text-left">
      {/* Formatted body text with left alignment */}
      <p className="whitespace-pre-wrap break-words text-[13.5px] sm:text-[14px] leading-relaxed text-left">
        {renderFormattedMessage(content, isMe)}
      </p>

      {/* Dedicated Marketplace Product Preview Card */}
      {marketplaceProduct && (
        <ProductMessageCard product={marketplaceProduct} isMe={isMe} />
      )}

      {/* Embedded interactive artifacts (Events, Communities, Articles, 9GAG, Music, etc.) - rendered only when present */}
      {mediaEmbeds.length > 0 && (
        <div className="mt-2 pt-1 border-t border-white/10 dark:border-border/30 text-left">
          <PostEmbedRenderer embeds={mediaEmbeds} limit={2} />
        </div>
      )}
    </div>
  );
}
