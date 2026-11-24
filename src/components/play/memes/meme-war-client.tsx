"use client";

import { Crown, ImagePlus, Laugh } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Sticker } from "@/components/ui/stickers";
import { PLAY_ROUTES } from "@/constants/play";
import { fetcher } from "@/lib/api";
import type { getMemeWar } from "@/lib/play/server/memes";
import { PlayHeader, PlaySection, timeLeft } from "../play-ui";
import { MemeCard } from "./meme-card";

type MemeWar = Awaited<ReturnType<typeof getMemeWar>>;

/** /play/meme-war: the weekly theme, your campus memes and last week's winner. */
export function MemeWarClient() {
  const [sort, setSort] = useState<"top" | "new">("top");
  const { data, error, isLoading, mutate } = useSWR<MemeWar>(`/api/play/memes?sort=${sort}`, fetcher);
  const canPost = data && data.myMemeStatus !== "ACTIVE" && data.myMemeStatus !== "HIDDEN";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <PlayHeader title="Meme War" description="One theme a week. Post your best meme, and your college votes for the winner." />

      {isLoading ? (
        <Skeleton className="h-40 rounded-sticker" />
      ) : data ? (
        <Sticker pop className="space-y-3 p-5">
          <p className="text-sm font-semibold text-fg-muted">This week's theme · ends in {timeLeft(data.endsAt)}</p>
          <h2 className="sticker-caption text-3xl text-balance text-sticker-fg">{data.theme?.title ?? "Anything goes"}</h2>
          {data.theme?.description && <p className="text-base text-fg-muted">{data.theme.description}</p>}
          {canPost ? (
            <Button asChild size="lg">
              <Link href={`${PLAY_ROUTES.memes}/new`}>
                <ImagePlus aria-hidden="true" />
                Post your meme
              </Link>
            </Button>
          ) : (
            <p className="text-sm font-semibold text-fg">
              {data.myMemeStatus === "HIDDEN"
                ? "Your meme was hidden after reports. You can post again next week."
                : "You posted this week. One meme each, so make it count."}
            </p>
          )}
        </Sticker>
      ) : null}

      {data?.lastWeek && (
        <PlaySection title="Last week's winner" id="meme-last">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- winning meme */}
            <img src={data.lastWeek.meme.imageUrl} alt="" className="size-16 shrink-0 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold text-fg">
                <Crown aria-hidden="true" className="size-4 text-reward-text" />
                <span className="truncate">{data.lastWeek.meme.author.displayName}</span>
              </p>
              <p className="line-clamp-2 text-sm text-fg-muted">
                {data.lastWeek.theme ? `${data.lastWeek.theme} · ` : ""}
                {data.lastWeek.meme.upvotes} votes
              </p>
            </div>
          </div>
        </PlaySection>
      )}

      <PlaySection
        title="Campus memes"
        id="meme-list"
        aside={
          <SegmentedControl
            size="sm"
            aria-label="Sort memes"
            value={sort}
            onChange={setSort}
            options={[
              { value: "top", label: "Top" },
              { value: "new", label: "New" },
            ]}
          />
        }
      >
        {isLoading ? (
          <Skeleton className="h-80 rounded-lg" />
        ) : error || !data ? (
          <EmptyState
            bordered
            title="Couldn't load memes"
            action={<Button onClick={() => void mutate()}>Try again</Button>}
          />
        ) : data.memes.length === 0 ? (
          <EmptyState bordered icon={Laugh} title="No memes yet this week" description="Be the first. Early memes get seen the most." />
        ) : (
          <div className="space-y-4">
            {data.memes.map((m) => (
              <MemeCard key={m.id} meme={m} onChange={() => void mutate()} />
            ))}
          </div>
        )}
      </PlaySection>
    </div>
  );
}
