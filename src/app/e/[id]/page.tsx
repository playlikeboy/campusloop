import EventDetailPage from "@/app/(app)/(events)/events/[id]/page";

/**
 * Same title, description, canonical (/e/<slug>) and noindex rules as the
 * in-app event page, so drafts and college-only events stay out of search.
 */
export { generateMetadata } from "@/app/(app)/(events)/events/[id]/page";

/**
 * Public event page. Outside the auth-gated `(main)` layout so a QR scan or a
 * shared link opens the event itself; registering still requires an account.
 */
export default EventDetailPage;
