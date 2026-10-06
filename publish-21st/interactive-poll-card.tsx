"use client";

import * as React from "react";
import { Check } from "lucide-react";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface InteractivePollCardProps {
  question: string;
  options: PollOption[];
  initialUserVote?: string | null;
  onVote?: (optionId: string) => void;
  className?: string;
  subtitle?: string;
}

export function InteractivePollCard({
  question,
  options: initialOptions,
  initialUserVote = null,
  onVote,
  className = "",
  subtitle,
}: InteractivePollCardProps) {
  const [userVote, setUserVote] = React.useState<string | null>(initialUserVote);
  const [options, setOptions] = React.useState<PollOption[]>(initialOptions);

  const totalVotes = React.useMemo(() => {
    return options.reduce((sum, opt) => sum + opt.votes, 0);
  }, [options]);

  const handleVote = (optionId: string) => {
    if (userVote) return;

    setUserVote(optionId);
    setOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
    onVote?.(optionId);
  };

  const hasVoted = Boolean(userVote);

  return (
    <div
      className={`w-full max-w-md rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-md transition-all ${className}`}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          {question}
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-2.5">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = userVote === option.id;

          return (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                hasVoted
                  ? "cursor-default border-border/60 bg-muted/20"
                  : "cursor-pointer border-border hover:border-primary/50 hover:bg-muted/40 active:scale-[0.99]"
              }`}
            >
              {/* Animated Progress Bar fill */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                    isSelected
                      ? "bg-primary/20 dark:bg-primary/25"
                      : "bg-muted-foreground/10 dark:bg-muted-foreground/15"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  {isSelected && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className={isSelected ? "font-bold text-primary" : ""}>
                    {option.label}
                  </span>
                </div>

                {hasVoted && (
                  <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                    {percentage}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <span>
          {totalVotes} {totalVotes === 1 ? "total vote" : "total votes"}
        </span>
        {hasVoted && <span className="font-medium text-primary">Vote recorded</span>}
      </div>
    </div>
  );
}

export default InteractivePollCard;
