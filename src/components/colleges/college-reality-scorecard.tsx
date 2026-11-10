"use client";

import { ArrowUpRight, Check, Copy, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { InstitutionEmailFormat } from "@/lib/student-email-domains";
import type { AllowedDomainItem } from "./college-hero-header";

interface CollegeRealityScorecardProps {
  collegeName: string;
  collegeSlug?: string;
  allowedDomains?: AllowedDomainItem[];
  emailFormat?: InstitutionEmailFormat | null;
  studentCount: number;
  nirfRank?: number | null;
  description?: string | null;
  extraData?: {
    wikipediaUrl?: string;
    summary?: string;
    campusAcreage?: string;
    affiliation?: string;
    chancellor?: string;
    naacGrade?: string;
  } | null;
  onAskSeniorClick?: () => void;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      toast.success(`Copied ${text}`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it yourself.");
    }
  }
  return { copied, copy };
}

/** "About" tab: real facts about the college and how to join with a college email. */
export function CollegeRealityScorecard({
  collegeName,
  collegeSlug,
  allowedDomains = [],
  emailFormat,
  nirfRank,
  description,
  extraData,
  onAskSeniorClick,
}: CollegeRealityScorecardProps) {
  const { copied, copy } = useCopy();
  const [showAllDomains, setShowAllDomains] = useState(false);
  const shortName = collegeName.split(",")[0];
  const domains = showAllDomains ? allowedDomains : allowedDomains.slice(0, 6);

  const facts = [
    nirfRank ? { label: "NIRF rank", value: `#${nirfRank}` } : null,
    extraData?.naacGrade ? { label: "NAAC grade", value: extraData.naacGrade } : null,
    extraData?.campusAcreage ? { label: "Campus area", value: extraData.campusAcreage } : null,
    extraData?.affiliation ? { label: "Affiliated to", value: extraData.affiliation } : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <div className="space-y-4">
      {(description || facts.length > 0) && (
        <section className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-fg">About {shortName}</h2>
            {extraData?.wikipediaUrl && (
              <Button asChild variant="link" size="sm">
                <a href={extraData.wikipediaUrl} target="_blank" rel="noreferrer">
                  Wikipedia
                  <ArrowUpRight />
                </a>
              </Button>
            )}
          </div>
          {description && <p className="max-w-prose text-sm leading-relaxed text-fg-muted">{description}</p>}
          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-fg-muted">{f.label}</dt>
                  <dd className="truncate font-semibold text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-bold text-fg">How to join</h2>
        <p className="text-sm text-fg-muted">
          Sign up with your {shortName} email. Only students with a college email can post, vote and chat
          here.
        </p>

        {emailFormat && (
          <div className="space-y-1.5 rounded-md bg-surface-muted p-3">
            <p className="text-sm text-fg">
              Your email looks like <span className="font-mono font-semibold">{emailFormat.pattern}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <span>Example:</span>
              <span className="font-mono text-fg">{emailFormat.example}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Copy ${emailFormat.example}`}
                onClick={() => copy(emailFormat.example)}
              >
                {copied === emailFormat.example ? <Check className="text-verified-text" /> : <Copy />}
              </Button>
            </div>
            {emailFormat.description && <p className="text-sm text-fg-muted">{emailFormat.description}</p>}
          </div>
        )}

        {allowedDomains.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-fg">Emails we accept</p>
            <ul className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <li
                  key={d.domain}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-muted py-0.5 pr-0.5 pl-3 font-mono text-sm text-fg"
                >
                  @{d.domain}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Copy @${d.domain}`}
                    onClick={() => copy(`@${d.domain}`)}
                  >
                    {copied === `@${d.domain}` ? <Check className="text-verified-text" /> : <Copy />}
                  </Button>
                </li>
              ))}
            </ul>
            {allowedDomains.length > 6 && (
              <Button variant="link" size="sm" onClick={() => setShowAllDomains((v) => !v)}>
                {showAllDomains ? "Show fewer" : `Show all ${allowedDomains.length}`}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button asChild>
            <Link href={`/sign-up?college=${collegeSlug ?? ""}`}>Join with college email</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/college-request?suggestedInstitutionName=${encodeURIComponent(collegeName)}`}>
              My email isn't listed
            </Link>
          </Button>
        </div>
      </section>

      {onAskSeniorClick && (
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-fg">Got a question about {shortName}?</h2>
            <p className="text-sm text-fg-muted">
              Placements, hostels, clubs: ask the students who are there.
            </p>
          </div>
          <Button variant="secondary" onClick={onAskSeniorClick} className="shrink-0">
            <MessageSquarePlus />
            Ask seniors
          </Button>
        </section>
      )}
    </div>
  );
}
