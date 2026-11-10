"use client";

import { Bot, Check, FileText, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { fullAgentPrompt, SKILL_URL, type SkillKeys, shortAgentPrompt } from "@/lib/oauth/skill";

/**
 * Copy-ready prompts for AI coding agents (Claude Code, Cursor, Codex...).
 * "Prompt" links to the hosted SKILL.md; "Full prompt" inlines the whole skill.
 * The secret is included only when it is on screen (just created or rotated).
 */
export function AgentPromptButtons({ keys, compact }: { keys: SkillKeys; compact?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (id: string, text: string) =>
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(id);
        toast.success(id === "url" ? "SKILL.md link copied" : "Prompt copied. Paste it into your AI agent.");
        setTimeout(() => setCopied(null), 1800);
      },
      () => toast.error("Couldn't copy. Select the text and copy it yourself.")
    );
  const btn =
    "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-ui cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const icon = (id: string, Icon: typeof Bot) =>
    copied === id ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />;

  return (
    <div className={compact ? "" : "border-t border-border pt-4"}>
      {!compact && (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Bot className="size-4 text-fg-muted" aria-hidden /> Set it up with an AI agent
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Paste into Claude Code, Cursor, Codex or Windsurf. The agent adds the keys to .env, wires up
            sign-in for your stack, and commits and pushes the code.
            {!keys.clientSecret &&
              !keys.publicClient &&
              " Your secret isn't stored by CampusLoop, so the prompt has a placeholder; rotate the secret to get a prompt with it filled in."}
          </p>
        </>
      )}
      <div className={compact ? "flex flex-wrap gap-2" : "mt-3 flex flex-wrap gap-2"}>
        <button
          type="button"
          onClick={() => copy("short", shortAgentPrompt(keys))}
          className={`${btn} bg-brand text-brand-fg hover:bg-brand-hover`}
        >
          {icon("short", Bot)} Copy prompt
        </button>
        <button
          type="button"
          onClick={() => copy("full", fullAgentPrompt(keys))}
          className={`${btn} bg-surface-muted text-fg hover:bg-surface-sunken`}
        >
          {icon("full", FileText)} Copy full prompt
        </button>
        <button
          type="button"
          onClick={() => copy("url", SKILL_URL)}
          className={`${btn} text-brand-text hover:bg-brand-subtle`}
        >
          {icon("url", Link2)} Copy SKILL.md link
        </button>
      </div>
    </div>
  );
}
