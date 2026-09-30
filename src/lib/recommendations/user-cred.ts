/**
 * 🎖️ UserCred & Agatha Reputation Engine
 * Inspired by Twitter/X's `user-cred-v2/` (TweepCred PageRank mass) and `agatha/` (abuse-to-engagement reaction ratio).
 *
 * Evaluates an account's graph centrality, institutional verification,
 * and community reputation to prevent spam farms or bad actors from
 * dominating feed distribution.
 */

export interface UserCredSignals {
  userId: string;
  isVerifiedStudent: boolean;
  loopPoints: number;
  followerCount: number;
  followingCount: number;
  mutualFollowsCount: number;
  totalLikesReceived: number;
  totalReportsReceived: number;
  totalBlocksReceived?: number;
  accountAgeDays: number;
}

export interface UserCredResult {
  trustScore: number; // 0 to 100
  agathaRatio: number; // Ratio of negative feedback to positive engagement
  distributionMultiplier: number; // 0.2 to 1.5
  isHighCredibility: boolean;
  isSuppressed: boolean;
  reasons: string[];
}

export function computeUserCred(signals: UserCredSignals): UserCredResult {
  const reasons: string[] = [];
  let score = 50; // Neutral baseline

  // 1. Institutional Student Verification Bonus (+20)
  if (signals.isVerifiedStudent) {
    score += 20;
    reasons.push("Verified campus student");
  }

  // 2. Loop Points (LP) Clout Tier
  if (signals.loopPoints >= 150) {
    score += 15;
    reasons.push("Gold Star / Tier 3+ contributor");
  } else if (signals.loopPoints >= 50) {
    score += 8;
  }

  // 3. Graph Centrality (Mutual Follows & Organic Ratio)
  if (signals.mutualFollowsCount >= 10) {
    score += 10;
    reasons.push("High reciprocal campus network");
  } else if (signals.mutualFollowsCount >= 3) {
    score += 5;
  }

  // Churn penalty: following 500 people with 0 followers
  if (signals.followingCount > 100 && signals.followerCount < 5) {
    score -= 20;
    reasons.push("Unnatural follower-to-following ratio");
  }

  // 4. Agatha Reaction Ratio:
  // Is the rate of negative reactions (reports + blocks) unusually high
  // relative to positive reactions (likes received)?
  const positiveMass = Math.max(1, signals.totalLikesReceived);
  const negativeMass = signals.totalReportsReceived + (signals.totalBlocksReceived || 0);
  const agathaRatio = negativeMass / positiveMass;

  if (agathaRatio > 0.15 && negativeMass >= 3) {
    // Unusually toxic or reported account
    score -= 35;
    reasons.push(`High Agatha negative ratio: ${(agathaRatio * 100).toFixed(1)}%`);
  } else if (agathaRatio > 0.05 && negativeMass >= 5) {
    score -= 15;
  }

  // 5. Account Age Factor
  if (signals.accountAgeDays < 2) {
    score -= 5; // Cold start cautiousness
  } else if (signals.accountAgeDays > 60) {
    score += 5;
  }

  const trustScore = Math.max(0, Math.min(100, score));

  // Determine feed distribution multiplier
  let distributionMultiplier = 1.0;
  if (trustScore >= 80) {
    distributionMultiplier = 1.25; // High cred boost
  } else if (trustScore >= 60) {
    distributionMultiplier = 1.05;
  } else if (trustScore <= 25) {
    distributionMultiplier = 0.35; // Severe suppression
  } else if (trustScore <= 40) {
    distributionMultiplier = 0.75; // Mild suppression
  }

  return {
    trustScore,
    agathaRatio,
    distributionMultiplier,
    isHighCredibility: trustScore >= 75,
    isSuppressed: trustScore <= 30,
    reasons,
  };
}
