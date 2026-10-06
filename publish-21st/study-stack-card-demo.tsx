"use client";

import * as React from "react";
import { StudyStackCard } from "./study-stack-card";

export default function StudyStackCardDemo() {
  return (
    <div className="flex min-h-[500px] w-full items-center justify-center bg-background py-8 px-4">
      <StudyStackCard />
    </div>
  );
}
