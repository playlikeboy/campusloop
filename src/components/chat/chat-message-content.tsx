"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { PostEmbedRenderer } from "@/components/embeds/post-embed-renderer";
import { MentionTag } from "@/components/ui/stickers";
import { extractEmbedsFromText } from "@/lib/embeds";
import { ProductMessageCard, parseMarketplaceInquiry } from "./product-message-card";

interface ChatMessageContentProps {
  content: string;
  isMe: boolean;
}

const LINK_ME =
  "inline-flex items-center gap-1 font-medium underline underline-offset-2 text-brand-fg break-all transition-ui";
const LINK_THEM =
  "inline-flex items-center gap-1 font-medium underline underline-offset-2 text-brand-text break-all transition-ui";

/**
 * Splits text into @mentions, URLs and plain text. A mention must follow a space or punctuation,
 * so emails like name@college.edu stay plain text. Mentions render as MentionTag pills.
 */
function renderFormattedMessage(text: string, isMe: boolean) {
  const tokenRegex = /(https?:\/\/[^\s<>"']+|(?<=^|[\s([{<,;:/])@[a-zA-Z0-9_]{2,32}\b)/gi;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // @username mention: the story-style mention pill.
    if (part.startsWith("@") && part.length > 1) {
      return (
        <MentionTag
          key={index}
          username={part.slice(1)}
          href={`/@${part.slice(1)}`}
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className={isMe ? "bg-brand-fg/20 text-brand-fg hover:bg-brand-fg hover:text-brand" : undefined}
        />
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
              className={isMe ? LINK_ME : LINK_THEM}
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
            className={isMe ? LINK_ME : LINK_THEM}
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
      <p className="whitespace-pre-wrap break-words text-left text-base leading-snug select-text">
        {renderFormattedMessage(content, isMe)}
      </p>

      {/* Dedicated Marketplace Product Preview Card */}
      {marketplaceProduct && <ProductMessageCard product={marketplaceProduct} isMe={isMe} />}

      {/* Embedded interactive artifacts (Events, Communities, Articles, 9GAG, Music, etc.) - rendered only when present */}
      {mediaEmbeds.length > 0 && (
        <div className="mt-2 border-t border-border pt-1 text-left">
          <PostEmbedRenderer embeds={mediaEmbeds} limit={2} />
        </div>
      )}
    </div>
  );
}
