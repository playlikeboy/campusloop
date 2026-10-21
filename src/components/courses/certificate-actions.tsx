"use client";

import { Check, Link2, Printer } from "lucide-react";
import { LinkedinIcon } from "@/components/ui/social-icons";
import { useState } from "react";

/** Print / copy link / add to LinkedIn. Hidden when printing. */
export function CertificateActions({ url, courseTitle, issued, id }: { url: string; courseTitle: string; issued: Date; id: string }) {
  const [copied, setCopied] = useState(false);
  const linkedIn = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(courseTitle)}&organizationName=CampusLoop&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${encodeURIComponent(id)}`;
  const btn = "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors cursor-pointer";
  return (
    <div className="flex flex-wrap justify-center gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}>
        <Printer className="size-4" aria-hidden /> Print or save PDF
      </button>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={`${btn} bg-muted/70 text-foreground hover:bg-muted`}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
      </button>
      <a href={linkedIn} target="_blank" rel="noopener noreferrer" className={`${btn} bg-muted/70 text-foreground hover:bg-muted`}>
        <LinkedinIcon className="size-4" /> Add to LinkedIn
      </a>
    </div>
  );
}
