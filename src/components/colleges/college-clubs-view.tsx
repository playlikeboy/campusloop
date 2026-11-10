"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface CollegeClubsViewProps {
  collegeName: string;
}

/**
 * Clubs live as communities. There is no per-college club list yet, so this
 * points students at communities instead of showing made-up clubs.
 */
export function CollegeClubsView({ collegeName }: CollegeClubsViewProps) {
  const shortName = collegeName.split(",")[0];
  return (
    <EmptyState
      icon={Users}
      bordered
      title={`Clubs at ${shortName}`}
      description="Clubs and societies show up here once they start a community."
      action={
        <Button asChild>
          <Link href="/communities/new">Start a community</Link>
        </Button>
      }
    />
  );
}
