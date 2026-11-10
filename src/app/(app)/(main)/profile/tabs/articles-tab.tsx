"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { ArticleCard } from "@/components/articles/article-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticlesTabProps {
  articles: any[];
  isLoading: boolean;
  isOwnProfile: boolean;
  username: string;
}

export function ArticlesTab({ articles, isLoading, isOwnProfile, username }: ArticlesTabProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2" aria-busy="true">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No articles yet"
        description={
          isOwnProfile
            ? "Write about placements, exams or campus life."
            : `@${username} hasn't written any articles yet.`
        }
        action={
          isOwnProfile ? (
            <Button asChild>
              <Link href="/articles/new">Write an article</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      {isOwnProfile && (
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href="/articles/new">Write an article</Link>
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
