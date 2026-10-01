import type { CommentWithAuthor } from "@/components/post/comment-item";

export interface CommentRankingOptions {
  postAuthorId?: string | null;
  viewerInstitutionId?: string | null;
  viewerId?: string | null;
  likedCommentIds?: Record<string, boolean>;
  sortMode?: "TOP" | "LATEST";
}

/**
 * Instagram & Twitter/X Comment Relevance Algorithm:
 * 1. Pinned comment: Author/Admin pinned comment receives absolute priority (+50,000).
 * 2. OP (Original Poster) boost: Comments by the thread creator (+1500).
 * 3. Verified Student boost: Gold Star / verified students (LP >= 150: +250, LP >= 50: +80).
 * 4. Same Campus boost: Classmates from the same college campus (+150).
 * 5. Community Likes: Real DB likesCount (+90 per like) + viewer like (+60).
 * 6. Discussion depth: Comments that sparked replies (+120 per reply).
 * 7. Substance bonus: Thoughtful, detailed responses over low-effort comments.
 * 8. Time decay: Half-life decay over 72 hours.
 */
export function calculateCommentScore(
  comment: CommentWithAuthor,
  repliesCount: number,
  options: CommentRankingOptions
): number {
  // Pinned comments always top the feed
  if (comment.isPinned) {
    return 50000;
  }

  let score = 0;

  // 1. OP (Author) Boost — Highest priority in Instagram & Twitter
  const isOp = Boolean(options.postAuthorId && comment.authorId && comment.authorId === options.postAuthorId);
  if (isOp) {
    score += 1500;
  }

  // 2. Same Campus Boost — Classmates from the same university
  if (
    options.viewerInstitutionId &&
    comment.author?.institutionId &&
    options.viewerInstitutionId === comment.author.institutionId
  ) {
    score += 150;
  }

  // 3. Verified / High-Clout Student Boost
  const authorPoints = comment.author?.points || 0;
  if (authorPoints >= 150) {
    score += 250;
  } else if (authorPoints >= 50) {
    score += 80;
  }

  // 4. Community Likes (Durable database likes + viewer state)
  const isLikedByViewer = Boolean(options.likedCommentIds?.[comment.id] || comment.hasLiked);
  const totalLikes = Math.max(comment.likesCount || 0, isLikedByViewer ? 1 : 0);
  score += totalLikes * 90;
  if (isLikedByViewer) {
    score += 60;
  }

  // 5. Discussion Depth (Replies spawned)
  const totalReplies = Math.max(repliesCount, comment.repliesCount || 0);
  score += totalReplies * 120;

  // 6. Substance Bonus (meaningful content vs single emoji)
  const bodyLen = (comment.body || "").trim().length;
  if (bodyLen > 80) {
    score += 40;
  } else if (bodyLen > 25) {
    score += 20;
  }

  // 7. Time Decay (Decay over 72 hours)
  const createdAtTime = new Date(comment.createdAt).getTime();
  const hoursAgo = Math.max(0, (Date.now() - createdAtTime) / (1000 * 60 * 60));
  const freshnessMultiplier = Math.max(0.2, 1 - hoursAgo / 72);

  return score * freshnessMultiplier;
}

/**
 * Organizes comments into a strict 2-level flat hierarchy (Instagram/Threads by Meta model)
 * and sorts top-level comments using either the algorithmic "TOP" score or chronological "LATEST".
 */
export function rankAndThreadComments(
  comments: CommentWithAuthor[],
  options: CommentRankingOptions = {}
): {
  topLevelComments: CommentWithAuthor[];
  repliesMap: Map<string, CommentWithAuthor[]>;
} {
  const commentMap = new Map<string, CommentWithAuthor>();
  for (const comment of comments) {
    commentMap.set(comment.id, comment);
  }

  // Resolve root ancestor for any nested reply to enforce strict 2-level flat tree
  function findRootParentId(startParentId: string): string {
    let currentId = startParentId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parent = commentMap.get(currentId);
      if (!parent || !parent.parentId) {
        return currentId;
      }
      currentId = parent.parentId;
    }
    return startParentId;
  }

  const repliesMap = new Map<string, CommentWithAuthor[]>();
  const topLevel: CommentWithAuthor[] = [];

  // Group into root comments vs child replies (flattened to root)
  for (const comment of comments) {
    if (comment.parentId) {
      const rootId = findRootParentId(comment.parentId);
      const existing = repliesMap.get(rootId) || [];
      existing.push(comment);
      repliesMap.set(rootId, existing);
    } else {
      topLevel.push(comment);
    }
  }

  // Sort child replies chronologically (natural conversational flow like Threads/Instagram)
  for (const replyList of repliesMap.values()) {
    replyList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const sortMode = options.sortMode || "TOP";

  if (sortMode === "LATEST") {
    // Pinned comments first, then newest first
    topLevel.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else {
    // Algorithmic relevance (Pinned comments receive +50,000)
    topLevel.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const repliesA = repliesMap.get(a.id)?.length || a.repliesCount || 0;
      const repliesB = repliesMap.get(b.id)?.length || b.repliesCount || 0;
      const scoreA = calculateCommentScore(a, repliesA, options);
      const scoreB = calculateCommentScore(b, repliesB, options);
      return scoreB - scoreA;
    });
  }

  return {
    topLevelComments: topLevel,
    repliesMap,
  };
}
