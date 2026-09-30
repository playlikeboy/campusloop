/**
 * 🛡️ BDSM: Behavioral Detection Sequence Model & Scarecrow Rules Engine
 * Inspired by Twitter/X's public anti-inauthenticity sequence model (`bdsm/` and `scarecrow/`).
 *
 * "BDSM" in X's architecture stands for Behavioral Detection Sequence Model:
 * A time-aware sequence model that analyzes streams of student actions (views, dwells,
 * likes, comments, follows, posts) to detect bots, automated scripts, and coordinated spam
 * before they distort campus recommendations.
 */

export type UserActionType =
  | "VIEW_POST"
  | "DWELL"
  | "LIKE"
  | "UNLIKE"
  | "COMMENT"
  | "FOLLOW"
  | "UNFOLLOW"
  | "CREATE_POST"
  | "REPOST"
  | "REPORT"
  | "SEARCH";

export interface UserActionEvent {
  userId: string;
  action: UserActionType;
  targetId?: string;
  targetAuthorId?: string;
  timestamp: number; // Unix ms
  dwellMs?: number;
  metadata?: {
    text?: string;
    surface?: string;
    ipHash?: string;
  };
}

export interface BDSMHeadScores {
  LikeBot: number; // 0.0 - 1.0
  ReplySpamBot: number; // 0.0 - 1.0
  FollowBot: number; // 0.0 - 1.0
  PostSpamBot: number; // 0.0 - 1.0
  EngagementAmplifier: number; // 0.0 - 1.0
  LegitimateUser: number; // 0.0 - 1.0
}

export type EnforcementTier = "ALLOW" | "THROTTLE" | "CHALLENGE" | "HOLD_REVIEW";

export interface BDSMEvaluationResult {
  riskScore: number; // 0 to 100
  tier: EnforcementTier;
  heads: BDSMHeadScores;
  flags: string[];
  isBotSuspected: boolean;
}

/**
 * Evaluates an account's recent sequence of actions to compute
 * time-aware regularity, cadence burstiness, and abuse head probabilities.
 */
export function evaluateActionSequence(events: UserActionEvent[]): BDSMEvaluationResult {
  const flags: string[] = [];
  const heads: BDSMHeadScores = {
    LikeBot: 0.02,
    ReplySpamBot: 0.01,
    FollowBot: 0.01,
    PostSpamBot: 0.01,
    EngagementAmplifier: 0.02,
    LegitimateUser: 0.95,
  };

  if (!events || events.length === 0) {
    return {
      riskScore: 0,
      tier: "ALLOW",
      heads,
      flags: [],
      isBotSuspected: false,
    };
  }

  // Sort events chronologically
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const now = sorted[sorted.length - 1].timestamp;

  // Windows
  const window10s = sorted.filter((e) => now - e.timestamp <= 10_000);
  const window60s = sorted.filter((e) => now - e.timestamp <= 60_000);
  const window5m = sorted.filter((e) => now - e.timestamp <= 300_000);

  // 1. Scarecrow Rule: Like Burst & Cadence Regularity (LikeBot Head)
  const likesIn10s = window10s.filter((e) => e.action === "LIKE").length;
  const likesIn60s = window60s.filter((e) => e.action === "LIKE").length;

  if (likesIn10s >= 8 || likesIn60s >= 25) {
    heads.LikeBot = Math.min(1.0, 0.5 + (likesIn10s / 10) * 0.4);
    heads.LegitimateUser = Math.max(0.01, heads.LegitimateUser - 0.6);
    flags.push(`Rapid like burst: ${likesIn10s} likes in 10s`);
  }

  // Check timing regularity between consecutive likes (superhuman millisecond consistency)
  const likeEvents = sorted.filter((e) => e.action === "LIKE");
  if (likeEvents.length >= 5) {
    const intervals: number[] = [];
    for (let i = 1; i < likeEvents.length; i++) {
      intervals.push(likeEvents[i].timestamp - likeEvents[i - 1].timestamp);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // If stdDev < 40ms with short intervals, it's almost certainly an automated script
    if (stdDev < 50 && avgInterval < 1200) {
      heads.LikeBot = Math.max(heads.LikeBot, 0.92);
      flags.push(`Artificial cadence detected: uniform like intervals (stdDev: ${stdDev.toFixed(1)}ms)`);
    }
  }

  // 2. Scarecrow Rule: Comment Duplication & Spam Flood (ReplySpamBot Head)
  const comments = window5m.filter((e) => e.action === "COMMENT");
  if (comments.length >= 4) {
    const texts = comments
      .map((c) => c.metadata?.text?.trim().toLowerCase())
      .filter((t): t is string => Boolean(t));

    const duplicateCounts = new Map<string, number>();
    for (const text of texts) {
      duplicateCounts.set(text, (duplicateCounts.get(text) || 0) + 1);
    }

    const maxDuplicates = Math.max(0, ...Array.from(duplicateCounts.values()));
    if (maxDuplicates >= 3) {
      heads.ReplySpamBot = Math.min(1.0, 0.6 + maxDuplicates * 0.1);
      heads.LegitimateUser = Math.max(0.01, heads.LegitimateUser - 0.7);
      flags.push(`Repeated identical comment payload (${maxDuplicates}x)`);
    }

    if (comments.length >= 10 && now - comments[0].timestamp <= 30_000) {
      heads.ReplySpamBot = Math.max(heads.ReplySpamBot, 0.88);
      flags.push(`Mass comment flood: ${comments.length} comments in 30s`);
    }
  }

  // 3. Scarecrow Rule: Follow Churn & Mass Follow (FollowBot Head)
  const followsIn60s = window60s.filter((e) => e.action === "FOLLOW").length;
  if (followsIn60s >= 15) {
    heads.FollowBot = Math.min(1.0, 0.5 + (followsIn60s / 20) * 0.5);
    heads.LegitimateUser = Math.max(0.01, heads.LegitimateUser - 0.5);
    flags.push(`Mass follow churn: ${followsIn60s} follows in 60s`);
  }

  // 4. Post Flood (PostSpamBot Head)
  const postsIn5m = window5m.filter((e) => e.action === "CREATE_POST").length;
  if (postsIn5m >= 6) {
    heads.PostSpamBot = Math.min(1.0, 0.4 + (postsIn5m / 8) * 0.5);
    flags.push(`High frequency post creation: ${postsIn5m} posts in 5m`);
  }

  // Compute composite risk score (0 to 100)
  const maxAbuseHead = Math.max(
    heads.LikeBot,
    heads.ReplySpamBot,
    heads.FollowBot,
    heads.PostSpamBot,
    heads.EngagementAmplifier
  );

  const riskScore = Math.min(
    100,
    Math.round(
      maxAbuseHead * 80 +
        (1.0 - heads.LegitimateUser) * 20 +
        (flags.length > 0 ? flags.length * 5 : 0)
    )
  );

  let tier: EnforcementTier = "ALLOW";
  if (riskScore >= 75) {
    tier = "HOLD_REVIEW";
  } else if (riskScore >= 50) {
    tier = "CHALLENGE";
  } else if (riskScore >= 30) {
    tier = "THROTTLE";
  }

  return {
    riskScore,
    tier,
    heads,
    flags,
    isBotSuspected: riskScore >= 50,
  };
}
