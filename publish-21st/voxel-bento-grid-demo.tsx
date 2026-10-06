"use client";

import * as React from "react";
import { VoxelBentoGrid } from "./voxel-bento-grid";

export default function VoxelBentoGridDemo() {
  return (
    <div className="flex min-h-[640px] w-full items-center justify-center bg-background py-10 px-4">
      <VoxelBentoGrid />
    </div>
  );
}
