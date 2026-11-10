"use client";

import { ArrowLeft, MessageSquare, School, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import type { Institution, UserProfile } from "@/db/schema";
import { fetcher } from "@/lib/api";
import { getAvatarUrl, initialOf } from "@/lib/utils";

type BranchStudent = UserProfile & { institution?: Institution | null };

type BranchApiResponse = {
  branch: string;
  slug: string;
  icon: string;
  category: string;
  totalCount: number;
  students: BranchStudent[];
};

type Scope = "GLOBAL" | "CAMPUS";
type Sort = "CLOUT" | "RECENT";

export function BranchDirectoryClient() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = typeof params.slug === "string" ? params.slug : "";
  const slug = decodeURIComponent(rawSlug);

  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [sort, setSort] = useState<Sort>("CLOUT");
  const [searchQuery, setSearchQuery] = useState("");

  const url = `/api/academics/branch/${encodeURIComponent(slug)}?scope=${scope}&sort=${sort}&q=${encodeURIComponent(searchQuery)}`;
  const { data, isLoading, error } = useSWR<BranchApiResponse>(url, fetcher);

  const branchTitle = data?.branch || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl space-y-4 px-4 pt-3 pb-24">
      <header className="space-y-1">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
          <ArrowLeft />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-fg">{branchTitle}</h1>
        <p className="text-sm text-fg-muted tabular-nums">
          {data ? `${data.totalCount.toLocaleString("en-IN")} students` : "Students in this branch"}
        </p>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search students"
          placeholder="Search by name or username"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl<Scope>
          aria-label="Where"
          size="sm"
          value={scope}
          onChange={setScope}
          options={[
            { value: "GLOBAL", label: "All colleges" },
            { value: "CAMPUS", label: "My college" },
          ]}
        />
        <SegmentedControl<Sort>
          aria-label="Sort"
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: "CLOUT", label: "Most points" },
            { value: "RECENT", label: "Newest" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Users}
          bordered
          title="Couldn't load students"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => router.refresh()}>
              Try again
            </Button>
          }
        />
      ) : data && data.students.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {data.students.map((student) => (
            <li key={student.id} className="flex items-start gap-3 px-4 py-3">
              <Link href={`/@${student.username}`} className="shrink-0">
                <Avatar className="size-11">
                  <AvatarImage src={student.avatarUrl || getAvatarUrl(null, student.username)} alt="" />
                  <AvatarFallback>{initialOf(student.displayName)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1 space-y-0.5">
                <Link href={`/@${student.username}`} className="group block min-w-0">
                  <p className="truncate font-semibold text-fg group-hover:underline">
                    {student.displayName}
                  </p>
                  <p className="truncate text-sm text-fg-muted">
                    @{student.username}
                    {student.year ? ` · Year ${student.year}` : ""}
                  </p>
                </Link>
                {student.institution && (
                  <Link
                    href={`/college/${student.institution.slug || student.institution.id}`}
                    className="inline-flex max-w-full items-center gap-1 truncate text-sm text-brand-text hover:underline"
                  >
                    <School className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{student.institution.name}</span>
                  </Link>
                )}
                {student.bio && <p className="line-clamp-2 text-sm text-fg-muted">{student.bio}</p>}
                <p className="text-xs font-semibold text-reward-text tabular-nums">
                  {(student.points || 0).toLocaleString("en-IN")} LP
                </p>
              </div>
              <Button asChild variant="ghost" size="icon" aria-label={`Message ${student.displayName}`}>
                <Link href={`/chat?userId=${student.id}`}>
                  <MessageSquare />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Users}
          bordered
          title={searchQuery ? `No one matches "${searchQuery}"` : `No ${branchTitle} students yet`}
          description="Add your branch to your profile so classmates can find you."
          action={
            <Button asChild>
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
