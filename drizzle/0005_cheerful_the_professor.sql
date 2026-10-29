CREATE TABLE "article_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"group" varchar(32) DEFAULT 'GENERAL' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_official" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "article_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "article_links" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"url" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"type" varchar(32) DEFAULT 'REFERENCE' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "article_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "article_to_tags" (
	"article_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"student_id" text NOT NULL,
	"order_ids" jsonb NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'CREATED' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id")
);
--> statement-breakpoint
CREATE TABLE "community_webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"community_id" text NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"bot_name" text DEFAULT 'CampusBot' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text NOT NULL,
	"posts_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"recipient_name" text NOT NULL,
	"course_title" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"last_lecture_id" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_lecture_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"lecture_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"position_sec" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_lectures" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"section_id" text NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"kind" text DEFAULT 'VIDEO' NOT NULL,
	"video_provider" text,
	"video_ref" text,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"body" text,
	"is_preview" boolean DEFAULT false NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"lecture_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"at_sec" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"lecture_id" text,
	"profile_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_wishlist" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"level" text DEFAULT 'ALL' NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"thumbnail_url" text,
	"instructor_name" text NOT NULL,
	"instructor_bio" text,
	"creator_id" text,
	"source" text DEFAULT 'COMMUNITY' NOT NULL,
	"provider" text,
	"rank_boost" real DEFAULT 0 NOT NULL,
	"source_url" text,
	"license" text,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"listed" boolean DEFAULT false NOT NULL,
	"listed_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"wishlist_count" integer DEFAULT 0 NOT NULL,
	"completion_count" integer DEFAULT 0 NOT NULL,
	"trend_score" real DEFAULT 0 NOT NULL,
	"lectures_count" integer DEFAULT 0 NOT NULL,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"enroll_count" integer DEFAULT 0 NOT NULL,
	"rating_avg" real DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "gamer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"primary_game" text DEFAULT 'Valorant' NOT NULL,
	"games" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"platforms" jsonb DEFAULT '["PC"]'::jsonb NOT NULL,
	"play_style" text DEFAULT 'BOTH' NOT NULL,
	"preferred_availability" text DEFAULT 'EVENING' NOT NULL,
	"voice_preference" text DEFAULT 'DISCORD' NOT NULL,
	"is_looking_for_team" boolean DEFAULT true NOT NULL,
	"is_handle_public" boolean DEFAULT true NOT NULL,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gaming_lobby_members" (
	"id" text PRIMARY KEY NOT NULL,
	"lobby_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text,
	"gamer_tag" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gaming_progression" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"game_name" text NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"matches_won" integer DEFAULT 0 NOT NULL,
	"tournaments_won" integer DEFAULT 0 NOT NULL,
	"tournaments_played" integer DEFAULT 0 NOT NULL,
	"fair_play_honors" integer DEFAULT 0 NOT NULL,
	"ranking_points" integer DEFAULT 1000 NOT NULL,
	"season" text DEFAULT '2026-S1' NOT NULL,
	"is_opted_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gaming_tournament_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"captain_id" text NOT NULL,
	"team_name" text NOT NULL,
	"roster" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seed" integer,
	"is_checked_in" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'REGISTERED' NOT NULL,
	"final_rank" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gaming_tournament_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"match_number" integer NOT NULL,
	"next_match_id" text,
	"entry1_id" text,
	"entry2_id" text,
	"winner_id" text,
	"score1" integer DEFAULT 0 NOT NULL,
	"score2" integer DEFAULT 0 NOT NULL,
	"reported_by_entry_id" text,
	"reported_by_user_id" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"dispute_reason" text,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gaming_tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text,
	"organizer_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"game_name" text NOT NULL,
	"format" text DEFAULT 'SINGLE_ELIMINATION' NOT NULL,
	"team_format" text DEFAULT 'SOLO' NOT NULL,
	"max_participants" integer DEFAULT 8 NOT NULL,
	"current_participants" integer DEFAULT 0 NOT NULL,
	"registration_deadline" timestamp with time zone NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"rules" text,
	"prize_pool" text,
	"status" text DEFAULT 'REGISTRATION_OPEN' NOT NULL,
	"banner_url" text,
	"bracket_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"key_id" text,
	"user_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"status" text NOT NULL,
	"latency_ms" integer,
	"client_info" text,
	"error_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mcp_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Default IDE Key' NOT NULL,
	"key" text NOT NULL,
	"permissions" jsonb DEFAULT '["read", "write", "chat", "exclusive"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"requests_count" integer DEFAULT 0 NOT NULL,
	"rate_limit_per_minute" integer DEFAULT 120 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_profile_id" text,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"homepage_url" text,
	"privacy_url" text,
	"terms_url" text,
	"redirect_uris" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"type" text DEFAULT 'CONFIDENTIAL' NOT NULL,
	"client_secret_hash" text,
	"secret_last4" text,
	"requested_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_status" text DEFAULT 'NONE' NOT NULL,
	"review_note" text,
	"is_first_party" boolean DEFAULT false NOT NULL,
	"sector" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"users_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_codes" (
	"code_hash" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"code_challenge" text,
	"nonce" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_refresh_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"client_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"rotated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"value" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reel_bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"reel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reel_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"reel_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reel_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"reel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reels" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"title" text,
	"video_url" text NOT NULL,
	"hls_url" text,
	"audio_url" text,
	"thumbnail_url" text,
	"aspect_ratio" text DEFAULT '9:16' NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"author_id" text,
	"author_name" text,
	"author_handle" text,
	"author_avatar_url" text,
	"institution_id" text,
	"source" text DEFAULT 'reddit' NOT NULL,
	"source_url" text,
	"subreddit" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"shares_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'PUBLISHED' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "streak_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"local_date" text NOT NULL,
	"event_type" text NOT NULL,
	"source_entity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streak_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"milestone_days" integer NOT NULL,
	"points_awarded" integer NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_qualified_date" text,
	"total_qualified_days" integer DEFAULT 0 NOT NULL,
	"streak_started_at" timestamp with time zone,
	"longest_streak_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_locations" (
	"profile_id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"country" text,
	"region" text,
	"city" text,
	"latitude" double precision,
	"longitude" double precision,
	"accuracy_m" integer,
	"gps_updated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "r2_storage_objects" (
	"key" text PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"data" text NOT NULL,
	"size" integer NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"college_name" text NOT NULL,
	"college_slug" text NOT NULL,
	"role" text DEFAULT 'Campus Representative' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"source" text DEFAULT 'public_directory',
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "academic_votes_res_profile_idx";--> statement-breakpoint
ALTER TABLE "academic_playlists" ALTER COLUMN "cover_gradient" SET DEFAULT 'from-slate-900 to-stone-900';--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "category" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "category" SET DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE "academic_resources" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_resources" ADD COLUMN "modules" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "external_posts" ADD COLUMN "imported_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lost_and_found_items" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "reply_to_user_id" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "likes_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "replies_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "is_college_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "article_links" ADD CONSTRAINT "article_links_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_to_tags" ADD CONSTRAINT "article_to_tags_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_to_tags" ADD CONSTRAINT "article_to_tags_tag_id_article_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."article_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_student_id_user_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_webhooks" ADD CONSTRAINT "community_webhooks_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_webhooks" ADD CONSTRAINT "community_webhooks_created_by_id_user_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_answers" ADD CONSTRAINT "course_answers_question_id_course_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."course_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_answers" ADD CONSTRAINT "course_answers_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lecture_progress" ADD CONSTRAINT "course_lecture_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lecture_progress" ADD CONSTRAINT "course_lecture_progress_lecture_id_course_lectures_id_fk" FOREIGN KEY ("lecture_id") REFERENCES "public"."course_lectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lecture_progress" ADD CONSTRAINT "course_lecture_progress_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lectures" ADD CONSTRAINT "course_lectures_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lectures" ADD CONSTRAINT "course_lectures_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_notes" ADD CONSTRAINT "course_notes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_notes" ADD CONSTRAINT "course_notes_lecture_id_course_lectures_id_fk" FOREIGN KEY ("lecture_id") REFERENCES "public"."course_lectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_notes" ADD CONSTRAINT "course_notes_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_lecture_id_course_lectures_id_fk" FOREIGN KEY ("lecture_id") REFERENCES "public"."course_lectures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_wishlist" ADD CONSTRAINT "course_wishlist_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_wishlist" ADD CONSTRAINT "course_wishlist_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_user_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamer_profiles" ADD CONSTRAINT "gamer_profiles_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamer_profiles" ADD CONSTRAINT "gamer_profiles_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_lobby_members" ADD CONSTRAINT "gaming_lobby_members_lobby_id_gaming_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."gaming_lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_lobby_members" ADD CONSTRAINT "gaming_lobby_members_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_progression" ADD CONSTRAINT "gaming_progression_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_progression" ADD CONSTRAINT "gaming_progression_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournament_entries" ADD CONSTRAINT "gaming_tournament_entries_tournament_id_gaming_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."gaming_tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournament_entries" ADD CONSTRAINT "gaming_tournament_entries_captain_id_user_profiles_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournament_matches" ADD CONSTRAINT "gaming_tournament_matches_tournament_id_gaming_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."gaming_tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournament_matches" ADD CONSTRAINT "gaming_tournament_matches_entry1_id_gaming_tournament_entries_id_fk" FOREIGN KEY ("entry1_id") REFERENCES "public"."gaming_tournament_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournament_matches" ADD CONSTRAINT "gaming_tournament_matches_entry2_id_gaming_tournament_entries_id_fk" FOREIGN KEY ("entry2_id") REFERENCES "public"."gaming_tournament_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournament_matches" ADD CONSTRAINT "gaming_tournament_matches_winner_id_gaming_tournament_entries_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."gaming_tournament_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournaments" ADD CONSTRAINT "gaming_tournaments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_tournaments" ADD CONSTRAINT "gaming_tournaments_organizer_id_user_profiles_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_audit_logs" ADD CONSTRAINT "mcp_audit_logs_key_id_user_mcp_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."user_mcp_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_audit_logs" ADD CONSTRAINT "mcp_audit_logs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mcp_keys" ADD CONSTRAINT "user_mcp_keys_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_owner_profile_id_user_profiles_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_codes" ADD CONSTRAINT "oauth_codes_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_codes" ADD CONSTRAINT "oauth_codes_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_grants" ADD CONSTRAINT "oauth_grants_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_grants" ADD CONSTRAINT "oauth_grants_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_bookmarks" ADD CONSTRAINT "reel_bookmarks_reel_id_reels_id_fk" FOREIGN KEY ("reel_id") REFERENCES "public"."reels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_bookmarks" ADD CONSTRAINT "reel_bookmarks_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_comments" ADD CONSTRAINT "reel_comments_reel_id_reels_id_fk" FOREIGN KEY ("reel_id") REFERENCES "public"."reels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_comments" ADD CONSTRAINT "reel_comments_author_id_user_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_likes" ADD CONSTRAINT "reel_likes_reel_id_reels_id_fk" FOREIGN KEY ("reel_id") REFERENCES "public"."reels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_likes" ADD CONSTRAINT "reel_likes_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reels" ADD CONSTRAINT "reels_author_id_user_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reels" ADD CONSTRAINT "reels_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_events" ADD CONSTRAINT "streak_events_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streak_milestones" ADD CONSTRAINT "user_streak_milestones_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_categories_slug_idx" ON "article_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "article_categories_group_idx" ON "article_categories" USING btree ("group");--> statement-breakpoint
CREATE INDEX "article_categories_sort_order_idx" ON "article_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "article_links_article_idx" ON "article_links" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_links_order_idx" ON "article_links" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "article_tags_slug_idx" ON "article_tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "article_to_tags_article_tag_idx" ON "article_to_tags" USING btree ("article_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_articles_profile_article_idx" ON "saved_articles" USING btree ("profile_id","article_id");--> statement-breakpoint
CREATE INDEX "marketplace_payments_student_idx" ON "marketplace_payments" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "community_webhooks_token_idx" ON "community_webhooks" USING btree ("token");--> statement-breakpoint
CREATE INDEX "course_answers_question_idx" ON "course_answers" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_certificates_unique" ON "course_certificates" USING btree ("course_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_enrollments_unique" ON "course_enrollments" USING btree ("course_id","profile_id");--> statement-breakpoint
CREATE INDEX "course_enrollments_profile_idx" ON "course_enrollments" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_progress_unique" ON "course_lecture_progress" USING btree ("profile_id","lecture_id");--> statement-breakpoint
CREATE INDEX "course_progress_course_idx" ON "course_lecture_progress" USING btree ("profile_id","course_id");--> statement-breakpoint
CREATE INDEX "course_lectures_course_idx" ON "course_lectures" USING btree ("course_id","position");--> statement-breakpoint
CREATE INDEX "course_lectures_section_idx" ON "course_lectures" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "course_notes_owner_idx" ON "course_notes" USING btree ("profile_id","course_id");--> statement-breakpoint
CREATE INDEX "course_questions_course_idx" ON "course_questions" USING btree ("course_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "course_reviews_unique" ON "course_reviews" USING btree ("course_id","profile_id");--> statement-breakpoint
CREATE INDEX "course_sections_course_idx" ON "course_sections" USING btree ("course_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "course_wishlist_unique" ON "course_wishlist" USING btree ("course_id","profile_id");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status","enroll_count");--> statement-breakpoint
CREATE INDEX "courses_creator_idx" ON "courses" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "courses_listed_idx" ON "courses" USING btree ("status","listed","trend_score");--> statement-breakpoint
CREATE UNIQUE INDEX "gamer_profiles_user_idx" ON "gamer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gamer_profiles_institution_idx" ON "gamer_profiles" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "gamer_profiles_primary_game_idx" ON "gamer_profiles" USING btree ("primary_game");--> statement-breakpoint
CREATE INDEX "gamer_profiles_lft_idx" ON "gamer_profiles" USING btree ("is_looking_for_team");--> statement-breakpoint
CREATE UNIQUE INDEX "gaming_lobby_members_unique_idx" ON "gaming_lobby_members" USING btree ("lobby_id","user_id");--> statement-breakpoint
CREATE INDEX "gaming_lobby_members_lobby_idx" ON "gaming_lobby_members" USING btree ("lobby_id");--> statement-breakpoint
CREATE INDEX "gaming_lobby_members_user_idx" ON "gaming_lobby_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gaming_progression_user_game_season_idx" ON "gaming_progression" USING btree ("user_id","game_name","season");--> statement-breakpoint
CREATE INDEX "gaming_progression_institution_game_idx" ON "gaming_progression" USING btree ("institution_id","game_name","ranking_points");--> statement-breakpoint
CREATE INDEX "gaming_progression_ranking_points_idx" ON "gaming_progression" USING btree ("game_name","ranking_points");--> statement-breakpoint
CREATE UNIQUE INDEX "gaming_tournament_entries_unique_idx" ON "gaming_tournament_entries" USING btree ("tournament_id","captain_id");--> statement-breakpoint
CREATE INDEX "gaming_tournament_entries_tournament_idx" ON "gaming_tournament_entries" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "gaming_tournament_entries_captain_idx" ON "gaming_tournament_entries" USING btree ("captain_id");--> statement-breakpoint
CREATE INDEX "gaming_matches_tournament_round_idx" ON "gaming_tournament_matches" USING btree ("tournament_id","round_number","match_number");--> statement-breakpoint
CREATE INDEX "gaming_matches_tournament_status_idx" ON "gaming_tournament_matches" USING btree ("tournament_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "gaming_tournaments_slug_idx" ON "gaming_tournaments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gaming_tournaments_institution_idx" ON "gaming_tournaments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "gaming_tournaments_status_idx" ON "gaming_tournaments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gaming_tournaments_game_idx" ON "gaming_tournaments" USING btree ("game_name");--> statement-breakpoint
CREATE INDEX "gaming_tournaments_starts_at_idx" ON "gaming_tournaments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "mcp_audit_logs_user_created_idx" ON "mcp_audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "mcp_audit_logs_key_idx" ON "mcp_audit_logs" USING btree ("key_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_mcp_keys_key_idx" ON "user_mcp_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "user_mcp_keys_user_idx" ON "user_mcp_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_owner_idx" ON "oauth_clients" USING btree ("owner_profile_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_review_idx" ON "oauth_clients" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "oauth_codes_expires_idx" ON "oauth_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_grants_unique" ON "oauth_grants" USING btree ("client_id","profile_id");--> statement-breakpoint
CREATE INDEX "oauth_grants_profile_idx" ON "oauth_grants" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_family_idx" ON "oauth_refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_grant_idx" ON "oauth_refresh_tokens" USING btree ("client_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_votes_user_comment_idx" ON "comment_votes" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "comment_votes_comment_idx" ON "comment_votes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_votes_user_idx" ON "comment_votes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reel_bookmarks_user_reel_unique" ON "reel_bookmarks" USING btree ("user_id","reel_id");--> statement-breakpoint
CREATE INDEX "reel_bookmarks_user_idx" ON "reel_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reel_comments_reel_idx" ON "reel_comments" USING btree ("reel_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reel_likes_user_reel_unique" ON "reel_likes" USING btree ("user_id","reel_id");--> statement-breakpoint
CREATE INDEX "reel_likes_reel_idx" ON "reel_likes" USING btree ("reel_id");--> statement-breakpoint
CREATE INDEX "reels_status_created_idx" ON "reels" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reels_institution_idx" ON "reels" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "reels_author_idx" ON "reels" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "reels_subreddit_idx" ON "reels" USING btree ("subreddit");--> statement-breakpoint
CREATE INDEX "reels_views_idx" ON "reels" USING btree ("views_count");--> statement-breakpoint
CREATE UNIQUE INDEX "streak_events_user_local_date_idx" ON "streak_events" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE INDEX "streak_events_user_created_idx" ON "streak_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "streak_events_local_date_idx" ON "streak_events" USING btree ("local_date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_streak_milestones_user_days_idx" ON "user_streak_milestones" USING btree ("user_id","milestone_days");--> statement-breakpoint
CREATE INDEX "user_streak_milestones_user_idx" ON "user_streak_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_streaks_user_id_idx" ON "user_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_streaks_current_streak_idx" ON "user_streaks" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "user_locations_lat_lng_idx" ON "user_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "outreach_contacts_email_idx" ON "outreach_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "outreach_contacts_college_idx" ON "outreach_contacts" USING btree ("college_slug");--> statement-breakpoint
CREATE INDEX "outreach_contacts_status_idx" ON "outreach_contacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outreach_contacts_sent_at_idx" ON "outreach_contacts" USING btree ("sent_at");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_reply_to_user_id_user_profiles_id_fk" FOREIGN KEY ("reply_to_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_comment_votes_profile_comment_idx" ON "article_comment_votes" USING btree ("profile_id","comment_id");--> statement-breakpoint
CREATE INDEX "article_comments_article_idx" ON "article_comments" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_comments_author_idx" ON "article_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "article_comments_parent_idx" ON "article_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "article_votes_profile_article_idx" ON "article_votes" USING btree ("profile_id","article_id");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "articles_is_demo_idx" ON "articles" USING btree ("is_demo");--> statement-breakpoint
CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "articles_institution_idx" ON "articles" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_behavior_events_user_type_created_idx" ON "user_behavior_events" USING btree ("user_id","event_type","created_at");--> statement-breakpoint
CREATE INDEX "user_behavior_events_type_created_idx" ON "user_behavior_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "communities_creator_created_idx" ON "communities" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "communities_created_idx" ON "communities" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registrations_event_profile_idx" ON "event_registrations" USING btree ("event_id","profile_id");--> statement-breakpoint
CREATE INDEX "gaming_institution_created_idx" ON "gaming_lobbies" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "gaming_host_created_idx" ON "gaming_lobbies" USING btree ("host_id","created_at");--> statement-breakpoint
CREATE INDEX "gaming_game_name_idx" ON "gaming_lobbies" USING btree ("game_name");--> statement-breakpoint
CREATE INDEX "gaming_status_idx" ON "gaming_lobbies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "housing_institution_created_idx" ON "housing_listings" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "housing_author_created_idx" ON "housing_listings" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "lost_found_institution_created_idx" ON "lost_and_found_items" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "lost_found_author_created_idx" ON "lost_and_found_items" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "marketplace_institution_created_idx" ON "marketplace_items" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "marketplace_seller_created_idx" ON "marketplace_items" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_post_pinned_idx" ON "comments" USING btree ("post_id","is_pinned");--> statement-breakpoint
CREATE INDEX "rideshare_institution_created_idx" ON "rideshare_pools" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "rideshare_creator_created_idx" ON "rideshare_pools" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "time_capsules_institution_created_idx" ON "time_capsules" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "time_capsules_creator_created_idx" ON "time_capsules" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "user_profiles_college_verified_idx" ON "user_profiles" USING btree ("is_college_verified");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_votes_res_profile_idx" ON "academic_resource_votes" USING btree ("resource_id","profile_id");