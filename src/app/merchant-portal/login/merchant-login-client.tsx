"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { homePathFor, merchantVertical } from "@/components/merchant/merchant-utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const TEAM_CONTACT = "https://www.instagram.com/campusloop.space/";

export function MerchantLoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Enter your store username and password.");
      return;
    }
    setError(null);
    setLoading(true);
    sounds.tap();
    haptics.medium();
    try {
      const res = await fetch("/api/merchant/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; merchant?: any };
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "That username or password is wrong. Check for typos and try again."
            : data.error || "Couldn't log you in. Try again."
        );
      }
      sounds.ting();
      haptics.success();
      toast.success(`Welcome back, ${data.merchant?.name || "there"}`);
      router.push(homePathFor(merchantVertical(data.merchant)));
      router.refresh();
    } catch (err) {
      sounds.pop();
      haptics.heavy();
      setError(err instanceof Error ? err.message : "Couldn't log you in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 py-4 text-fg sm:px-6">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="size-8 object-contain" />
          <span className="font-display text-base font-bold">CampusLoop</span>
        </Link>
        <Button asChild variant="ghost">
          <Link href="/marketplace">Back to CampusLoop</Link>
        </Button>
      </header>

      <main className="mx-auto my-auto w-full max-w-sm py-10">
        <div className="space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl font-extrabold">Log in to your store</h1>
            <p className="text-sm text-fg-muted">Take orders, update your menu and print your QR poster.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <FormField label="Store username">
              <Input
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="momohouse"
                aria-invalid={Boolean(error) || undefined}
              />
            </FormField>
            <FormField label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                  aria-invalid={Boolean(error) || undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </FormField>

            {error && (
              <p role="alert" className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Log in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Don't have a store login?{" "}
          <a
            href={TEAM_CONTACT}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-text underline-offset-4 hover:underline"
          >
            Message the CampusLoop team
          </a>
        </p>
      </main>
    </div>
  );
}
