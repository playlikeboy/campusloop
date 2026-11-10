"use client";

import { SecretCrushPanel } from "@/components/dating/secret-crush-panel";

export function RequestsClient() {
  return (
    <div className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-2">
      <p className="text-sm text-fg-muted">
        Add up to 5 people you like. Nobody is told unless they add you too.
      </p>
      <SecretCrushPanel />
    </div>
  );
}
