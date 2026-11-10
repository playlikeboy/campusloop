import { SecretCrushSkeleton } from "@/components/dating/secret-crush-panel";

export default function CrushLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pt-4 pb-24">
      <h1 className="text-2xl text-fg">Secret Crush</h1>
      <SecretCrushSkeleton />
    </div>
  );
}
