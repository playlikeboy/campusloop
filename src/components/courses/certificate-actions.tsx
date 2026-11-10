"use client";

import { Check, Link2, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkedinIcon } from "@/components/ui/social-icons";

/** Print, copy link and add to LinkedIn. Hidden when printing. */
export function CertificateActions({
  url,
  courseTitle,
  issued,
  id,
}: {
  url: string;
  courseTitle: string;
  issued: Date;
  id: string;
}) {
  const [copied, setCopied] = useState(false);
  const linkedIn = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(courseTitle)}&organizationName=CampusLoop&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${encodeURIComponent(id)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 print:hidden">
      <Button onClick={() => window.print()}>
        <Printer aria-hidden /> Print or save as PDF
      </Button>
      <Button variant="secondary" onClick={copy}>
        {copied ? <Check aria-hidden /> : <Link2 aria-hidden />} {copied ? "Copied" : "Copy link"}
      </Button>
      <Button asChild variant="secondary">
        <a href={linkedIn} target="_blank" rel="noopener noreferrer">
          <LinkedinIcon className="size-4" /> Add to LinkedIn
        </a>
      </Button>
    </div>
  );
}
