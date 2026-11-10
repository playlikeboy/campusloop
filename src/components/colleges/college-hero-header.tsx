"use client";

import { ArrowLeft, Globe, Link2, MapPin, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ShareQrButton } from "@/components/common/share-qr-button";
import { Button } from "@/components/ui/button";
import { VerifiedSticker } from "@/components/ui/stickers";
import { CollegeCrest } from "./college-crest";

export interface AllowedDomainItem {
  domain: string;
  type: string;
  isPrimary?: boolean;
}

interface CollegeHeroHeaderProps {
  college: {
    id: string;
    slug: string;
    name: string;
    state?: string | null;
    district?: string | null;
    website?: string | null;
    websiteDomain?: string | null;
    yearOfEstablishment?: number | null;
    aisheCode?: string | null;
    locationType?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    nirfRank?: number | null;
    description?: string | null;
  };
  allowedDomains: AllowedDomainItem[];
  studentCount: number;
  postsCount: number;
  academicsCount?: number;
  isEnrolledHere: boolean;
  /** The college has a confirmed student email domain. */
  isVerifiedCollege?: boolean;
  /** Signed-out visitors see "Join with college email" instead of "Ask seniors". */
  isSignedIn?: boolean;
  onAskSeniorClick?: () => void;
  onViewAcademicsClick?: () => void;
}

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-IN")} ${word}${n === 1 ? "" : "s"}`;
}

export function CollegeHeroHeader({
  college,
  allowedDomains,
  studentCount,
  postsCount,
  academicsCount = 0,
  isEnrolledHere,
  isVerifiedCollege = false,
  isSignedIn = true,
  onAskSeniorClick,
}: CollegeHeroHeaderProps) {
  const [bannerError, setBannerError] = useState(false);
  const pagePath = `/college/${college.slug || college.id}`;
  const place = [college.district, college.state].filter(Boolean).join(", ") || "India";
  const website = college.website
    ? college.website.startsWith("http")
      ? college.website
      : `https://${college.website}`
    : null;
  const primaryDomain = allowedDomains[0]?.domain;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${pagePath}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar.");
    }
  }

  const stats = [
    plural(studentCount, "student"),
    plural(postsCount, "post"),
    academicsCount > 0 ? plural(academicsCount, "note") : null,
  ].filter(Boolean);

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/colleges">
            <ArrowLeft />
            All colleges
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Copy link" onClick={copyLink}>
            <Link2 />
          </Button>
          <ShareQrButton
            title={college.name}
            subtitle={place}
            badgeText="College"
            shortUrl={`https://campusloop.space${pagePath}`}
            category="community"
            avatarUrl={college.logoUrl || null}
            variant="icon"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {college.bannerUrl && !bannerError && (
          <img
            src={college.bannerUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="h-32 w-full object-cover sm:h-44"
          />
        )}

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <CollegeCrest name={college.name} logoUrl={college.logoUrl} size="lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h1 className="text-2xl leading-tight font-bold text-balance text-fg sm:text-3xl">
                {college.name}
              </h1>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {place}
                </span>
                {college.nirfRank ? <span>· NIRF #{college.nirfRank}</span> : null}
                {college.yearOfEstablishment ? <span>· Since {college.yearOfEstablishment}</span> : null}
              </p>
              <p className="text-sm text-fg-muted tabular-nums">{stats.join(" · ")}</p>
            </div>
          </div>

          {isEnrolledHere ? (
            <VerifiedSticker size="sm" label="Your college" />
          ) : isVerifiedCollege ? (
            <VerifiedSticker size="sm" label="Verified college" />
          ) : null}

          {college.description && (
            <p className="line-clamp-3 max-w-prose text-sm leading-relaxed text-fg-muted">
              {college.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {isSignedIn ? (
              <Button onClick={onAskSeniorClick}>
                <MessageSquarePlus />
                Ask seniors
              </Button>
            ) : (
              <Button asChild>
                <Link
                  href={`/sign-up?college=${college.slug}${primaryDomain ? `&domain=${primaryDomain}` : ""}`}
                >
                  Join with college email
                </Link>
              </Button>
            )}
            {website && (
              <Button asChild variant="outline">
                <a href={website} target="_blank" rel="noreferrer">
                  <Globe />
                  Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
