"use client";

import { ArrowLeft, LayoutDashboard, LogIn, PenTool } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface EditorialHeaderProps {
  profile?: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
}

export function EditorialHeader({ profile }: EditorialHeaderProps) {
  const pathname = usePathname();

  // Hide the global editorial top bar on editor pages to avoid redundant double-headers on mobile
  if (pathname.includes("/articles/new") || pathname.includes("/edit")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Feed Back Link + Logo & Publication Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/feeds"
            className="flex size-8.5 items-center justify-center rounded-full border border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
            title="Back to Campus Feed"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <Link href="/articles" className="flex items-center gap-2 group min-w-0">
            <img
              src="/logo.png"
              alt="CampusLoop"
              className="size-7 object-contain shrink-0 transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col truncate">
              <span className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-1.5">
                <span>CampusLoop</span>
                <span className="text-primary font-bold">Articles</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Actions (Write, Dashboard, Theme, User / Sign In) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {profile && (
            <Link
              href="/articles/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <LayoutDashboard className="size-3.5" />
              <span>My Articles</span>
            </Link>
          )}

          <Link
            href="/articles/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all cursor-pointer active:scale-95"
          >
            <PenTool className="size-3.5" />
            <span>Write</span>
          </Link>

          <ThemeToggle className="size-8.5 rounded-full border border-border/40 bg-muted/40 hover:bg-muted" />

          {profile ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-0.5 group cursor-pointer"
              title={`Logged in as @${profile.username}`}
            >
              <Avatar className="size-8 border border-border/60 transition-transform group-hover:scale-105">
                <AvatarImage src={profile.avatarUrl || ""} />
                <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                  {profile.displayName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/50 hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
            >
              <LogIn className="size-3.5 text-muted-foreground" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
