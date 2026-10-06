/**
 * 🎯 Centralized Feed Ranking & Recommendation Weights
 * Used by the Phoenix Multi-Action Ranker, Diversity Reranker, and Feed Scoring Pipeline.
 *
 * Structured for experimentation and continuous tuning:
 * score = relevance
 *       + freshness
 *       + campus_affinity
 *       + interaction_probability
 *       + conversation_probability
 *       + quality
 *       + novelty
 *       + creator_affinity
 *       + topic_affinity
 *       + social_context
 *       - repetition_penalty
 *       - fatigue_penalty
 */
export const RANKING_WEIGHTS = {
  /** Baseline time-decay coefficient (higher = faster decay of old content) */
  freshness: 45.0,
  /** Decay half-life power factor */
  freshnessHalfLifePower: 0.75,
  /** Direct query / topic relevance multiplier */
  relevance: 10.0,
  /** Boost for posts originating from the viewer's verified college hub */
  campusAffinity: 500.0,
  /** Boost for posts by authors the viewer follows */
  socialAffinity: 800.0,
  /** Boost for mutual friends on campus */
  friendAffinity: 1200.0,
  /** Weight on P(like) / vote interaction */
  interactionProbability: 3.5,
  /** Weight on high-intent conversation / replies (conversations > passive likes) */
  conversationProbability: 5.0,
  /** Exploration budget bonus for new creators and cold-start posts */
  novelty: 25.0,
  /** Penalty multiplier for adjacent posts of the exact same category (DPP diversity) */
  diversity: 0.85,
  /** Fatigue penalty when the same post has been seen/skipped */
  fatiguePenalty: -15.0,
  /** Author repetition penalty on consecutive slots */
  repetitionPenalty: 0.70,
} as const;

export type RankingWeights = typeof RANKING_WEIGHTS;
