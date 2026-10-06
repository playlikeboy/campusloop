"use client";

import * as React from "react";
import { VoxelMembershipTiers } from "./voxel-membership-tiers";

export default function VoxelMembershipTiersDemo() {
  return (
    <div className="flex min-h-[640px] w-full items-center justify-center bg-background py-8 px-4">
      <VoxelMembershipTiers />
    </div>
  );
}
