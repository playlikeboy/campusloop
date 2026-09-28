import { ArrowRight, Building2, MessageCircle, VenetianMask } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { formatTimeAgo, getAvatarUrl } from "@/lib/utils";

export interface ParentPostContextProps {
  id: string;
  title?: string | null;
  body: string;
  type: string;
  scope?: string;
  isAnonymous: boolean;
  pseudonym?: string | null;
  createdAt: Date | string;
  commentsCount?: number;
  author?: {
    id?: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    points?: number | null;
  } | null;
  institution?: {
    id?: string;
    name?: string | null;
    slug?: string | null;
  } | null;
}

export function ParentPostContextCard({ post }: { post: ParentPostContextProps }) {
  const isAnon = post.isAnonymous;
  const authorName = isAnon ? "Anonymous Student" : post.author?.displayName || "Student";
  const handle = isAnon ? post.pseudonym || "anonymous" : post.author?.username || "student";
  const avatarUrl = isAnon ? "" : getAvatarUrl(post.author?.avatarUrl, post.author?.username ?? "student");
  const fallback = isAnon ? (
    <VenetianMask className="size-4 text-purple-400" />
  ) : (
    (post.author?.displayName?.[0] ?? "S").toUpperCase()
  );

  const collegeName = post.institution?.name?.split(",")[0] || "Campus Discussion";
  const commentsCount = post.commentsCount ?? 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3 transition-colors">
      {/* Context Badge Row */}
      <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <MessageCircle className="size-3.5 text-primary" />
          <span>Parent Discussion</span>
        </div>

        {post.institution && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full border border-border/30 truncate max-w-[200px]">
            <Building2 className="size-3 text-muted-foreground" />
            <span className="truncate">{collegeName}</span>
          </span>
        )}
      </div>

      {/* Author & Header */}
      <div className="flex items-center gap-3">
        {!isAnon ? (
          <Link href={`/@${handle}`} className="shrink-0">
            <Avatar className="size-8 rounded-full border border-border/40 hover:opacity-90 transition-opacity">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs font-bold bg-muted">{fallback}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="size-8 rounded-full border border-border/40 bg-muted shrink-0">
            <AvatarFallback className="text-xs font-bold">{fallback}</AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-xs leading-none">
            {!isAnon ? (
              <Link href={`/@${handle}`} className="font-bold text-foreground hover:underline truncate">
                {authorName}
              </Link>
            ) : (
              <span className="font-bold text-foreground truncate">{authorName}</span>
            )}
            <span className="text-muted-foreground/70 text-[11px] truncate">@{handle}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground/70 text-[11px] shrink-0">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Title & Body Preview */}
      <div className="space-y-1">
        {post.title && (
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-snug break-words">
            {post.title}
          </h2>
        )}
        <div className="text-xs sm:text-sm text-foreground/80 line-clamp-3 leading-relaxed break-words">
          <RichText content={post.body} disableEmbeds={true} />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-1 flex items-center justify-between">
        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-2xs group"
        >
          <span>View full discussion ({commentsCount} comments)</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
