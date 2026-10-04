"use client";

import {
  BookOpen,
  Building2,
  Calendar,
  Command,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Store,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const typeParam = activeCategory === "ALL" ? "ALL" : activeCategory;
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${typeParam}&limit=16`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search query error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  if (!isOpen) return null;

  const navigateTo = (href: string) => {
    sounds.tap();
    haptics.light();
    onClose();
    router.push(href);
  };

  const users = results?.users || [];
  const communities = results?.communities || [];
  const events = results?.events || [];
  const academics = results?.academics || [];
  const articles = results?.articles || [];
  const colleges = results?.colleges || [];
  const posts = results?.posts || [];

  const hasAnyResults =
    users.length > 0 ||
    communities.length > 0 ||
    events.length > 0 ||
    academics.length > 0 ||
    articles.length > 0 ||
    colleges.length > 0 ||
    posts.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh] backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search CampusLoop"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-border/50 px-4 py-3.5">
          <Search className="size-5 shrink-0 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus students, communities, events, notes, gear..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {loading ? (
            <Loader2 className="size-4.5 animate-spin text-primary shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/30 px-4 py-2 bg-muted/20">
          {[
            { id: "ALL", label: "All" },
            { id: "PEOPLE", label: "Students" },
            { id: "COMMUNITIES", label: "Clubs" },
            { id: "EVENTS", label: "Events" },
            { id: "ACADEMICS", label: "Academics" },
            { id: "ARTICLES", label: "Articles" },
            { id: "COLLEGES", label: "Colleges" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                haptics.light();
                setActiveCategory(cat.id);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {!query.trim() ? (
            <div className="py-12 px-6 text-center">
              <Command className="mx-auto size-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">Search across your campus</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Type a name, course code, event, club, hostel gear or keyword to instantly discover campus intelligence.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {["#Hackathon", "PYQs", "Cycles", "Coders Club", "Hostel 7"].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setQuery(hint)}
                    className="rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-all"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasAnyResults && !loading ? (
            <div className="py-12 px-6 text-center">
              <p className="text-sm font-semibold text-foreground">No matches for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for a student name, course title, club, or browse explore.
              </p>
              <button
                type="button"
                onClick={() => navigateTo(`/explore?q=${encodeURIComponent(query)}`)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs cursor-pointer hover:bg-primary/90"
              >
                Search Entire Campus Archive
              </button>
            </div>
          ) : (
            <>
              {/* Students / People */}
              {users.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Students ({users.length})
                  </p>
                  {users.slice(0, 4).map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => navigateTo(`/@${u.username}`)}
                      className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/60 transition-all text-left cursor-pointer"
                    >
                      <Avatar className="size-8 rounded-full border border-border/50 shrink-0">
                        <AvatarImage src={getAvatarUrl(u.avatarUrl, u.username)} />
                        <AvatarFallback className="text-xs font-bold">
                          {u.displayName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{u.displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Communities / Clubs */}
              {communities.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Clubs &amp; Communities ({communities.length})
                  </p>
                  {communities.slice(0, 4).map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigateTo(`/communities/${c.id}`)}
                      className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/60 transition-all text-left cursor-pointer"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                        <Users className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{c.description || "Campus Community"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Events */}
              {events.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Events &amp; Fests ({events.length})
                  </p>
                  {events.slice(0, 3).map((e: any) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => navigateTo(`/events/${e.id}`)}
                      className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/60 transition-all text-left cursor-pointer"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Calendar className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{e.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{e.location || "Campus Venue"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Academics Resources */}
              {academics.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Academic Vault ({academics.length})
                  </p>
                  {academics.slice(0, 3).map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigateTo(`/academics/${a.id || ""}`)}
                      className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/60 transition-all text-left cursor-pointer"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{a.subject || a.courseCode || "Study Resource"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Campus-wide intelligence index</span>
          <button
            type="button"
            onClick={() => navigateTo(`/explore?q=${encodeURIComponent(query)}`)}
            className="font-bold text-primary hover:underline cursor-pointer"
          >
            Open in Explore &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
