/**
 * 👁️ Visibility Filtering Engine
 * Inspired by Twitter/X's `visibility-filtering/` module.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * Ranking and visibility are separate stages:
 * - Ranking decides candidate order.
 * - Visibility filtering decides whether a post can be served to a specific viewer.
 */

export type VisibilityAction = "ALLOW" | "WARN_INTERSTITIAL" | "HOLD" | "DROP";

export interface PostVisibilityContext {
  postId: string;
  authorId?: string | null;
  status: "PUBLISHED" | "HIDDEN" | "DELETED" | "PENDING_REVIEW";
  riskScore: number;
  reportCount?: number;
  isAnonymous?: boolean;
}

export interface ViewerContext {
  viewerId?: string | null;
  blockedUserIds?: Set<string> | string[];
  mutedUserIds?: Set<string> | string[];
  showSensitiveContent?: boolean;
}

export interface VisibilityDecision {
  action: VisibilityAction;
  reason?: string;
}

export function evaluateVisibility(
  post: PostVisibilityContext,
  viewer?: ViewerContext
): VisibilityDecision {
  // 1. Deleted or Hidden Content: Absolute Drop
  if (post.status === "DELETED" || post.status === "HIDDEN") {
    return { action: "DROP", reason: "Post is deleted or hidden by author/moderator" };
  }

  // 2. Pending Moderation Review: Hold
  if (post.status === "PENDING_REVIEW") {
    // If viewer is the author, allow viewing their own post with pending warning
    if (viewer?.viewerId && post.authorId && viewer.viewerId === post.authorId) {
      return { action: "WARN_INTERSTITIAL", reason: "Your post is under review by campus moderators" };
    }
    return { action: "HOLD", reason: "Post is held in moderation queue" };
  }

  // 3. User Blocks and Mutes
  if (post.authorId && !post.isAnonymous) {
    const blockedSet = viewer?.blockedUserIds
      ? viewer.blockedUserIds instanceof Set
        ? viewer.blockedUserIds
        : new Set(viewer.blockedUserIds)
      : null;

    if (blockedSet?.has(post.authorId)) {
      return { action: "DROP", reason: "Author is blocked by viewer" };
    }

    const mutedSet = viewer?.mutedUserIds
      ? viewer.mutedUserIds instanceof Set
        ? viewer.mutedUserIds
        : new Set(viewer.mutedUserIds)
      : null;

    if (mutedSet?.has(post.authorId)) {
      return { action: "DROP", reason: "Author is muted by viewer" };
    }
  }

  // 4. Excessive Community Reports
  if ((post.reportCount || 0) >= 5) {
    return { action: "HOLD", reason: "Post exceeded community report threshold" };
  }

  // 5. High Risk Score Interstitial Warning
  if (post.riskScore >= 60 && !viewer?.showSensitiveContent) {
    return {
      action: "WARN_INTERSTITIAL",
      reason: "Post contains sensitive campus content",
    };
  }

  return { action: "ALLOW" };
}
