import { Award, Brain, ChevronRight, Laugh, type LucideIcon, Split, Swords, Users } from "lucide-react";
import Link from "next/link";
import { HomeTabs } from "@/app/(app)/(main)/feeds/home-tabs";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/stickers";
import { PLAY_ROUTES } from "@/constants/play";
import type { PlayHubData } from "@/lib/play/server/hub";
import { PlayHeader, PlaySection, RankTile } from "./play-ui";

function GameRow({
  href,
  icon: Icon,
  title,
  status,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  status: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-18 items-center gap-3 px-4 py-3 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-snug font-bold text-fg">{title}</span>
          <span className="line-clamp-2 text-sm text-fg-muted">{status}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-fg-subtle group-hover:text-fg" />
      </Link>
    </li>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function PlayHub({ data }: { data: PlayHubData | null }) {
  if (!data) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 pb-10">
        <HomeTabs active="play" className="px-0 pt-3" />
        <PlayHeader backHref={null} title="Play" description="Games with your campus are almost ready. Check back soon." />
      </div>
    );
  }

  const { dp, memes, trivia, tot } = data;
  const quizLine =
    trivia.status === "DONE"
      ? `Done for today: ${trivia.score} points. New quiz at midnight.`
      : trivia.status === "IN_PROGRESS"
        ? "You started today's quiz. Finish it before midnight."
        : "5 questions, 20 seconds each. Tech, GK, campus life and placements.";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <HomeTabs active="play" className="px-0 pt-3" />

      <PlayHeader
        backHref={null}
        title="Play"
        description="Quick games with students at your college. New rounds every week."
        actions={
          <Button asChild variant="secondary">
            <Link href={PLAY_ROUTES.achievements}>
              <Award aria-hidden="true" />
              Your badges
              <span className="tabular-nums text-fg-muted">{data.badges}</span>
            </Link>
          </Button>
        }
      />

      <Sticker pop className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-brand-text">
          <Brain aria-hidden="true" className="size-6" />
          <h2 className="sticker-caption text-2xl text-sticker-fg">Daily quiz</h2>
        </div>
        <p className="text-base text-fg">{quizLine}</p>
        {trivia.streak > 0 && (
          <p className="text-sm font-semibold text-fg-muted">
            Quiz streak: <span className="tabular-nums text-fg">{plural(trivia.streak, "day", "days")}</span>
          </p>
        )}
        <Button asChild size="lg" variant={trivia.status === "DONE" ? "secondary" : "primary"}>
          <Link href={PLAY_ROUTES.trivia}>
            {trivia.status === "DONE" ? "See today's top scores" : trivia.status ? "Continue quiz" : "Start today's quiz"}
          </Link>
        </Button>
      </Sticker>

      <PlaySection title="This week" id="play-games">
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          <GameRow
            href={PLAY_ROUTES.dp}
            icon={Swords}
            title="DP Battle"
            status={
              dp.myStatus === "ACTIVE"
                ? `You're in. ${plural(dp.entrants, "DP", "DPs")} battling this week.`
                : dp.entrants >= 2
                  ? `${plural(dp.entrants, "student has", "students have")} entered. Pick the better DP.`
                  : "Enter your DP and let campus pick the better one."
            }
          />
          <GameRow
            href={PLAY_ROUTES.memes}
            icon={Laugh}
            title="Meme War"
            status={
              memes.theme
                ? `Theme: ${memes.theme}. ${memes.posted ? "You posted." : plural(memes.count, "meme so far", "memes so far")}`
                : "Post a meme. Campus votes the best one."
            }
          />
          <GameRow
            href={PLAY_ROUTES.tot}
            icon={Split}
            title="This or That"
            status={tot.left > 0 ? `${plural(tot.left, "poll", "polls")} waiting. See how campus voted.` : "You've answered every poll. More soon."}
          />
          <GameRow
            href={PLAY_ROUTES.branches}
            icon={Users}
            title="Branch Wars"
            status={
              data.branches[0]
                ? `${data.branches[0].branch} leads with ${data.branches[0].points} points.`
                : "Every point you score in Play counts for your branch."
            }
          />
        </ul>
      </PlaySection>

      {data.branches.length > 0 && (
        <PlaySection
          title="Branch table"
          id="play-branches"
          aside={
            <Link href={PLAY_ROUTES.branches} className="text-sm font-semibold text-brand-text hover:underline">
              Full table
            </Link>
          }
        >
          <ol className="divide-y divide-border rounded-lg border border-border bg-surface">
            {data.branches.map((b, i) => (
              <li key={b.branch} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <RankTile rank={i + 1} />
                <span className="min-w-0 flex-1 font-semibold text-fg">{b.branch}</span>
                <span className="shrink-0 text-sm tabular-nums text-fg-muted">{b.points} pts</span>
              </li>
            ))}
          </ol>
          {!data.myBranch && (
            <p className="text-sm text-fg-muted">
              Add your branch on your{" "}
              <Link href="/profile/edit" className="font-semibold text-brand-text hover:underline">
                profile
              </Link>{" "}
              so your points count.
            </p>
          )}
        </PlaySection>
      )}
    </div>
  );
}
