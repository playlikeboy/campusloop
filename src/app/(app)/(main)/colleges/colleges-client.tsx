"use client";

import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddCollegeModal } from "@/components/colleges/add-college-modal";
import {
  AllIndiaCollegePodium,
  type LeaderboardCollegeItem,
} from "@/components/colleges/all-india-college-podium";
import {
  CollegeDirectoryList,
  CollegeListSkeleton,
  CollegePager,
  CollegeStandingsList,
} from "@/components/colleges/college-directory-list";
import type { CollegeItem } from "@/components/colleges/college-hub-row";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName, Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fetcher } from "@/lib/api";
import { COLLEGE_DIRECTORY_STATES, COLLEGES_PAGE_SIZE } from "@/lib/colleges/directory-shared";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "IIT_NIT", label: "IITs & NITs" },
  { id: "NIRF", label: "NIRF top 100" },
  { id: "CENTRAL", label: "Central universities" },
];

const STATES = ["ALL", ...COLLEGE_DIRECTORY_STATES];

interface CollegesClientProps {
  /** Server-rendered first page (page + state only) so college links exist in the initial HTML. */
  initialColleges?: CollegeItem[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export default function CollegesClient({
  initialColleges,
  initialTotal,
  initialTotalPages,
}: CollegesClientProps) {
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
  const [limit] = useState(COLLEGES_PAGE_SIZE);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1);
  const [colleges, setColleges] = useState<CollegeItem[]>(initialColleges ?? []);
  const [loading, setLoading] = useState(!initialColleges);
  // The server already rendered the first page; skip the duplicate fetch on mount.
  const skipFirstFetch = useRef(Boolean(initialColleges));

  function hrefFor(overrides: { page?: number; category?: string }) {
    const params = new URLSearchParams();
    if (activeTab !== "directory") params.set("tab", activeTab);
    if (search.trim()) params.set("q", search.trim());
    const nextCategory = overrides.category ?? selectedCategory;
    if (nextCategory !== "ALL") params.set("category", nextCategory);
    if (selectedState !== "ALL") params.set("state", selectedState);
    const nextPage = overrides.page ?? page;
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `/colleges?${query}` : "/colleges";
  }

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
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
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

  // Most active colleges: top 3 on the list view, top 50 on the Most active view
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

      if (!res.ok) throw new Error("Couldn't send your request. Check the name and try again.");

      toast.success("Thanks! We'll review your college and add it soon.");
      setShowAddModal(false);
      setNewCollegeName("");
      setNewCollegeState("");
      setNewCollegeDistrict("");
      setNewCollegeWebsite("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send your request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const searchTrimmed = search.trim();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-fg">Colleges</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {total > 0 ? `${total.toLocaleString("en-IN")} colleges. ` : ""}Find yours and see what students
            are posting.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus />
          Add your college
        </Button>
      </header>

      <SegmentedControl
        aria-label="View"
        value={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        options={[
          { value: "directory", label: "All colleges" },
          { value: "leaderboard", label: "Most active" },
        ]}
        fullWidth
        className="sm:w-80"
      />

      <section aria-label="Search and filters" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search colleges"
              placeholder="College name or city"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-11 pl-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <X />
              </Button>
            )}
          </div>

          <div className="relative shrink-0 sm:w-52">
            <select
              aria-label="State"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className={cn(fieldClassName, "h-11 cursor-pointer appearance-none pr-10")}
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All states" : s}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
          </div>
        </div>

        <fieldset className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <legend className="sr-only">College type</legend>
          {CATEGORY_FILTERS.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              selected={selectedCategory === cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
            >
              {cat.label}
            </Chip>
          ))}
        </fieldset>
      </section>

      {activeTab === "directory" && (
        <section aria-label="College list" className="flex flex-1 flex-col gap-4">
          {page === 1 && !searchTrimmed && (
            <AllIndiaCollegePodium
              leaderboard={leaderboard.slice(0, 3)}
              loading={leaderboardLoading && leaderboard.length === 0}
              onExploreMore={() => {
                setActiveTab("leaderboard");
                setPage(1);
              }}
            />
          )}

          {loading ? (
            <CollegeListSkeleton />
          ) : (
            <CollegeDirectoryList colleges={colleges} onRequest={() => setShowAddModal(true)} />
          )}

          {!loading && colleges.length > 0 && (
            <CollegePager
              page={page}
              totalPages={totalPages}
              hrefFor={(p) => hrefFor({ page: p })}
              onPage={setPage}
            />
          )}
        </section>
      )}

      {activeTab === "leaderboard" && (
        <section aria-label="Most active colleges" className="flex-1">
          {leaderboardLoading ? <CollegeListSkeleton /> : <CollegeStandingsList leaderboard={leaderboard} />}
        </section>
      )}

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
