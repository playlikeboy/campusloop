import { InviteLeaderboard } from "@/components/invite/invite-leaderboard";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Invite friends");

export default function InvitesPage() {
  return <InviteLeaderboard />;
}
