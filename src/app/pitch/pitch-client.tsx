"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies the absolute link to the deck PDF. */
export function CopyDeckLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = path.startsWith("http") ? path : `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Open the PDF and copy it from the address bar.");
    }
  };

  return (
    <Button type="button" variant="outline" onClick={copy}>
      {copied ? <Check className="text-verified-text" aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Link copied" : "Copy PDF link"}
    </Button>
  );
}
