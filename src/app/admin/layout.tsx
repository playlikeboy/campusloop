import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { posts } from "@/db/schema";
import { AdminShell } from "./_components/admin-shell";
import { resolveAdminSession } from "./_lib/guard";

export const metadata: Metadata = {
  title: {
    default: "CampusLoop Admin Console",
    template: "%s | CampusLoop Admin",
  },
  description: "Internal operations console — content review, telemetry, user management, and audit trails.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { db, profile } = await resolveAdminSession();

  const pendingReviewCount = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.status, "PENDING_REVIEW"))
    .then(([r]) => Number(r?.count ?? 0))
    .catch(() => 0);

  return (
    <AdminShell
      adminProfile={
        profile
          ? {
              displayName: profile.displayName,
              username: profile.username,
              email: profile.email,
              role: profile.role,
              avatarUrl: profile.avatarUrl,
            }
          : null
      }
      pendingReviewCount={pendingReviewCount}
    >
      {children}
    </AdminShell>
  );
}
