"use client";

import * as React from "react";
import { TimeCapsuleCard, type TimeCapsuleData } from "./time-capsule-card";

export default function TimeCapsuleCardDemo() {
  // Target date set to 28 days into the future for live countdown demo
  const targetDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

  const sampleCapsule: TimeCapsuleData = {
    id: "capsule-batch-2025",
    title: "Batch of 2025 Graduation Vault",
    description: "Final semester predictions, hostel memories, and unsaid confessions locked until convocation night.",
    category: "Campus Legacy",
    coverImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='50%' stop-color='%231e293b'/><stop offset='100%' stop-color='%23334155'/></linearGradient></defs><rect width='800' height='400' fill='url(%23g)'/><circle cx='200' cy='180' r='140' fill='%23f59e0b' fill-opacity='0.2'/><circle cx='600' cy='220' r='180' fill='%2310b981' fill-opacity='0.15'/></svg>",
    targetUnlockDate: targetDate,
    isUnlocked: false,
    totalEntriesBuried: 142,
  };

  return (
    <div className="flex min-h-[580px] w-full items-center justify-center bg-background py-8 px-4">
      <TimeCapsuleCard capsule={sampleCapsule} />
    </div>
  );
}
