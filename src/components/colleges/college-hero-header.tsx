"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ShareQrButton } from "@/components/common/share-qr-button";

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
  collectivePoints: number;
  stateRank?: number;
  isEnrolledHere: boolean;
  onAskSeniorClick?: () => void;
  onViewAcademicsClick?: () => void;
}

export function CollegeHeroHeader({
  college,
  allowedDomains,
  studentCount,
  postsCount,
  academicsCount = 0,
  collectivePoints,
  stateRank = 1,
  isEnrolledHere,
  onAskSeniorClick,
  onViewAcademicsClick,
}: CollegeHeroHeaderProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const initials =
    college.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "CL";

  function handleShareCollege() {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://campusloop.space/college/${college.slug}`;

    const domainsText =
      allowedDomains.length > 0
        ? allowedDomains.map((d) => `@${d.domain}`).join(", ")
        : "Official College Email";

    const shareText = `Official Student Hub for ${college.name} on CampusLoop:\n- State Rank: #${stateRank} in ${
      college.state || "India"
    }\n- Verified Students: ${studentCount}+\n- Loop Score: ${collectivePoints.toLocaleString()} LP\n- Allowed Student Email: ${domainsText}\n\nExplore confessions, academic notes, leaderboards & campus discussions: ${shareUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      toast.success("College hub link and stats copied to clipboard");
      setTimeout(() => setCopiedShare(false), 2500);
    }
  }

  function handleCopyDomain(domain: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`@${domain}`);
      setCopiedDomain(domain);
      toast.success(`Copied @${domain} to clipboard`);
      setTimeout(() => setCopiedDomain(null), 2500);
    }
  }

  return (
    <header className="space-y-3 select-none">
      {/* ─── Top Navigation Bar ─── */}
      <div className="flex items-center justify-between">
        <Link
          href="/colleges"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-muted/40 hover:bg-muted px-3.5 py-1.5 rounded-full"
        >
          <ArrowLeft className="size-3.5" /> All Colleges
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareCollege}
            className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer bg-muted/40 hover:bg-muted px-3.5 py-1.5 rounded-full shadow-2xs"
          >
            {copiedShare ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Share2 className="size-3.5" />
            )}
            <span>{copiedShare ? "Copied" : "Share Hub"}</span>
          </button>
        </div>
      </div>

      {/* ─── Clean College Header Card ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-card shadow-2xs border border-border/40">
        {/* Banner Area */}
        <div className="relative h-36 sm:h-48 w-full bg-muted/30 overflow-hidden">
          {college.bannerUrl && !bannerError ? (
            <img
              src={college.bannerUrl}
              alt={`${college.name} Banner`}
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary/20 via-violet-500/15 to-indigo-500/20 flex items-center justify-center">
              <span className="text-primary/30 font-black text-2xl tracking-widest uppercase">
                {college.state || "Campus Hub"}
              </span>
            </div>
          )}

          {/* Top-Right Badges */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {isEnrolledHere && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground backdrop-blur-md shadow-xs">
                Your Campus
              </span>
            )}
            {college.state && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-background/80 text-foreground backdrop-blur-md shadow-xs">
                {college.state}
              </span>
            )}
          </div>
        </div>

        {/* Hero Content Body */}
        <div className="px-5 pb-5 pt-0 relative space-y-4">
          {/* Logo & Actions Top Row */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 gap-3">
            {/* College Logo / Crest */}
            <div className="size-20 sm:size-24 rounded-2xl bg-card border-4 border-card shadow-xl p-1.5 shrink-0 flex items-center justify-center overflow-hidden z-10">
              {college.logoUrl && !logoError ? (
                <img
                  src={college.logoUrl}
                  alt={college.name}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                  {initials}
                </div>
              )}
            </div>

            {/* CTAs Row */}
            <div className="flex items-center gap-2 shrink-0 pb-1 flex-wrap justify-end">
              <button
                type="button"
                onClick={onAskSeniorClick}
                className="h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquarePlus className="size-3.5" />
                <span>Ask Seniors</span>
              </button>

              {onViewAcademicsClick && (
                <button
                  type="button"
                  onClick={onViewAcademicsClick}
                  className="h-9 px-3.5 rounded-full border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <BookOpen className="size-3.5 text-primary" />
                  <span>Notes &amp; PYQs</span>
                </button>
              )}

              {college.website && (
                <a
                  href={college.website.startsWith("http") ? college.website : `https://${college.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-3 rounded-full border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Official Website"
                >
                  <Globe className="size-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Website</span>
                </a>
              )}

              <ShareQrButton
                title={college.name}
                subtitle={`${college.district ? `${college.district}, ` : ""}${college.state || "India"} • CampusLoop Official Hub`}
                badgeText="Campus Hub"
                shortUrl={`https://campusloop.space/college/${college.slug || college.id}`}
                category="community"
                avatarUrl={college.logoUrl || null}
                variant="icon"
              />
            </div>
          </div>

          {/* College Identity & Metadata */}
          <div className="space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
              {college.name}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-foreground/80">
                <MapPin className="size-3 text-primary shrink-0" />
                {college.district ? `${college.district}, ` : ""}
                {college.state || "India"}
              </span>
              {college.nirfRank && (
                <>
                  <span>•</span>
                  <span className="text-amber-500 font-bold">NIRF #{college.nirfRank}</span>
                </>
              )}
              {college.yearOfEstablishment && (
                <>
                  <span>•</span>
                  <span>Est. {college.yearOfEstablishment}</span>
                </>
              )}
              {college.aisheCode && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">AISHE: {college.aisheCode}</span>
                </>
              )}
            </p>
          </div>

          {/* Description if present */}
          {college.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{college.description}</p>
          )}

          {/* ─── Prominent Allowed Student Email Domains Section ─── */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black tracking-tight text-foreground">
                      Allowed College Email Domains
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Verified Campus Access
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Students registering with these domains unlock verified student badges and campus feeds.
                  </p>
                </div>
              </div>

              <Link
                href={`/college-request?suggestedInstitutionName=${encodeURIComponent(college.name)}`}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Request missing domain</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {allowedDomains.length > 0 ? (
                allowedDomains.map((item) => (
                  <div
                    key={item.domain}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs hover:border-primary/50 transition-colors"
                  >
                    <Mail className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono text-xs font-bold text-foreground">
                      @{item.domain}
                    </span>

                    <div className="flex items-center gap-1 border-l border-border/60 pl-2">
                      <button
                        type="button"
                        onClick={() => handleCopyDomain(item.domain)}
                        title={`Copy @${item.domain}`}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        {copiedDomain === item.domain ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>

                      <Link
                        href={`/sign-up?college=${college.slug}&domain=${item.domain}`}
                        className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black hover:bg-primary/20 transition-colors"
                      >
                        Join
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground font-medium">
                  Official college email required for verified student enrollment.
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Stats Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 px-4 rounded-2xl bg-muted/30 text-xs font-semibold text-muted-foreground">
            <span className="text-foreground">
              <strong className="text-foreground font-black">{studentCount}</strong> Verified Students
            </span>
            <span>•</span>
            <span className="text-foreground">
              <strong className="text-foreground font-black">{postsCount}</strong> Discussions
            </span>
            {academicsCount > 0 && (
              <>
                <span>•</span>
                <span className="text-foreground">
                  <strong className="text-foreground font-black">{academicsCount}</strong> Notes &amp; PYQs
                </span>
              </>
            )}
            <span>•</span>
            <span className="text-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500 inline" />
              <strong className="text-foreground font-black">{collectivePoints.toLocaleString()}</strong> LP Clout
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
