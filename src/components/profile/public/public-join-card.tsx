import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionSticker } from "@/components/ui/stickers";

/** Sign-up prompt for visitors who are not logged in. */
export function PublicJoinCard({ username }: { username: string }) {
  const returnUrl = encodeURIComponent(`/@${username}`);
  return (
    <QuestionSticker prompt={`Want to talk to @${username}?`}>
      <div className="space-y-3">
        <p className="text-sm text-fg">Join with your college email to follow, message and see your campus feed.</p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={`/join?mode=signup&returnUrl=${returnUrl}`}>Join with college email</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/join?mode=signin&returnUrl=${returnUrl}`}>I already have an account</Link>
          </Button>
        </div>
      </div>
    </QuestionSticker>
  );
}
