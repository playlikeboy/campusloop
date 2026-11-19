/**
 * CampusLoop GA4 Creative Analytics & Custom Properties Engine
 *
 * Measurement ID: G-3546ZQ6HB1
 * Features:
 * - Dynamic Route & Single Page App (SPA) Pageview tracking with Content Grouping
 * - Custom User Dimensions: Student verification status, Institution, Branch, Semester, Loop Points Tier, PWA mode
 * - Rich Academic Vault Telemetry: Note Views, Downloads, 5-Download Guest Quota tracking, Limit Reached prompts, Votes, Shares
 * - Social Feed & Dating Telemetry: Post impressions, Confession interactions, Swipe matching
 * - Community, events, courses and Android beta download pipelines
 */

import { markMeaningfulAction } from "@/lib/notification-prompt";

export const GA_MEASUREMENT_ID = "G-3546ZQ6HB1";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Universal safe call to Google gtag
 */
export function gtag(...args: any[]) {
  if (typeof window !== "undefined") {
    if (typeof window.gtag === "function") {
      window.gtag(...args);
    } else if (window.dataLayer) {
      window.dataLayer.push(arguments);
    }
  }
}

/**
 * Dispatch custom GA4 event with standard parameters
 */
export function gtagEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  const enrichedParams = {
    send_to: GA_MEASUREMENT_ID,
    timestamp: new Date().toISOString(),
    is_pwa: typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
    theme:
      typeof document !== "undefined" && document.documentElement.classList.contains("dark")
        ? "dark"
        : "light",
    ...params,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, enrichedParams);
  } else if (window.dataLayer) {
    window.dataLayer.push(["event", eventName, enrichedParams]);
  }
}

/**
 * Set persistent GA4 User Properties
 */
export interface GA4UserProperties {
  user_type?: "guest" | "student" | "viewer" | "admin";
  institution_name?: string;
  institution_id?: string;
  branch?: string;
  semester?: number | string;
  loop_points_tier?: "bronze" | "silver" | "gold" | "campus_legend";
  anonymity_mode?: "all" | "no_anon";
  verified?: boolean;
  grad_year?: number | string;
  platform?: GA4Platform;
  signup_week?: string;
}

export type GA4Platform = "web" | "pwa" | "android" | "android_web";

export function setGA4UserProperties(props: GA4UserProperties) {
  if (typeof window === "undefined") return;

  const userProps: Record<string, any> = {};
  if (props.user_type) userProps.cl_user_type = props.user_type;
  if (props.institution_name) userProps.cl_institution = props.institution_name;
  if (props.institution_id) userProps.cl_institution_id = props.institution_id;
  if (props.branch) userProps.cl_branch = props.branch;
  if (props.semester) userProps.cl_semester = String(props.semester);
  if (props.loop_points_tier) userProps.cl_points_tier = props.loop_points_tier;
  if (props.anonymity_mode) userProps.cl_anon_mode = props.anonymity_mode;
  if (props.verified !== undefined) userProps.cl_verified = props.verified ? "yes" : "no";
  if (props.grad_year) userProps.cl_grad_year = String(props.grad_year);
  if (props.platform) userProps.cl_platform = props.platform;
  if (props.signup_week) userProps.cl_signup_week = props.signup_week;

  gtag("set", "user_properties", userProps);
}

/**
 * Bind GA4 sessions to a CampusLoop profile id (never an email or name).
 * Pass null on sign-out / guest so later hits are not attributed to the last user.
 */
export function setGA4UserId(profileId: string | null) {
  if (typeof window === "undefined") return;
  gtag("config", GA_MEASUREMENT_ID, { user_id: profileId ?? undefined, send_page_view: false });
  gtag("set", { user_id: profileId ?? null });
}

/**
 * web | pwa (installed, display-mode standalone) | android (the CampusLoop APK WebView, UA
 * "CampusLoopApp") | android_web (the Capacitor "CampusLoop Web" beta, UA "CampusLoopWebApp/1.0").
 */
export function detectPlatform(): GA4Platform {
  if (typeof window === "undefined") return "web";
  if (typeof navigator !== "undefined" && /CampusLoopWebApp/i.test(navigator.userAgent)) return "android_web";
  if (typeof navigator !== "undefined" && /CampusLoopApp/i.test(navigator.userAgent)) return "android";
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return "pwa";
  } catch {}
  return "web";
}

/** ISO-8601 week label, e.g. "2026-W47". */
export function isoWeek(input: Date | string | number): string | undefined {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Estimated graduation year from the current year of study (1-5).
 * Indian academic years end around June; a 4-year course is assumed.
 */
export function estimateGradYear(yearOfStudy: number | null | undefined, now = new Date()): number | undefined {
  if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 6) return undefined;
  const academicYearEnd = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return academicYearEnd + Math.max(0, 4 - yearOfStudy);
}

/**
 * Infer content group for Next.js App Router paths
 */
export function inferContentGroup(pathname: string): string {
  if (!pathname || pathname === "/") return "landing";
  if (pathname.startsWith("/app/academics/sources")) return "academic_sources";
  if (pathname.startsWith("/app/academics")) return "academics";
  if (pathname.startsWith("/app/matching") || pathname.startsWith("/app/dating")) return "dating";
  if (pathname.startsWith("/chat") || pathname.startsWith("/app/chat")) return "chat";
  if (pathname.startsWith("/board")) return "board";
  if (pathname.startsWith("/download")) return "download";
  if (pathname.startsWith("/courses")) return "courses";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/articles") || pathname.startsWith("/app/articles") || pathname.startsWith("/a/")) return "articles";
  if (
    pathname.startsWith("/app/college") ||
    pathname.startsWith("/colleges") ||
    pathname.startsWith("/college/")
  )
    return "colleges";
  if (pathname.startsWith("/communities") || pathname.startsWith("/app/communities") || pathname.startsWith("/c/")) return "communities";
  if (pathname.startsWith("/post") || pathname.startsWith("/app/post")) return "post_detail";
  if (pathname.startsWith("/profile") || pathname.startsWith("/app/profile") || pathname.startsWith("/@")) return "student_profile";
  if (pathname.startsWith("/confessions") || pathname.startsWith("/app/confessions")) return "confessions";
  if (pathname === "/app" || pathname === "/feeds") return "campus_feed";
  if (pathname.startsWith("/admin")) return "admin";
  return "other";
}

/**
 * Track SPA Route change as a virtual GA4 page_view
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined") return;

  const contentGroup = inferContentGroup(url);
  gtag("event", "page_view", {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: url,
    content_group: contentGroup,
    send_to: GA_MEASUREMENT_ID,
  });
}

// ─── 1. Creative Academic Vault Analytics ───

export function trackAcademicView(resource: {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  resourceType: string;
  institutionName?: string;
}) {
  gtagEvent("academic_material_view", {
    item_id: resource.id,
    item_name: resource.title,
    subject_code: resource.subjectCode,
    subject_name: resource.subjectName,
    branch: resource.branch,
    semester: resource.semester,
    resource_type: resource.resourceType,
    institution_name: resource.institutionName || "BIT Mesra",
    content_group: "academics",
  });
}

export function trackAcademicDownload(
  resource: {
    id: string;
    title: string;
    subjectCode: string;
    resourceType: string;
    fileUrl?: string | null;
  },
  isGuest: boolean,
  downloadsUsed: number
) {
  gtagEvent("academic_download", {
    item_id: resource.id,
    item_name: resource.title,
    subject_code: resource.subjectCode,
    resource_type: resource.resourceType,
    is_guest: isGuest,
    guest_downloads_count: downloadsUsed,
    free_downloads_remaining: isGuest ? Math.max(0, 5 - downloadsUsed) : "unlimited",
    value: 1,
    currency: "INR",
  });
}

export function trackAcademicLimitReached() {
  gtagEvent("academic_guest_limit_reached", {
    limit_threshold: 5,
    action: "blocked_download_and_showed_auth_modal",
    content_group: "academics",
  });
}

export function trackAcademicVote(resourceId: string, voteType: "UP" | "DOWN", subjectCode?: string) {
  gtagEvent("academic_vote", {
    resource_id: resourceId,
    vote_type: voteType,
    subject_code: subjectCode,
  });
}

export function trackAcademicShare(
  resourceId: string,
  subjectCode?: string,
  method: "share_api" | "clipboard" = "clipboard"
) {
  gtagEvent("share", {
    content_type: "academic_resource",
    item_id: resourceId,
    subject_code: subjectCode,
    method,
  });
}

export function trackAcademicSearch(query: string, branch?: string, semester?: string, type?: string) {
  gtagEvent("search", {
    search_term: query,
    filter_branch: branch,
    filter_semester: semester,
    filter_type: type,
    content_group: "academics",
  });
}

export function trackAcademicSourceClick(source: {
  id: string;
  name: string;
  university: string;
  action: "browse_internal" | "visit_external";
}) {
  gtagEvent("academic_source_engagement", {
    source_id: source.id,
    source_name: source.name,
    university: source.university,
    action: source.action,
  });
}

// ─── 2. Social Feed & Engagement Analytics ───

export function trackFeedSwitch(scope: "campus" | "global", anonymityMode: "all" | "no_anon") {
  gtagEvent("feed_filter_change", {
    feed_scope: scope,
    anonymity_mode: anonymityMode,
  });
}

export function trackPostEngagement(
  postId: string,
  action: "like" | "comment" | "repost" | "save" | "poll_vote",
  postType?: string,
  isAnonymous?: boolean
) {
  gtagEvent("post_engagement", {
    post_id: postId,
    action_type: action,
    post_type: postType || "POST",
    is_anonymous: Boolean(isAnonymous),
  });
}

// ─── 3. Campus Match & Dating Analytics ───

export function trackDatingSwipe(action: "like" | "pass" | "superlike", scope: "campus" | "global") {
  gtagEvent("dating_swipe", {
    swipe_action: action,
    matching_scope: scope,
  });
}

export function trackDatingMatch() {
  gtagEvent("dating_match_unlocked", {
    event_category: "dating",
  });
}

// ─── 4. Growth, PWA & Auth Modals ───

export function trackAuthModalTrigger(reason: string, returnTo?: string) {
  gtagEvent("auth_modal_prompted", {
    trigger_reason: reason,
    return_to: returnTo || "",
  });
}

export function trackAuthModalCta(reason: string, cta: "sign_in" | "dismiss") {
  gtagEvent("auth_modal_action", {
    trigger_reason: reason,
    cta_choice: cta,
  });
}

export function trackPWAInstallOutcome(outcome: "accepted" | "dismissed") {
  gtagEvent("pwa_install_prompt_outcome", {
    outcome,
  });
}

// ─── 5. Core product events (GA4 recommended + CampusLoop custom) ───
// Every helper is a one-liner at the call site. Fire only after the action succeeded.

export type AuthMethod = "email" | "password" | "otp" | "magic_link" | "google" | "github" | "oauth" | string;
export type PostContentType = "post" | "confession" | "poll";

/** GA4 recommended: sign_up (key event). */
export function trackSignUp(method: AuthMethod) {
  gtagEvent("sign_up", { method });
}

/** GA4 recommended: login. */
export function trackLogin(method: AuthMethod) {
  gtagEvent("login", { method });
}

const AUTH_KEY = "cl_ga_uid";

/**
 * Hexclave's prebuilt <SignIn/>/<SignUp/> give no success callback, so sign_up and
 * login are inferred once the profile loads: a profile created in the last 15 minutes
 * is a sign_up; any other profile id this browser has not reported yet is a login.
 * Call with null when the user signs out so the next sign-in counts again.
 */
export function trackAuthFromProfile(profile: { id: string; createdAt?: string | null } | null) {
  if (typeof window === "undefined") return;
  try {
    if (!profile) {
      localStorage.removeItem(AUTH_KEY);
      return;
    }
    if (localStorage.getItem(AUTH_KEY) === profile.id) return;
    localStorage.setItem(AUTH_KEY, profile.id);
    const created = profile.createdAt ? new Date(profile.createdAt).getTime() : 0;
    if (created && Date.now() - created < 15 * 60_000) trackSignUp("hexclave");
    else trackLogin("hexclave");
  } catch {}
}

/** GA4 recommended: tutorial_complete = onboarding finished. */
export function trackOnboardingComplete() {
  gtagEvent("tutorial_complete", { feature: "onboarding" });
}

/** Custom: post_create (key event). */
export function trackPostCreate(params: { content_type: PostContentType; anonymous?: boolean; feature?: string }) {
  gtagEvent("post_create", {
    content_type: params.content_type,
    anonymous: Boolean(params.anonymous),
    feature: params.feature ?? "feed",
  });
  markMeaningfulAction();
}

/** Custom: vote on a post / poll / comment / resource. */
export function trackVote(content_type: string, extra: { item_id?: string; direction?: "up" | "down" | "remove" } = {}) {
  gtagEvent("vote", { content_type, ...extra });
}

/** Custom: comment_create. */
export function trackCommentCreate(content_type = "post", extra: { item_id?: string; anonymous?: boolean } = {}) {
  gtagEvent("comment_create", { content_type, ...extra });
  markMeaningfulAction();
}

/** GA4 recommended: share. */
export function trackShare(method: string, content_type: string, item_id?: string) {
  gtagEvent("share", { method, content_type, item_id });
}

/** GA4 recommended: search. */
export function trackSearch(search_term: string, scope?: string) {
  if (!search_term.trim()) return;
  gtagEvent("search", { search_term: search_term.trim().slice(0, 100), scope });
}

/** GA4 recommended: select_content. */
export function trackSelectContent(content_type: string, item_id: string) {
  gtagEvent("select_content", { content_type, item_id });
}

/** Custom: event_register (key event). */
export function trackEventRegister(event_id: string) {
  gtagEvent("event_register", { event_id, content_type: "event" });
  markMeaningfulAction();
}

/** Custom: course_enroll (key event). */
export function trackCourseEnroll(course_id: string) {
  gtagEvent("course_enroll", { course_id, content_type: "course" });
  markMeaningfulAction();
}

/** Custom: lecture_complete. */
export function trackLectureComplete(course_id: string, lecture_id: string) {
  gtagEvent("lecture_complete", { course_id, lecture_id, content_type: "lecture" });
}

/** Custom: chat_send. */
export function trackChatSend(params: { scope?: "dm" | "group" | "community" | string; content_type?: string } = {}) {
  gtagEvent("chat_send", { scope: params.scope ?? "dm", content_type: params.content_type ?? "text" });
  markMeaningfulAction();
}

/** GA4 recommended: join_group, sent as custom community_join. */
export function trackCommunityJoin(community_id: string) {
  gtagEvent("community_join", { community_id, content_type: "community" });
  markMeaningfulAction();
}

/** Custom: streak_qualify (first qualifying action of the day). */
export function trackStreakQualify(params: { streak?: number; feature?: string } = {}) {
  gtagEvent("streak_qualify", params);
}

/** Custom: follow. */
export function trackFollow(target_id: string) {
  gtagEvent("follow", { content_type: "user", item_id: target_id });
}

/** Custom: apk_download (key event). placement = where the button lives. */
export type ApkVariant = "expo" | "capacitor" | "twa";

/** `variant`: which Android beta (expo = native app, capacitor = CampusLoop Web, twa = Chrome app). */
export function trackApkDownload(
  placement: "download_page" | "landing" | "settings" | string,
  variant: ApkVariant = "expo"
) {
  gtagEvent("apk_download", { placement, variant, method: "github_release" });
}

/** Custom: crush_send. */
export function trackCrushSend() {
  gtagEvent("crush_send", { feature: "secret_crush" });
}

/** Custom: notification_open. */
export function trackNotificationOpen(content_type?: string) {
  gtagEvent("notification_open", { content_type: content_type ?? "notification" });
}

/** Custom: board_view {tab}. */
export function trackBoardView(tab: "rides" | "housing" | "lost-found" | "sell" | string) {
  gtagEvent("board_view", { tab, content_group: "board" });
}

/**
 * Landing launch video. "play" sends video_start, "progress" with 25/50/75 sends
 * video_progress, "complete" sends video_complete, "unmute" sends video_unmute.
 */
export function trackLaunchVideo(action: "play" | "progress" | "complete" | "unmute", percent?: number) {
  const base = { video_title: "CampusLoop launch", video_provider: "self", content_group: "landing" };
  if (action === "play") gtagEvent("video_start", { ...base, video_percent: 0 });
  else if (action === "progress") gtagEvent("video_progress", { ...base, video_percent: percent });
  else if (action === "complete") gtagEvent("video_complete", { ...base, video_percent: 100 });
  else gtagEvent("video_unmute", { ...base, video_percent: percent });
}

/** Custom: onboarding_step {step}. Fired when a screen of the onboarding flow is finished. */
export function trackOnboardingStep(step: "you" | "taste" | "follow" | "first_post", extra: Record<string, unknown> = {}) {
  gtagEvent("onboarding_step", { step, feature: "onboarding", ...extra });
}

/** Custom: first_post (activation). Also counts as post_create. */
export function trackFirstPost(params: { anonymous: boolean; source: "rating" | "text" }) {
  gtagEvent("first_post", { feature: "onboarding", anonymous: params.anonymous, method: params.source });
  gtagEvent("post_create", { content_type: "post", anonymous: params.anonymous, feature: "onboarding" });
}

/** Custom: signup_wall_cta {placement, method}. The sign-up card after the logged-out preview. */
export function trackSignupWallCta(placement: "feeds" | "confessions", method: "google" | "email") {
  gtagEvent("signup_wall_cta", { placement, method });
}

/** Custom: growth_unlock {item}. A Loop Points purchase: streak freeze or crush hints. */
export function trackGrowthUnlock(item: "streak_freeze" | "crush_hints", via: "points" | "invites") {
  gtagEvent("growth_unlock", { item, via });
}
