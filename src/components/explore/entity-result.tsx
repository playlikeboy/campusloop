"use client";

import {
  BookOpen,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  Hash,
  MessageSquare,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { SearchEntityType, SearchResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";

function EntityTypeIcon({ type, className = "size-4" }: { type: SearchEntityType; className?: string }) {
  switch (type) {
    case "person":
      return <User className={className} />;
    case "post":
      return <MessageSquare className={className} />;
    case "community":
      return <Users className={className} />;
    case "college":
      return <Building2 className={className} />;
    case "event":
      return <Calendar className={className} />;
    case "article":
      return <BookOpen className={className} />;
    case "academic":
      return <GraduationCap className={className} />;
    case "store":
      return <ShoppingBag className={className} />;
    case "hashtag":
      return <Hash className={className} />;
    default:
      return <FileText className={className} />;
  }
}

function getEntityTypeLabel(type: SearchEntityType): string {
  switch (type) {
    case "person":
      return "Student";
    case "post":
      return "Discussion";
    case "community":
      return "Club";
    case "college":
      return "College";
    case "event":
      return "Event";
    case "article":
      return "Article";
    case "academic":
      return "Academic";
    case "store":
      return "Store";
    case "hashtag":
      return "Hashtag";
    default:
      return "Result";
  }
}

export function EntityResult({ result }: { result: SearchResult }) {
  const typeLabel = getEntityTypeLabel(result.type);

  return (
    <Link
      href={result.href}
      className={cn(
        "group flex items-start gap-3.5 p-3 rounded-xl border border-border/30 bg-muted/15 hover:bg-muted/40 hover:border-border/60 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
    >
      {/* Visual Avatar or Icon Thumbnail */}
      <Avatar className="size-10 rounded-xl shrink-0 border border-border/40 bg-muted/40">
        {result.imageUrl && <AvatarImage src={result.imageUrl} alt={result.title} />}
        <AvatarFallback className="rounded-xl text-xs font-semibold bg-primary/10 text-primary">
          <EntityTypeIcon type={result.type} className="size-4" />
        </AvatarFallback>
      </Avatar>

      {/* Main Content */}
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {result.title}
            </h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
              {typeLabel}
            </Badge>
          </div>

          {result.metadata?.nirfRank && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
              {result.metadata.nirfRank}
            </Badge>
          )}
        </div>

        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}

        {result.description && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {result.description}
          </p>
        )}

        {/* Dynamic Metadata Badges */}
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-muted-foreground/70">
            {result.metadata.course && <span>{result.metadata.course}</span>}
            {result.metadata.venue && <span>{result.metadata.venue}</span>}
            {result.metadata.downloads && <span>{result.metadata.downloads} downloads</span>}
            {result.metadata.votes && <span>{result.metadata.votes} votes</span>}
            {result.metadata.comments && <span>{result.metadata.comments} comments</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
