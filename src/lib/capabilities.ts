import { NextResponse } from "next/server";
import { isViewerProfile } from "@/lib/viewer";

export type UserCapability =
  | "READ_PUBLIC_CONTENT"
  | "SAVE_POST"
  | "LIKE_POST"
  | "COMMENT_POST"
  | "CREATE_POST"
  | "JOIN_COMMUNITY"
  | "SEND_MESSAGE"
  | "CAMPUS_MATCH"
  | "SECRET_CRUSH"
  | "ANONYMOUS_POST"
  | "MARKETPLACE_ORDER";

const VIEWER_ALLOWED_CAPABILITIES: Set<UserCapability> = new Set(["READ_PUBLIC_CONTENT", "SAVE_POST"]);

const CAPABILITY_MESSAGES: Record<UserCapability, { title: string; desc: string }> = {
  READ_PUBLIC_CONTENT: {
    title: "Read public posts",
    desc: "See what students across India are posting.",
  },
  SAVE_POST: {
    title: "Save posts",
    desc: "Keep posts so you can read them later.",
  },
  LIKE_POST: {
    title: "Join with your college email to like posts",
    desc: "Liking is for verified students.",
  },
  COMMENT_POST: {
    title: "Join with your college email to comment",
    desc: "Commenting is for verified students from this college.",
  },
  CREATE_POST: {
    title: "Join with your college email to post",
    desc: "Share news and questions with your classmates.",
  },
  JOIN_COMMUNITY: {
    title: "Join with your college email to join communities",
    desc: "Join clubs, batch groups and interest groups.",
  },
  SEND_MESSAGE: {
    title: "Join with your college email to send messages",
    desc: "Message other verified students.",
  },
  CAMPUS_MATCH: {
    title: "Join with your college email to use Campus Match",
    desc: "Match with verified students. Both people have to say yes.",
  },
  SECRET_CRUSH: {
    title: "Join with your college email to send a Secret Crush",
    desc: "Tell a classmate you like them. They only find out if they like you too.",
  },
  ANONYMOUS_POST: {
    title: "Join with your college email to post anonymously",
    desc: "Post confessions without your name on them.",
  },
  MARKETPLACE_ORDER: {
    title: "Join with your college email to order",
    desc: "Rent bikes and buy from campus stores.",
  },
};

export interface CapabilitySubject {
  institutionId: string | null;
  role?: string | null;
}

/**
 * Check if a profile possesses a given capability.
 */
export async function hasCapability(
  profile: CapabilitySubject | null | undefined,
  capability: UserCapability
): Promise<boolean> {
  if (!profile) {
    return capability === "READ_PUBLIC_CONTENT";
  }

  const isViewer = await isViewerProfile({
    institutionId: profile.institutionId,
    role: profile.role,
  });
  if (isViewer || profile.role === "VIEWER") {
    return VIEWER_ALLOWED_CAPABILITIES.has(capability);
  }

  return true;
}

/**
 * API Guard: Returns a 403 Response with structured error metadata if capability is lacking.
 */
export async function rejectIfLacksCapability(
  profile: CapabilitySubject | null | undefined,
  capability: UserCapability
): Promise<NextResponse | null> {
  const allowed = await hasCapability(profile, capability);
  if (!allowed) {
    const meta = CAPABILITY_MESSAGES[capability];
    return NextResponse.json(
      {
        error: meta.desc,
        title: meta.title,
        previewMode: true,
        requiredCapability: capability,
      },
      { status: 403 }
    );
  }
  return null;
}
