export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background select-none">
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative size-12 sm:size-14">
          <div className="absolute -inset-2 rounded-full bg-primary/15 blur-lg animate-pulse" />
          <img
            src="/logo.png"
            alt="CampusLoop"
            className="relative size-12 sm:size-14 object-contain drop-shadow-sm"
          />
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-primary animate-[shimmer-swipe_1.4s_infinite_ease-in-out]" />
        </div>
      </div>
    </div>
  );
}
