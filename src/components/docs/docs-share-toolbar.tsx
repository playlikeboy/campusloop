"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";

interface DocsShareToolbarProps {
  title: string;
  /** Kept for callers; the quote is used as the share text. */
  viralQuote: string;
  url: string;
}

/** Share and copy-link buttons for a docs page. */
export function DocsShareToolbar({ title, viralQuote, url }: DocsShareToolbarProps) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    haptics.light();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Couldn't copy the link. Copy it from the address bar."));
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title, text: viralQuote, url }).catch(() => {});
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
      <Button variant="secondary" size="sm" onClick={share}>
        <Share2 className="size-4" />
        Share
      </Button>
      <Button variant="ghost" size="sm" onClick={copyLink}>
        {copied ? <Check className="size-4 text-verified-text" /> : <Link2 className="size-4" />}
        {copied ? "Link copied" : "Copy link"}
      </Button>
    </div>
  );
}
