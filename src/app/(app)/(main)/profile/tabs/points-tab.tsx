"use client";

import { ProfileStreakCard } from "@/components/streaks/profile-streak-card";
import { LoopPointsSticker } from "@/components/ui/stickers";
import { LP_ACTION_REWARDS } from "@/constants/gamification";
import { CLOUT_TIERS, getCloutTier } from "@/lib/gamification";

const WAYS_TO_EARN: { label: string; points: number }[] = [
  { label: "A friend joins with your link", points: LP_ACTION_REWARDS.REFERRAL_SIGNUP },
  { label: "Upload notes or PYQs", points: LP_ACTION_REWARDS.UPLOAD_ACADEMIC_NOTE },
  { label: "Publish an article", points: LP_ACTION_REWARDS.PUBLISH_ARTICLE },
  { label: "Write a post", points: LP_ACTION_REWARDS.CREATE_POST },
  { label: "Comment on a post", points: LP_ACTION_REWARDS.CREATE_COMMENT },
  { label: "Upvote a post", points: LP_ACTION_REWARDS.GIVE_UPVOTE },
];

interface PointsTabProps {
  profileId: string;
  points: number;
  isOwnProfile: boolean;
}

export function PointsTab({ profileId, points, isOwnProfile }: PointsTabProps) {
  const tier = getCloutTier(points);
  const next = CLOUT_TIERS.find((t) => t.minPoints > points);
  const span = next ? next.minPoints - tier.minPoints : 1;
  const progress = next ? Math.round(((points - tier.minPoints) / span) * 100) : 100;

  return (
    <div className="space-y-6 p-4">
      <section
        className="space-y-4 rounded-lg border border-border bg-surface p-4"
        aria-labelledby="points-title"
      >
        <h2 id="points-title" className="sr-only">
          Loop Points
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LoopPointsSticker points={points} />
          <span className="text-sm font-semibold text-fg">
            Level {tier.level}: {tier.tierName}
          </span>
        </div>
        {next ? (
          <div className="space-y-2">
            <div
              className="relative h-3 overflow-hidden rounded-sm bg-poll-track"
              role="progressbar"
              aria-valuemin={tier.minPoints}
              aria-valuemax={next.minPoints}
              aria-valuenow={points}
              aria-label={`Progress to ${next.tierName}`}
            >
              <div
                className="poll-fill absolute inset-0 bg-reward"
                style={{ "--fill": progress } as React.CSSProperties}
              />
            </div>
            <p className="text-sm text-fg-muted">
              {next.minPoints - points} LP to {next.tierName}
            </p>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">You're at the top level.</p>
        )}
      </section>

      <ProfileStreakCard profileId={profileId} />

      {isOwnProfile && (
        <section className="space-y-2" aria-labelledby="earn-title">
          <h2 id="earn-title" className="text-lg text-fg">
            Ways to earn
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {WAYS_TO_EARN.map((way) => (
              <li key={way.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-fg">{way.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-reward-text">+{way.points} LP</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
