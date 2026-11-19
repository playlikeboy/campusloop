import { LANDING_CONTAINER } from "./landing-hero";
import { LAUNCH_VIDEO } from "./launch-video-meta";
import { LaunchVideoPlayer } from "./launch-video-player";

/** The one-minute launch video, straight under the hero. */
export function LaunchVideo() {
  return (
    <section id="video" className={`${LANDING_CONTAINER} pt-24 sm:pt-28 lg:pt-32`} aria-labelledby="video-title">
      <div className="mb-8 flex flex-col gap-3 sm:mb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <h2
          id="video-title"
          className="max-w-[16ch] text-balance text-[length:var(--text-display-s)] leading-none text-fg"
        >
          {LAUNCH_VIDEO.heading}
        </h2>
        <p className="max-w-[42ch] text-pretty text-[length:var(--text-lead)] leading-snug text-fg-muted">
          What a day on CampusLoop looks like, from the first confession to the last poll.
        </p>
      </div>
      <LaunchVideoPlayer />
    </section>
  );
}
