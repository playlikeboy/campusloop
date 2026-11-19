// Shapes returned by the CampusLoop web API (only the fields the app reads).
export type Author = {
  id?: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
} | null;

export type Post = {
  id: string;
  title?: string | null;
  body: string;
  type: string;
  isAnonymous: boolean;
  pseudonym?: string | null;
  authorId?: string | null;
  author?: Author;
  createdAt: string;
  votesCount: number;
  commentsCount: number;
  userVote: number;
  institution?: { name?: string | null } | null;
};

export type Comment = {
  id: string;
  body: string;
  isAnonymous: boolean;
  pseudonym?: string | null;
  author?: Author;
  createdAt: string;
};

export type EventItem = {
  id: string;
  slug?: string | null;
  title: string;
  tagline?: string | null;
  description?: string | null;
  bannerUrl?: string | null;
  clubName?: string | null;
  eventType?: string | null;
  mode?: string | null;
  venue?: string | null;
  meetingUrl?: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  participationType?: string | null;
  isPaid?: boolean | null;
  entryFee?: number | string | null;
  prizesDescription?: string | null;
  attendeeCount?: number;
  isRegistered?: boolean;
  isClosed?: boolean;
  isLiveNow?: boolean;
  status?: string | null;
  institution?: { name?: string | null } | null;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  level?: string | null;
  language?: string | null;
  thumbnailUrl?: string | null;
  instructorName?: string | null;
  provider?: string | null;
  lecturesCount?: number | null;
};

export type Conversation = {
  id: string;
  title?: string | null;
  isGroup?: boolean;
  isCommunity?: boolean;
  unreadCount: number;
  otherParticipant?: Author;
  lastMessage?: { id: string; body: string; senderId: string; createdAt: string } | null;
  createdAt: string;
};

export type Message = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender?: Author;
};

export type NotificationItem = {
  id: string;
  type: string;
  previewText?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: Author;
};

export type Profile = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  points?: number | null;
  course?: string | null;
  branch?: string | null;
  year?: number | string | null;
  institution?: { name?: string | null } | null;
};

export type Streak = {
  currentStreak: number;
  longestStreak: number;
  isSafeToday: boolean;
  totalQualifiedDays: number;
};
