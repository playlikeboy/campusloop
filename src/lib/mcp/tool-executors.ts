import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  academicResources,
  comments,
  communities,
  communityMembers,
  conversationParticipants,
  conversations,
  institutions,
  messages,
  pollOptions,
  posts,
  stories,
  userProfiles,
  votes,
} from "@/db/schema";
import { runSafetyCheck } from "@/lib/moderation/rules";
import type { McpContext } from "./types";

export type McpToolHandler = (context: McpContext, args: Record<string, any>) => Promise<any>;

export const MCP_TOOL_EXECUTORS: Record<string, McpToolHandler> = {
  // ─── 1. FEED & POSTS ────────────────────────────────────────────────────────
  campusloop_get_feed: async (context, args) => {
    const db = getDb();
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
    const scope = args.scope === "GLOBAL" ? "GLOBAL" : "CAMPUS";
    const filter = args.filter || "ALL";

    const conditions = [];

    if (scope === "CAMPUS" && context.institutionId) {
      conditions.push(eq(posts.institutionId, context.institutionId));
    }

    if (filter === "CONFESSIONS") {
      conditions.push(eq(posts.type, "CONFESSION"));
    } else if (filter === "POLLS") {
      conditions.push(eq(posts.type, "POLL"));
    } else if (filter === "MEMES") {
      conditions.push(eq(posts.type, "MEME"));
    }

    conditions.push(eq(posts.status, "PUBLISHED"));

    // Check user's active memberships to respect private community boundaries
    const myMemberships = await db.query.communityMembers.findMany({
      where: and(
        eq(communityMembers.userId, context.userId),
        eq(communityMembers.status, "ACTIVE")
      ),
      columns: { communityId: true },
    });
    const allowedCommunityIds = new Set(myMemberships.map((m) => m.communityId));

    const feedPosts = await db.query.posts.findMany({
      where: and(...conditions),
      orderBy: [desc(posts.createdAt)],
      limit: limit * 2,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
            role: true,
          },
        },
        institution: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        community: {
          columns: {
            id: true,
            name: true,
            slug: true,
            privacy: true,
          },
        },
        votes: {
          columns: { value: true },
        },
        comments: {
          columns: { id: true },
        },
      },
    });

    // Exclude posts from private communities unless user is an active member
    const visiblePosts = feedPosts
      .filter((p) => {
        if (!p.community) return true;
        if (p.community.privacy === "PRIVATE") {
          return allowedCommunityIds.has(p.community.id);
        }
        return true;
      })
      .slice(0, limit);

    return {
      scope,
      filter,
      count: visiblePosts.length,
      posts: visiblePosts.map((p) => {
        const score = (p.votes || []).reduce((acc, v) => acc + (v.value || 0), 0);
        return {
          id: p.id,
          title: p.title,
          body: p.body,
          type: p.type,
          scope: p.scope,
          isAnonymous: p.isAnonymous,
          pseudonym: p.isAnonymous ? p.pseudonym || "Anonymous" : null,
          author: p.isAnonymous ? null : p.author,
          college: p.institution?.name || "Campus",
          community: p.community ? { id: p.community.id, name: p.community.name } : null,
          votesCount: score,
          commentsCount: (p.comments || []).length,
          createdAt: p.createdAt,
        };
      }),
    };
  },

  campusloop_search_posts: async (context, args) => {
    const db = getDb();
    const query = String(args.query || "").trim();
    if (!query) throw new Error("Search query is required");
    const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);
    const scope = args.scope === "GLOBAL" ? "GLOBAL" : "CAMPUS";

    const conditions = [
      or(ilike(posts.body, `%${query}%`), ilike(posts.title, `%${query}%`)),
      eq(posts.status, "PUBLISHED"),
    ];

    if (scope === "CAMPUS" && context.institutionId) {
      conditions.push(eq(posts.institutionId, context.institutionId));
    }

    const myMemberships = await db.query.communityMembers.findMany({
      where: and(
        eq(communityMembers.userId, context.userId),
        eq(communityMembers.status, "ACTIVE")
      ),
      columns: { communityId: true },
    });
    const allowedCommunityIds = new Set(myMemberships.map((m) => m.communityId));

    const matchedPosts = await db.query.posts.findMany({
      where: and(...conditions),
      orderBy: [desc(posts.createdAt)],
      limit: limit * 2,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            points: true,
          },
        },
        institution: {
          columns: { id: true, name: true },
        },
        community: {
          columns: { id: true, name: true, slug: true, privacy: true },
        },
        votes: {
          columns: { value: true },
        },
        comments: {
          columns: { id: true },
        },
      },
    });

    const visiblePosts = matchedPosts
      .filter((p) => {
        if (!p.community) return true;
        if (p.community.privacy === "PRIVATE") {
          return allowedCommunityIds.has(p.community.id);
        }
        return true;
      })
      .slice(0, limit);

    return {
      query,
      resultsCount: visiblePosts.length,
      results: visiblePosts.map((p) => {
        const score = (p.votes || []).reduce((acc, v) => acc + (v.value || 0), 0);
        return {
          id: p.id,
          title: p.title,
          excerpt: p.body?.slice(0, 200),
          author: p.isAnonymous ? p.pseudonym || "Anonymous" : p.author?.displayName,
          college: p.institution?.name,
          community: p.community ? { id: p.community.id, name: p.community.name } : null,
          votesCount: score,
          commentsCount: (p.comments || []).length,
          createdAt: p.createdAt,
        };
      }),
    };
  },

  campusloop_get_post_details: async (context, args) => {
    const db = getDb();
    const postId = String(args.postId || "").trim();
    if (!postId) throw new Error("postId is required");

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
            role: true,
          },
        },
        institution: {
          columns: { id: true, name: true, slug: true },
        },
        community: {
          columns: { id: true, name: true, slug: true, privacy: true, creatorId: true },
        },
        pollOptions: true,
        votes: {
          columns: { value: true },
        },
      },
    });

    if (!post) throw new Error(`Post '${postId}' not found`);

    // Verify object-level privacy boundaries: private community posts require membership
    if (post.community && post.community.privacy === "PRIVATE") {
      const isMember = await db.query.communityMembers.findFirst({
        where: and(
          eq(communityMembers.communityId, post.community.id),
          eq(communityMembers.userId, context.userId),
          eq(communityMembers.status, "ACTIVE")
        ),
      });
      if (!isMember && post.community.creatorId !== context.userId) {
        throw new Error("Unauthorized: Post belongs to a private community.");
      }
    }

    const topComments = await db.query.comments.findMany({
      where: eq(comments.postId, postId),
      orderBy: [desc(comments.createdAt)],
      limit: 20,
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const score = (post.votes || []).reduce((acc, v) => acc + (v.value || 0), 0);

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      type: post.type,
      scope: post.scope,
      isAnonymous: post.isAnonymous,
      pseudonym: post.isAnonymous ? post.pseudonym || "Anonymous" : null,
      author: post.isAnonymous ? null : post.author,
      college: post.institution?.name,
      community: post.community ? { id: post.community.id, name: post.community.name, slug: post.community.slug } : null,
      votesCount: score,
      commentsCount: topComments.length,
      pollOptions: post.pollOptions || [],
      createdAt: post.createdAt,
      comments: topComments.map((c) => ({
        id: c.id,
        body: c.body,
        author: c.isAnonymous ? c.pseudonym || "Anonymous" : c.author?.displayName || "Student",
        createdAt: c.createdAt,
      })),
    };
  },

  campusloop_create_post: async (context, args) => {
    const db = getDb();
    const body = String(args.body || "").trim();
    if (!body) throw new Error("Post body is required");

    const title = args.title ? String(args.title).trim().slice(0, 200) : null;
    const scope = args.scope === "GLOBAL" ? "GLOBAL" : "CAMPUS";

    const safety = runSafetyCheck({ title, body });
    if (safety.blocked) {
      throw new Error(`Content Blocked: ${safety.messages.join(" ")}`);
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        authorId: context.userId,
        institutionId: context.institutionId,
        title,
        body,
        type: "NORMAL",
        scope,
        isAnonymous: false,
        status: safety.status,
        riskScore: safety.riskScore,
      })
      .returning();

    return {
      success: true,
      postId: newPost.id,
      postUrl: `/post/${newPost.id}`,
      title: newPost.title,
      status: newPost.status,
      createdAt: newPost.createdAt,
    };
  },

  campusloop_create_confession: async (context, args) => {
    const db = getDb();
    const body = String(args.body || "").trim();
    if (!body) throw new Error("Confession body is required");

    const title = args.title ? String(args.title).trim().slice(0, 200) : null;
    const pseudonym = args.pseudonym
      ? String(args.pseudonym).trim().replace(/^[#@]/, "").slice(0, 50)
      : `anon_${randomUUID().slice(0, 8)}`;

    const safety = runSafetyCheck({ title, body });
    if (safety.blocked) {
      throw new Error(`Confession Blocked: ${safety.messages.join(" ")}`);
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        authorId: context.userId,
        institutionId: context.institutionId,
        title,
        body,
        type: "CONFESSION",
        scope: "CAMPUS",
        isAnonymous: true,
        pseudonym,
        status: safety.status,
        riskScore: safety.riskScore,
      })
      .returning();

    return {
      success: true,
      confessionId: newPost.id,
      postUrl: `/post/${newPost.id}`,
      pseudonym: newPost.pseudonym,
      status: newPost.status,
      message: "Confession published with cryptographic identity escrow.",
      createdAt: newPost.createdAt,
    };
  },

  campusloop_create_poll: async (context, args) => {
    const db = getDb();
    const question = String(args.question || "").trim();
    if (!question) throw new Error("Poll question is required");

    const rawOptions = Array.isArray(args.options) ? args.options : [];
    const options = rawOptions
      .map((opt) => String(opt).trim())
      .filter((opt) => opt.length > 0)
      .slice(0, 6);

    if (options.length < 2) {
      throw new Error("Poll must contain at least 2 valid options");
    }

    const body = args.body ? String(args.body).trim() : question;
    const safety = runSafetyCheck({ title: question, body });
    if (safety.blocked) {
      throw new Error(`Poll Blocked: ${safety.messages.join(" ")}`);
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        authorId: context.userId,
        institutionId: context.institutionId,
        title: question,
        body,
        type: "POLL",
        scope: "CAMPUS",
        isAnonymous: false,
        status: safety.status,
      })
      .returning();

    const createdOptions = [];
    for (const optText of options) {
      const [opt] = await db
        .insert(pollOptions)
        .values({
          postId: newPost.id,
          text: optText,
        })
        .returning();
      createdOptions.push({ id: opt.id, text: opt.text });
    }

    return {
      success: true,
      pollId: newPost.id,
      postUrl: `/post/${newPost.id}`,
      question,
      options: createdOptions,
      createdAt: newPost.createdAt,
    };
  },

  campusloop_vote_post: async (context, args) => {
    const db = getDb();
    const postId = String(args.postId || "").trim();
    const direction = String(args.direction || "UP").toUpperCase();

    const targetPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });
    if (!targetPost) throw new Error(`Post '${postId}' not found`);

    if (targetPost.communityId) {
      const comm = await db.query.communities.findFirst({
        where: eq(communities.id, targetPost.communityId),
      });
      if (comm && comm.privacy === "PRIVATE") {
        const isMember = await db.query.communityMembers.findFirst({
          where: and(
            eq(communityMembers.communityId, comm.id),
            eq(communityMembers.userId, context.userId),
            eq(communityMembers.status, "ACTIVE")
          ),
        });
        if (!isMember && comm.creatorId !== context.userId) {
          throw new Error("Unauthorized: Cannot vote on a post in a private community you have not joined.");
        }
      }
    }

    let voteValue = 1;
    if (direction === "DOWN") voteValue = -1;
    else if (direction === "REMOVE") voteValue = 0;

    const existingVote = await db.query.votes.findFirst({
      where: and(eq(votes.postId, postId), eq(votes.userId, context.userId)),
    });

    if (voteValue === 0) {
      if (existingVote) {
        await db.delete(votes).where(eq(votes.id, existingVote.id));
      }
    } else if (existingVote) {
      await db.update(votes).set({ value: voteValue }).where(eq(votes.id, existingVote.id));
    } else {
      await db.insert(votes).values({
        postId,
        userId: context.userId,
        value: voteValue,
      });
    }

    const allVotes = await db.query.votes.findMany({
      where: eq(votes.postId, postId),
      columns: { value: true },
    });
    const currentScore = allVotes.reduce((acc, v) => acc + (v.value || 0), 0);

    return {
      success: true,
      postId,
      userVote: voteValue,
      currentVotesCount: currentScore,
    };
  },

  campusloop_add_comment: async (context, args) => {
    const db = getDb();
    const postId = String(args.postId || "").trim();
    const body = String(args.body || "").trim();
    if (!postId || !body) throw new Error("postId and comment body are required");

    const targetPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });
    if (!targetPost) throw new Error(`Post '${postId}' not found`);

    if (targetPost.communityId) {
      const comm = await db.query.communities.findFirst({
        where: eq(communities.id, targetPost.communityId),
      });
      if (comm && comm.privacy === "PRIVATE") {
        const isMember = await db.query.communityMembers.findFirst({
          where: and(
            eq(communityMembers.communityId, comm.id),
            eq(communityMembers.userId, context.userId),
            eq(communityMembers.status, "ACTIVE")
          ),
        });
        if (!isMember && comm.creatorId !== context.userId) {
          throw new Error("Unauthorized: Cannot comment on a post in a private community you have not joined.");
        }
      }
    }

    const isAnonymous = Boolean(args.isAnonymous);
    const pseudonym = isAnonymous ? `anon_${randomUUID().slice(0, 8)}` : null;

    const safety = runSafetyCheck({ body });
    if (safety.blocked) {
      throw new Error(`Comment Blocked: ${safety.messages.join(" ")}`);
    }

    const [comment] = await db
      .insert(comments)
      .values({
        postId,
        authorId: context.userId,
        parentId: args.parentId || null,
        body,
        isAnonymous,
        pseudonym,
        status: safety.status,
      })
      .returning();

    return {
      success: true,
      commentId: comment.id,
      postId,
      author: isAnonymous ? pseudonym : context.user.displayName,
      body: comment.body,
      createdAt: comment.createdAt,
    };
  },

  // ─── 2. DIRECT MESSAGING & CHAT ─────────────────────────────────────────────
  campusloop_list_chats: async (context, args) => {
    const db = getDb();
    const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);

    const participations = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, context.userId),
      limit,
      with: {
        conversation: {
          with: {
            participants: {
              with: {
                user: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    lastSeenAt: true,
                  },
                },
              },
            },
            messages: {
              orderBy: [desc(messages.createdAt)],
              limit: 1,
            },
          },
        },
      },
    });

    const chats = participations.map((p) => {
      const conv = p.conversation;
      const otherParticipant = conv.participants.find((part) => part.userId !== context.userId)?.user;
      const lastMessage = conv.messages?.[0];

      return {
        conversationId: conv.id,
        type: conv.type,
        peer: otherParticipant
          ? {
              id: otherParticipant.id,
              username: otherParticipant.username,
              displayName: otherParticipant.displayName,
              avatarUrl: otherParticipant.avatarUrl,
            }
          : null,
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              senderId: lastMessage.senderId,
              isMe: lastMessage.senderId === context.userId,
              createdAt: lastMessage.createdAt,
            }
          : null,
      };
    });

    return {
      total: chats.length,
      chats,
    };
  },

  campusloop_get_chat_history: async (context, args) => {
    const db = getDb();
    const conversationId = String(args.conversationId || "").trim();
    if (!conversationId) throw new Error("conversationId is required");
    const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 50);

    const isMember = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, context.userId)
      ),
    });
    if (!isMember) {
      throw new Error("Unauthorized to access this conversation");
    }

    const messageList = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
      limit,
    });

    return {
      conversationId,
      messages: messageList.reverse().map((m) => ({
        id: m.id,
        senderId: m.senderId,
        isMe: m.senderId === context.userId,
        body: m.body,
        createdAt: m.createdAt,
      })),
    };
  },

  campusloop_send_direct_message: async (context, args) => {
    const db = getDb();
    const conversationId = String(args.conversationId || "").trim();
    const content = String(args.content || "").trim();
    if (!conversationId || !content) {
      throw new Error("conversationId and content are required");
    }

    const isMember = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, context.userId)
      ),
    });
    if (!isMember) {
      throw new Error("Unauthorized to send into this conversation");
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: context.userId,
        body: content,
      })
      .returning();

    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));

    return {
      success: true,
      messageId: newMessage.id,
      conversationId,
      sentAt: newMessage.createdAt,
    };
  },

  // ─── 3. COMMUNITIES & CLUBS ─────────────────────────────────────────────────
  campusloop_list_communities: async (context, args) => {
    const db = getDb();
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 30);
    const filter = args.filter || "ALL";

    let commList;
    if (filter === "JOINED") {
      const myMemberships = await db.query.communityMembers.findMany({
        where: and(
          eq(communityMembers.userId, context.userId),
          eq(communityMembers.status, "ACTIVE")
        ),
        limit,
        with: { community: true },
      });
      commList = myMemberships.map((m) => m.community).filter(Boolean);
    } else {
      // Respect privacy boundaries: do not leak UNLISTED or PRIVATE communities
      const myMemberships = await db.query.communityMembers.findMany({
        where: and(
          eq(communityMembers.userId, context.userId),
          eq(communityMembers.status, "ACTIVE")
        ),
        columns: { communityId: true },
      });
      const myCommIds = new Set(myMemberships.map((m) => m.communityId));

      const all = await db.query.communities.findMany({
        where: ne(communities.privacy, "UNLISTED"),
        orderBy: [desc(communities.points), desc(communities.createdAt)],
        limit: limit * 2,
      });

      commList = all
        .filter((c) => c.privacy === "PUBLIC" || myCommIds.has(c.id) || c.creatorId === context.userId)
        .slice(0, limit);
    }

    return {
      filter,
      count: commList.length,
      communities: commList.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        category: c.category,
        privacy: c.privacy,
        points: c.points,
      })),
    };
  },

  campusloop_get_community: async (context, args) => {
    const db = getDb();
    const idOrSlug = String(args.communityIdOrSlug || "").trim();
    if (!idOrSlug) throw new Error("communityIdOrSlug is required");

    const comm = await db.query.communities.findFirst({
      where: or(eq(communities.id, idOrSlug), eq(communities.slug, idOrSlug)),
    });
    if (!comm) throw new Error(`Community '${idOrSlug}' not found`);

    const isMember = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, context.userId),
        eq(communityMembers.status, "ACTIVE")
      ),
    });
    const isCreator = comm.creatorId === context.userId;

    if (comm.privacy === "UNLISTED" && !isMember && !isCreator) {
      throw new Error(`Community '${idOrSlug}' not found`);
    }

    if (comm.privacy === "PRIVATE" && !isMember && !isCreator) {
      throw new Error("Unauthorized: Private community. Active membership required to view community contents.");
    }

    const recentPosts = await db.query.posts.findMany({
      where: and(eq(posts.communityId, comm.id), eq(posts.status, "PUBLISHED")),
      orderBy: [desc(posts.createdAt)],
      limit: 10,
    });

    const membersTotal = await db
      .select({ count: count() })
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, comm.id), eq(communityMembers.status, "ACTIVE")));

    return {
      community: {
        id: comm.id,
        name: comm.name,
        slug: comm.slug,
        description: comm.description,
        category: comm.category,
        privacy: comm.privacy,
        membersCount: membersTotal[0]?.count || 0,
        points: comm.points,
        rules: comm.rules,
      },
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        bodyExcerpt: p.body?.slice(0, 150),
        createdAt: p.createdAt,
      })),
    };
  },

  campusloop_post_to_community: async (context, args) => {
    const db = getDb();
    const communityId = String(args.communityId || "").trim();
    const body = String(args.body || "").trim();
    if (!communityId || !body) throw new Error("communityId and body are required");

    const comm = await db.query.communities.findFirst({
      where: eq(communities.id, communityId),
    });
    if (!comm) throw new Error(`Community '${communityId}' not found`);

    // Verify object-level permission: must be active member or creator
    const isMember = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, context.userId),
        eq(communityMembers.status, "ACTIVE")
      ),
    });
    if (!isMember && comm.creatorId !== context.userId) {
      throw new Error("Unauthorized: You must be an active member to post in this community.");
    }

    const title = args.title ? String(args.title).trim().slice(0, 200) : null;
    const safety = runSafetyCheck({ title, body });
    if (safety.blocked) {
      throw new Error(`Content Blocked: ${safety.messages.join(" ")}`);
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        authorId: context.userId,
        communityId: comm.id,
        institutionId: context.institutionId,
        title,
        body,
        type: "NORMAL",
        scope: "CAMPUS",
        isAnonymous: false,
        status: safety.status,
      })
      .returning();

    await db
      .update(communities)
      .set({ points: sql`${communities.points} + 5` })
      .where(eq(communities.id, comm.id));

    return {
      success: true,
      postId: newPost.id,
      postUrl: `/post/${newPost.id}`,
      communityName: comm.name,
      createdAt: newPost.createdAt,
    };
  },

  campusloop_join_leave_community: async (context, args) => {
    const db = getDb();
    const communityId = String(args.communityId || "").trim();
    const action = String(args.action || "JOIN").toUpperCase();

    const comm = await db.query.communities.findFirst({
      where: eq(communities.id, communityId),
    });
    if (!comm) throw new Error(`Community '${communityId}' not found`);

    const existing = await db.query.communityMembers.findFirst({
      where: and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, context.userId)),
    });

    if (action === "JOIN") {
      if (!existing) {
        const initialStatus = comm.privacy === "PRIVATE" ? "PENDING" : "ACTIVE";
        await db.insert(communityMembers).values({
          communityId,
          userId: context.userId,
          role: "MEMBER",
          status: initialStatus,
        });

        if (initialStatus === "PENDING") {
          return {
            success: true,
            action: "REQUESTED",
            status: "PENDING",
            communityName: comm.name,
            message: "Membership request submitted for admin approval.",
          };
        }
      }
      return { success: true, action: "JOINED", status: "ACTIVE", communityName: comm.name };
    } else {
      if (existing) {
        await db.delete(communityMembers).where(eq(communityMembers.id, existing.id));
      }
      return { success: true, action: "LEFT", communityName: comm.name };
    }
  },

  // ─── 4. ACADEMICS & NOTES VAULT ─────────────────────────────────────────────
  campusloop_search_academic_notes: async (_context, args) => {
    const db = getDb();
    const query = String(args.query || "").trim();
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
    const category = args.category || "ALL";

    const conditions = [];

    if (query) {
      conditions.push(
        or(
          ilike(academicResources.title, `%${query}%`),
          ilike(academicResources.subjectName, `%${query}%`),
          ilike(academicResources.subjectCode, `%${query}%`)
        )
      );
    }

    if (category !== "ALL") {
      conditions.push(eq(academicResources.resourceType, category));
    }

    const resources = await db.query.academicResources.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(academicResources.downloadsCount), desc(academicResources.upvotesCount)],
      limit,
      with: {
        institution: { columns: { name: true } },
      },
    });

    return {
      query,
      count: resources.length,
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        subject: `${r.subjectCode} - ${r.subjectName}`,
        branch: r.branch,
        semester: `Semester ${r.semester}`,
        type: r.resourceType,
        downloadsCount: r.downloadsCount,
        upvotesCount: r.upvotesCount,
        driveUrl: r.driveUrl || r.fileUrl,
        college: r.institution?.name,
      })),
    };
  },

  campusloop_get_note_details: async (_context, args) => {
    const db = getDb();
    const resourceId = String(args.resourceId || "").trim();
    if (!resourceId) throw new Error("resourceId is required");

    const note = await db.query.academicResources.findFirst({
      where: eq(academicResources.id, resourceId),
      with: {
        institution: true,
        uploader: {
          columns: { displayName: true, username: true },
        },
      },
    });
    if (!note) throw new Error(`Academic resource '${resourceId}' not found`);

    return {
      id: note.id,
      title: note.title,
      subjectCode: note.subjectCode,
      subjectName: note.subjectName,
      branch: note.branch,
      semester: note.semester,
      resourceType: note.resourceType,
      moduleOrChapter: note.moduleOrChapter,
      description: note.description,
      driveUrl: note.driveUrl || note.fileUrl,
      downloadsCount: note.downloadsCount,
      upvotesCount: note.upvotesCount,
      uploader: note.uploader?.displayName || "Student",
      college: note.institution?.name,
      createdAt: note.createdAt,
    };
  },

  campusloop_upload_academic_note: async (context, args) => {
    const db = getDb();
    const title = String(args.title || "").trim();
    const subject = String(args.subject || "").trim();
    const url = String(args.url || "").trim();
    const category = String(args.category || "NOTES").toUpperCase();

    if (!title || !subject || !url) {
      throw new Error("title, subject, and url are required");
    }

    const [newResource] = await db
      .insert(academicResources)
      .values({
        institutionId: context.institutionId,
        uploaderId: context.userId,
        title,
        subjectCode: subject.split(" ")[0]?.toUpperCase() || "GEN101",
        subjectName: subject,
        resourceType: category,
        driveUrl: url,
        description: args.description ? String(args.description).trim() : null,
        semester: Number(args.semester?.replace(/\D/g, "")) || 1,
      })
      .returning();

    // Reward student with +20 LP
    await db
      .update(userProfiles)
      .set({ points: sql`${userProfiles.points} + 20` })
      .where(eq(userProfiles.id, context.userId));

    return {
      success: true,
      resourceId: newResource.id,
      title: newResource.title,
      pointsAwarded: 20,
      message: "Academic note shared with campus vault! +20 Loop Points awarded.",
    };
  },

  // ─── 5. COLLEGES & CAMPUSES ─────────────────────────────────────────────────
  campusloop_search_colleges: async (_context, args) => {
    const db = getDb();
    const query = String(args.query || "").trim();
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);

    const collegeList = await db.query.institutions.findMany({
      where: or(
        ilike(institutions.name, `%${query}%`),
        ilike(institutions.district, `%${query}%`),
        ilike(institutions.state, `%${query}%`),
        ilike(institutions.slug, `%${query}%`)
      ),
      limit,
    });

    return {
      query,
      count: collegeList.length,
      colleges: collegeList.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        district: c.district,
        state: c.state,
        website: c.website,
      })),
    };
  },

  campusloop_get_college_pulse: async (context, args) => {
    const db = getDb();
    const target = args.collegeIdOrSlug ? String(args.collegeIdOrSlug).trim() : context.institutionId;

    const college = await db.query.institutions.findFirst({
      where: or(eq(institutions.id, target), eq(institutions.slug, target)),
    });
    if (!college) throw new Error("College not found");

    const topPosts = await db.query.posts.findMany({
      where: and(eq(posts.institutionId, college.id), eq(posts.status, "PUBLISHED")),
      orderBy: [desc(posts.createdAt)],
      limit: 5,
    });

    return {
      college: {
        id: college.id,
        name: college.name,
        slug: college.slug,
        district: college.district,
        state: college.state,
      },
      topDiscussions: topPosts.map((p) => ({
        id: p.id,
        title: p.title,
        bodyExcerpt: p.body?.slice(0, 100),
        createdAt: p.createdAt,
      })),
    };
  },

  // ─── 6. PROFILE & LOOP POINTS ───────────────────────────────────────────────
  campusloop_get_my_profile: async (context) => {
    return {
      profile: {
        id: context.user.id,
        username: context.user.username,
        displayName: context.user.displayName,
        email: context.user.email,
        college: context.institutionName,
        course: context.user.course,
        branch: context.user.branch,
        year: context.user.year,
        points: context.user.points,
        role: context.user.role,
        interests: context.user.interests,
        avatarUrl: context.user.avatarUrl,
        anonymousUsername: context.user.anonymousUsername,
      },
    };
  },

  campusloop_get_user_profile: async (_context, args) => {
    const db = getDb();
    const username = String(args.username || "")
      .trim()
      .replace(/^@/, "");
    if (!username) throw new Error("username is required");

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.username, username),
      with: {
        institution: { columns: { name: true, slug: true } },
      },
    });
    if (!user) throw new Error(`Student '@${username}' not found`);

    return {
      username: user.username,
      displayName: user.displayName,
      college: user.institution?.name,
      course: user.course,
      branch: user.branch,
      year: user.year,
      points: user.points,
      interests: user.interests,
      avatarUrl: user.avatarUrl,
    };
  },

  campusloop_get_loop_points_history: async (context) => {
    const pts = context.user.points || 0;
    let tier = "Campus Freshman";
    let nextMilestone = 100;

    if (pts >= 500) {
      tier = "Campus Legend (Top 1%)";
      nextMilestone = 1000;
    } else if (pts >= 250) {
      tier = "Senior Influencer";
      nextMilestone = 500;
    } else if (pts >= 100) {
      tier = "Verified Campus Insider";
      nextMilestone = 250;
    }

    return {
      currentBalance: pts,
      tier,
      nextPerkAt: nextMilestone,
      unlockedPerks: [
        pts >= 150 ? "Verified Student Badge" : null,
        pts >= 100 ? "Custom Confession Avatar" : null,
        pts >= 50 ? "Community Creator Access" : null,
      ].filter(Boolean),
    };
  },

  // ─── 7. STORIES & VIBES ─────────────────────────────────────────────────────
  campusloop_get_campus_stories: async (_context) => {
    const db = getDb();
    const now = new Date();

    const activeStories = await db.query.stories.findMany({
      where: sql`${stories.expiresAt} > ${now}`,
      orderBy: [desc(stories.createdAt)],
      limit: 20,
      with: {
        user: {
          columns: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return {
      activeStoriesCount: activeStories.length,
      stories: activeStories.map((s) => ({
        id: s.id,
        mediaUrl: s.mediaUrl,
        text: s.text,
        author: s.user?.displayName,
        createdAt: s.createdAt,
      })),
    };
  },

  campusloop_post_story: async (context, args) => {
    const db = getDb();
    const mediaUrl = String(args.mediaUrl || "").trim();
    if (!mediaUrl) throw new Error("mediaUrl is required");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [newStory] = await db
      .insert(stories)
      .values({
        userId: context.userId,
        mediaUrl,
        text: args.caption ? String(args.caption).trim().slice(0, 200) : null,
        expiresAt,
      })
      .returning();

    return {
      success: true,
      storyId: newStory.id,
      mediaUrl: newStory.mediaUrl,
      expiresAt: newStory.expiresAt,
      message: "24-hour campus story published successfully.",
    };
  },

  // ─── 8. EXCLUSIVE AI & INTELLIGENCE FEATURES ────────────────────────────────
  campusloop_generate_campus_digest: async (context, args) => {
    const db = getDb();
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const scope = args.scope === "GLOBAL" ? "GLOBAL" : "CAMPUS";

    const conditions = [eq(posts.status, "PUBLISHED"), sql`${posts.createdAt} > ${since}`];

    if (scope === "CAMPUS" && context.institutionId) {
      conditions.push(eq(posts.institutionId, context.institutionId));
    }

    const recent = await db.query.posts.findMany({
      where: and(...conditions),
      orderBy: [desc(posts.createdAt)],
      limit: 15,
      with: {
        institution: { columns: { name: true } },
      },
    });

    const confessions = recent.filter((p) => p.type === "CONFESSION");
    const polls = recent.filter((p) => p.type === "POLL");
    const general = recent.filter((p) => p.type === "NORMAL" || p.type === "MEME");

    return {
      digestHeadline: `Campus Pulse Briefing for ${context.institutionName}`,
      period: "Last 48 Hours",
      summary: {
        totalDiscussionsAnalyzed: recent.length,
        hotTopics: recent.slice(0, 3).map((p) => p.title || p.body.slice(0, 60)),
        topConfessionScoop: confessions[0]?.body || "No high-scoring confessions this morning.",
        activeCampusPoll: polls[0]?.title || "No active trending polls.",
        topPlacementOrAcademicNotice:
          general.find(
            (p) => p.body.toLowerCase().includes("placement") || p.body.toLowerCase().includes("exam")
          )?.body || "Standard semester operations reported.",
      },
      recommendedAction: "Review upcoming semester deadlines and vote on active student polls.",
    };
  },

  campusloop_ask_academic_tutor: async (_context, args) => {
    const db = getDb();
    const question = String(args.question || "").trim();
    if (!question) throw new Error("question is required");

    // Search relevant study resources from the student's campus
    const keywords = question
      .split(" ")
      .filter((w) => w.length > 3)
      .slice(0, 3);
    const searchTerms = keywords.length > 0 ? keywords.join(" ") : question;

    const relevantNotes = await db.query.academicResources.findMany({
      where: or(
        ilike(academicResources.title, `%${searchTerms}%`),
        ilike(academicResources.subjectName, `%${searchTerms}%`)
      ),
      limit: 3,
    });

    return {
      question,
      tutorAnalysis: {
        topicIdentified: args.subject || "General Engineering / Science",
        groundedResourcesFound: relevantNotes.length,
        studyNotesCitations: relevantNotes.map((n) => ({
          title: n.title,
          subject: n.subjectName,
          link: n.driveUrl || n.fileUrl,
        })),
        examPreparationAdvice: [
          "Review previous year questions (PYQs) for this topic in the Academic Vault.",
          "Check step-by-step formula derivations and edge cases.",
          "Collaborate with peers in the related subject community.",
        ],
      },
    };
  },

  campusloop_audit_post_safety: async (_context, args) => {
    const text = String(args.text || "").trim();
    const title = args.title ? String(args.title).trim() : null;
    if (!text) throw new Error("text is required");

    const safety = runSafetyCheck({ title, body: text });

    // Explicit PII detection breakdown
    const phoneDetected = /(?:\+?91[-.\s]?)?[6-9]\d{9}\b/.test(text);
    const emailDetected = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
    const roomDetected = /\b(?:room|flat|hostel|block|wing)\s+[a-z0-9-]{1,10}\b/i.test(text);

    return {
      isSafeToPost: !safety.blocked,
      riskScore: safety.riskScore,
      status: safety.status,
      warnings: safety.messages,
      piiAudit: {
        phoneNumberFound: phoneDetected,
        emailFound: emailDetected,
        hostelRoomFound: roomDetected,
      },
      recommendation: safety.blocked
        ? "DO NOT POST: High safety violation detected."
        : phoneDetected || roomDetected
          ? "CAUTION: Specific hostel room or phone number detected. Consider redacting before sharing publicly."
          : "PASSED: Content adheres to CampusLoop safety guidelines.",
    };
  },

  campusloop_dating_vibe_compatibility: async (context, args) => {
    const db = getDb();
    const targetUsername = String(args.targetUsername || "")
      .trim()
      .replace(/^@/, "");
    if (!targetUsername) throw new Error("targetUsername is required");

    const targetUser = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.username, targetUsername),
      with: { institution: true },
    });
    if (!targetUser) throw new Error(`Target student '@${targetUsername}' not found`);

    const myInterests = new Set((context.user.interests as string[]) || []);
    const theirInterests = new Set((targetUser.interests as string[]) || []);

    const commonInterests = [...myInterests].filter((i) => theirInterests.has(i));
    const isSameCampus = context.institutionId === targetUser.institutionId;

    let score = 50;
    if (isSameCampus) score += 20;
    score += Math.min(commonInterests.length * 10, 30);

    return {
      me: context.user.displayName,
      target: targetUser.displayName,
      compatibilityScore: Math.min(score, 99),
      sameCampus: isSameCampus,
      mutualInterests: commonInterests,
      vibeVerdict:
        score >= 80
          ? "High Resonance! Strong campus & interest alignment."
          : score >= 65
            ? "Good Chemistry. Shared college ground with room for conversation."
            : "Opposites Attract. Distinct passions and different branches.",
    };
  },

  campusloop_trigger_community_webhook: async (context, args) => {
    const db = getDb();
    const communityId = String(args.communityId || "").trim();
    const body = String(args.body || "").trim();
    const title = args.title ? String(args.title).trim() : null;
    const botName = args.botName ? String(args.botName).trim() : "IDE Agent";

    if (!communityId || !body) throw new Error("communityId and body are required");

    const comm = await db.query.communities.findFirst({
      where: eq(communities.id, communityId),
    });
    if (!comm) throw new Error(`Community '${communityId}' not found`);

    // Verify student is an admin or creator of the community
    const isCreator = comm.creatorId === context.userId;
    const adminMembership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, context.userId),
        eq(communityMembers.role, "ADMIN")
      ),
    });

    if (!isCreator && !adminMembership) {
      throw new Error("Only community admins can trigger webhooks for this community");
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        authorId: context.userId,
        communityId: comm.id,
        institutionId: context.institutionId,
        title,
        body,
        type: "NORMAL",
        scope: "CAMPUS",
        isAnonymous: true,
        pseudonym: `🤖 ${botName}`,
        status: "PUBLISHED",
      })
      .returning();

    return {
      success: true,
      postId: newPost.id,
      postUrl: `/post/${newPost.id}`,
      communityName: comm.name,
      botName,
      message: "Automated alert published via community webhook pipeline.",
    };
  },

  campusloop_get_campus_sentiment_pulse: async (context) => {
    const db = getDb();
    const recentPosts = await db.query.posts.findMany({
      where: and(eq(posts.institutionId, context.institutionId), eq(posts.status, "PUBLISHED")),
      orderBy: [desc(posts.createdAt)],
      limit: 30,
    });

    let examMentions = 0;
    let festMentions = 0;
    let foodMentions = 0;

    for (const p of recentPosts) {
      const text = `${p.title || ""} ${p.body}`.toLowerCase();
      if (
        text.includes("exam") ||
        text.includes("midsem") ||
        text.includes("quiz") ||
        text.includes("cgpa")
      ) {
        examMentions++;
      }
      if (
        text.includes("fest") ||
        text.includes("concert") ||
        text.includes("dj") ||
        text.includes("hackathon")
      ) {
        festMentions++;
      }
      if (
        text.includes("mess") ||
        text.includes("canteen") ||
        text.includes("food") ||
        text.includes("hostel")
      ) {
        foodMentions++;
      }
    }

    return {
      institution: context.institutionName,
      sampleSize: recentPosts.length,
      sentimentBarometer: {
        academicStress: examMentions > 5 ? "Elevated (Midsems / Quiz Season)" : "Normal",
        socialExcitement: festMentions > 3 ? "High (Campus Fest / Hackathon Buzz)" : "Moderate",
        hostelLivingBuzz: foodMentions > 3 ? "Active (Hostel / Mess Discussions)" : "Calm",
      },
      overallMood:
        festMentions > examMentions
          ? "High Campus Energy & Anticipation"
          : examMentions > 5
            ? "Serious Exam / Preparation Mode"
            : "Balanced Campus Routine",
    };
  },
};
