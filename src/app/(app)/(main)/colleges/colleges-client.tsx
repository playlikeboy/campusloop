"use client";

import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  School,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddCollegeModal } from "@/components/colleges/add-college-modal";
import { AllIndiaCollegePodium, type LeaderboardCollegeItem } from "@/components/colleges/all-india-college-podium";
import type { CollegeItem } from "@/components/colleges/college-hub-row";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "IIT_NIT", label: "IITs & NITs" },
  { id: "NIRF", label: "NIRF 100" },
  { id: "CENTRAL", label: "Central" },
  { id: "TRENDING", label: "Trending" },
];

const STATES = [
  "ALL",
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
  "Rajasthan",
  "Punjab",
  "Kerala",
  "Jharkhand",
  "Madhya Pradesh",
  "Odisha",
  "Bihar",
  "Assam",
  "Haryana",
  "Andhra Pradesh",
];

export default function CollegesClient() {
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") === "leaderboard" ? "leaderboard" : "directory";
  const initialSearch = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "ALL";
  const initialState = searchParams.get("state") || "ALL";
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [activeTab, setActiveTab] = useState<"directory" | "leaderboard">(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState(initialState);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(24);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState<LeaderboardCollegeItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeState, setNewCollegeState] = useState("");
  const [newCollegeDistrict, setNewCollegeDistrict] = useState("");
  const [newCollegeWebsite, setNewCollegeWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync state with URL
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (activeTab !== "directory") params.set("tab", activeTab);
    if (search.trim()) params.set("q", search.trim());
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);
    if (selectedState !== "ALL") params.set("state", selectedState);
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    const newUrl = query ? `/colleges?${query}` : "/colleges";

    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [activeTab, search, selectedCategory, selectedState, page]);

  // Fetch Directory Colleges
  useEffect(() => {
    let ignore = false;
    async function fetchColleges() {
      setLoading(true);
      try {
        const url = new URL("/api/colleges", window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        if (search.trim()) url.searchParams.set("q", search.trim());
        if (selectedState !== "ALL") url.searchParams.set("state", selectedState);
        if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);

        const data = await fetcher<{
          colleges: CollegeItem[];
          total?: number;
          totalPages?: number;
          hasMore: boolean;
        }>(url.toString());
        if (!ignore) {
          setColleges(data.colleges || []);
          if (typeof data.total === "number") setTotal(data.total);
          if (typeof data.totalPages === "number") setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to load colleges:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = setTimeout(() => fetchColleges(), 200);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, selectedState, selectedCategory, page, limit]);

  // Fetch Leaderboard for visual addiction podium (always top 3) and full tab
  useEffect(() => {
    let ignore = false;
    async function fetchLeaderboard() {
      setLeaderboardLoading(true);
      try {
        const url = new URL("/api/colleges/leaderboard", window.location.origin);
        url.searchParams.set("limit", activeTab === "leaderboard" ? "50" : "3");
        if (selectedState !== "ALL") url.searchParams.set("state", selectedState);
        if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);

        const data = await fetcher<{
          leaderboard: LeaderboardCollegeItem[];
        }>(url.toString());
        if (!ignore && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        if (!ignore) setLeaderboardLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      ignore = true;
    };
  }, [activeTab, selectedState, selectedCategory]);

  async function handleAddCollege(e: React.FormEvent) {
    e.preventDefault();
    if (!newCollegeName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollegeName,
          state: newCollegeState,
          district: newCollegeDistrict,
          website: newCollegeWebsite,
        }),
      });

      if (!res.ok) throw new Error("Failed to add college");

      toast.success("Campus hub request submitted!");
      setShowAddModal(false);
      setNewCollegeName("");
      setNewCollegeState("");
      setNewCollegeDistrict("");
      setNewCollegeWebsite("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add college");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8 pb-28 pt-2">
      {/* ─── Compact Minimal Header ─── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 pt-2 border-b border-border/30">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Colleges
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">
            {total > 0 ? `${total.toLocaleString("en-IN")}` : "1,350+"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Minimalist Segmented Tabs */}
          <div className="flex items-center p-0.5 rounded-full bg-muted/60 border border-border/40 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("directory");
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-all cursor-pointer",
                activeTab === "directory"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("leaderboard");
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-all cursor-pointer",
                activeTab === "leaderboard"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Leaderboard
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex h-8.5 items-center gap-1.5 px-3 rounded-full bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition-all cursor-pointer border border-primary/20 active:scale-95"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Request Hub</span>
            <span className="sm:hidden">Request</span>
          </button>
        </div>
      </header>

      {/* ─── Minimal Search & Filter Bar ─── */}
      <section className="py-3 space-y-2.5 border-b border-border/30">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Clean Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by college or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-border/50 bg-muted/20 pl-9 pr-8 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Minimal State Selector Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full sm:w-auto appearance-none rounded-xl border border-border/50 bg-muted/20 pl-3 pr-8 text-xs font-semibold text-foreground outline-none transition-colors focus:border-primary cursor-pointer"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All States" : s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Horizontal Category Chips */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pt-0.5">
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  isSelected
                    ? "bg-foreground text-background font-bold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Directory Tab View ─── */}
      {activeTab === "directory" && (
        <section className="pt-4 flex-1 flex flex-col justify-between">
          {/* Top 3 Campus Spotlight / Visual Addiction Podium */}
          {page === 1 && !search.trim() && (
            <div className="mb-6">
              <AllIndiaCollegePodium
                leaderboard={leaderboard.slice(0, 3)}
                loading={leaderboardLoading && leaderboard.length === 0}
                className="mx-0 my-0"
                onExploreMore={() => {
                  setActiveTab("leaderboard");
                  setPage(1);
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-border/30 bg-card/20 animate-pulse space-y-3"
                >
                  <div className="size-10 rounded-full bg-muted/60" />
                  <div className="h-4 w-3/4 rounded bg-muted/60" />
                  <div className="h-3 w-1/2 rounded bg-muted/40" />
                </div>
              ))}
            </div>
          ) : colleges.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {colleges.map((college) => {
                  const location = [college.district, college.state].filter(Boolean).join(", ") || "India";
                  const initials =
                    college.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join("") || "CL";

                  return (
                    <Link
                      key={college.id}
                      href={`/college/${college.slug || college.id}`}
                      className="group flex flex-col justify-between p-4 rounded-2xl border border-border/40 bg-card/40 hover:bg-card hover:border-border/80 transition-all shadow-2xs"
                    >
                      <div className="space-y-3">
                        {/* Top row: crest + NIRF chip */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="size-10 rounded-full border border-border/50 bg-muted/30 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {college.logoUrl ? (
                              <img
                                src={college.logoUrl}
                                alt=""
                                className="size-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs font-black text-primary">{initials}</span>
                            )}
                          </div>

                          {college.nirfRank ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              NIRF #{college.nirfRank}
                            </span>
                          ) : college.websiteDomain ? (
                            <span className="font-mono text-[10px] font-semibold text-muted-foreground truncate max-w-[140px]">
                              @{college.websiteDomain}
                            </span>
                          ) : null}
                        </div>

                        {/* College Name & Location */}
                        <div className="space-y-1">
                          <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {college.name}
                          </h2>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{location}</span>
                          </p>
                        </div>
                      </div>

                      {/* Subtle Footer Hover Arrow */}
                      <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="group-hover:text-foreground transition-colors">View campus</span>
                        <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Minimal Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 pb-2 text-xs text-muted-foreground border-t border-border/30 mt-6">
                  <span>
                    Page <strong className="font-bold text-foreground">{page}</strong> of{" "}
                    <strong className="font-bold text-foreground">{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                        page <= 1
                          ? "opacity-40 border-border/30 cursor-not-allowed"
                          : "border-border/60 hover:bg-muted text-foreground"
                      )}
                    >
                      <ChevronLeft className="size-3.5" />
                      <span>Prev</span>
                    </button>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                        page >= totalPages
                          ? "opacity-40 border-border/30 cursor-not-allowed"
                          : "border-border/60 hover:bg-muted text-foreground"
                      )}
                    >
                      <span>Next</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <School className="size-8 text-muted-foreground/60" />
              <p className="text-sm font-bold text-foreground">No campus hubs found</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Request this college to be added →
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── Leaderboard Tab View ─── */}
      {activeTab === "leaderboard" && (
        <section className="pt-4 flex-1 space-y-4">
          {/* Top 3 Championship Podium */}
          {leaderboard.length >= 3 && !leaderboardLoading && (
            <AllIndiaCollegePodium
              leaderboard={leaderboard.slice(0, 3)}
              loading={leaderboardLoading}
              className="mx-0 my-0 mb-5"
            />
          )}

          {leaderboardLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl border border-border/30 bg-card/20 animate-pulse"
                />
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Complete Campus Standings</span>
                <span className="font-mono text-[11px] text-primary">Season 1 Live</span>
              </div>
              {leaderboard.map((item, index) => {
                const rank = index + 1;
                const location = [item.district, item.state].filter(Boolean).join(", ") || "India";
                const initials =
                  item.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("") || "CL";

                return (
                  <Link
                    key={item.id}
                    href={`/college/${item.slug || item.id}`}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-card/30 hover:bg-card hover:border-border/60 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={cn(
                          "w-6 text-center text-sm font-black tabular-nums shrink-0",
                          rank === 1 && "text-amber-500",
                          rank === 2 && "text-slate-400",
                          rank === 3 && "text-amber-700 dark:text-amber-600",
                          rank > 3 && "text-muted-foreground"
                        )}
                      >
                        #{rank}
                      </span>

                      <div className="size-9 rounded-full border border-border/40 bg-muted/20 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.logoUrl ? (
                          <img src={item.logoUrl} alt="" className="size-full object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{initials}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {item.name}
                          </h3>
                          {item.nirfRank && (
                            <span className="shrink-0 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 rounded">
                              NIRF #{item.nirfRank}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{location}</p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-3 text-right">
                      <span className="text-xs font-bold text-primary">
                        {item.points ? item.points.toLocaleString("en-IN") : `${item.studentCount || 0} students`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No active leaderboard data yet.
            </div>
          )}
        </section>
      )}

      {/* Add College Modal */}
      <AddCollegeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        newCollegeName={newCollegeName}
        setNewCollegeName={setNewCollegeName}
        newCollegeState={newCollegeState}
        setNewCollegeState={setNewCollegeState}
        newCollegeDistrict={newCollegeDistrict}
        setNewCollegeDistrict={setNewCollegeDistrict}
        newCollegeWebsite={newCollegeWebsite}
        setNewCollegeWebsite={setNewCollegeWebsite}
        submitting={submitting}
        onSubmit={handleAddCollege}
      />
    </main>
  );
}
