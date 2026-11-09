import type { Metadata } from "next";
import { AdminShell } from "@/components/shells/admin-shell";
import { resolveAdminSession } from "./_lib/guard";
import { getInboxCounts } from "./_lib/inbox";

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

  // Header badge: everything waiting in the inbox (held posts, reports, hub requests).
  const pendingReviewCount = (await getInboxCounts(db)).total;

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
