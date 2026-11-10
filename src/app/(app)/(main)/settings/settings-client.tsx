"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeviceSection, MoreSection, NotificationsSection } from "./account-section";
import { AppSection, FeedSection, MessagesSection } from "./preferences-sections";
import { ProfileSection } from "./profile-section";

interface SettingsClientProps {
  profile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    course: string | null;
    branch: string | null;
    year: number | null;
    role: string;
    points: number;
    institutionName: string | null;
    anonymousUsername?: string | null;
    feedVisibility?: string;
  };
}

/** Settings, grouped: profile, feed, messages, notifications, app, more, this device. */
export function SettingsClient({ profile }: SettingsClientProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 pb-32 sm:px-6">
      <header className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to feed">
          <Link href="/feeds">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-2xl text-fg">Settings</h1>
      </header>

      <div className="space-y-8">
        <ProfileSection profile={profile} />
        <FeedSection initialVisibility={profile.feedVisibility} />
        <MessagesSection />
        <NotificationsSection />
        <AppSection />
        <MoreSection username={profile.username} />
        <DeviceSection />
      </div>
    </div>
  );
}
