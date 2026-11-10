"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CountdownSticker,
  MentionTag,
  PollSticker,
  QuestionSticker,
  Sticker,
} from "@/components/ui/stickers";

/** Example campus moments shown in the landing story frame. All of them are labelled examples. */
export interface StoryMoment {
  id: string;
  who: string;
  when: string;
  caption: string;
  kind: "poll" | "question" | "countdown" | "mention";
  /** Story field behind the moment. Pink is reserved for Campus Match moments. */
  field: "ink" | "deep" | "paper";
}

export const STORY_MOMENTS: StoryMoment[] = [
  {
    id: "mess",
    who: "Hostel 7",
    when: "2h",
    caption: "What's for dinner tonight?",
    kind: "poll",
    field: "ink",
  },
  {
    id: "seniors",
    who: "CSE seniors",
    when: "5h",
    caption: "Ask your seniors anything",
    kind: "question",
    field: "deep",
  },
  {
    id: "fest",
    who: "Cultural club",
    when: "1d",
    caption: "Fest night is almost here",
    kind: "countdown",
    field: "paper",
  },
  {
    id: "football",
    who: "Football club",
    when: "20m",
    caption: "Need 2 players for tonight",
    kind: "mention",
    field: "ink",
  },
];

const POLL_OPTIONS = [
  { id: "mess", label: "Mess food", votes: 18 },
  { id: "maggi", label: "Maggi at the gate", votes: 41 },
  { id: "order", label: "Order in", votes: 27 },
];

function PollMoment() {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <PollSticker
      options={POLL_OPTIONS.map((o) => ({
        ...o,
        votes: o.votes + (choice === o.id ? 1 : 0),
        chosen: choice === o.id,
      }))}
      showResults={choice !== null}
      onVote={setChoice}
      footer={choice ? "Example votes. Your college's polls show real ones." : "Tap to vote"}
    />
  );
}

function QuestionMoment() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <QuestionSticker prompt="Ask me about internships">
        <p className="flex items-start gap-2 font-semibold">
          <Check className="mt-0.5 size-4.5 shrink-0 text-brand-text" aria-hidden="true" />
          Sent. Join to ask seniors at your own college.
        </p>
      </QuestionSticker>
    );
  }
  return (
    <QuestionSticker
      prompt="Ask me about internships"
      value={value}
      onChange={setValue}
      onSubmit={() => setSent(true)}
      placeholder="Type your question"
      maxLength={140}
    />
  );
}

function CountdownMoment({ target }: { target: number }) {
  const [going, setGoing] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <CountdownSticker title="Fest night" target={target} />
      <Button
        variant={going ? "primary" : "outline"}
        aria-pressed={going}
        onClick={() => setGoing((g) => !g)}
        className="self-start"
      >
        {going && <Check aria-hidden="true" />}
        {going ? "You're going" : "I'm going"}
      </Button>
    </div>
  );
}

function MentionMoment() {
  const [joined, setJoined] = useState(false);
  return (
    <Sticker className="flex flex-col gap-3 p-4">
      <p className="text-base">Match at 7 pm on the main ground. Bring your own water.</p>
      <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        In so far: <MentionTag username="rahul_k" size="sm" /> <MentionTag username="ananya.s" size="sm" />
        {joined && <MentionTag username="you" size="sm" />}
      </p>
      <Button
        variant={joined ? "primary" : "outline"}
        aria-pressed={joined}
        onClick={() => setJoined((j) => !j)}
        className="self-start"
      >
        {joined && <Check aria-hidden="true" />}
        {joined ? "You're in" : "Count me in"}
      </Button>
    </Sticker>
  );
}

export function StoryMomentSticker({
  moment,
  countdownTarget,
}: {
  moment: StoryMoment;
  countdownTarget: number;
}) {
  switch (moment.kind) {
    case "poll":
      return <PollMoment />;
    case "question":
      return <QuestionMoment />;
    case "countdown":
      return <CountdownMoment target={countdownTarget} />;
    case "mention":
      return <MentionMoment />;
  }
}
