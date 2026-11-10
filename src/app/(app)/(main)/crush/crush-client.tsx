"use client";

import { SecretCrushPanel } from "@/components/dating/secret-crush-panel";

export function CrushClient() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pt-4 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl text-fg">Secret Crush</h1>
        <p className="text-sm text-fg-muted">
          Add up to 5 people you like. Nobody is told unless they add you too.
        </p>
      </header>
      <SecretCrushPanel />
    </div>
  );
}
