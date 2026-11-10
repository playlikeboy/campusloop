-- 0007: Courses (Udemy-style learning + CS50 catalog). See docs/COURSES_PLAN.md.
-- Idempotent: safe to run multiple times.
CREATE TABLE IF NOT EXISTS courses (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  level text NOT NULL DEFAULT 'ALL',
  language text NOT NULL DEFAULT 'English',
  thumbnail_url text,
  instructor_name text NOT NULL,
  instructor_bio text,
  creator_id text REFERENCES user_profiles(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'COMMUNITY',
  source_url text,
  license text,
  outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'DRAFT',
  is_featured boolean NOT NULL DEFAULT false,
  lectures_count integer NOT NULL DEFAULT 0,
  duration_sec integer NOT NULL DEFAULT 0,
  enroll_count integer NOT NULL DEFAULT 0,
  rating_avg real NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_status_idx ON courses (status, enroll_count);
CREATE INDEX IF NOT EXISTS courses_creator_idx ON courses (creator_id);

CREATE TABLE IF NOT EXISTS course_sections (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_sections_course_idx ON course_sections (course_id, position);

CREATE TABLE IF NOT EXISTS course_lectures (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id text NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'VIDEO',
  video_provider text,
  video_ref text,
  duration_sec integer NOT NULL DEFAULT 0,
  body text,
  is_preview boolean NOT NULL DEFAULT false,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_lectures_course_idx ON course_lectures (course_id, position);
CREATE INDEX IF NOT EXISTS course_lectures_section_idx ON course_lectures (section_id);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  last_lecture_id text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_enrollments_unique ON course_enrollments (course_id, profile_id);
CREATE INDEX IF NOT EXISTS course_enrollments_profile_idx ON course_enrollments (profile_id);

CREATE TABLE IF NOT EXISTS course_lecture_progress (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecture_id text NOT NULL REFERENCES course_lectures(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  position_sec integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_progress_unique ON course_lecture_progress (profile_id, lecture_id);
CREATE INDEX IF NOT EXISTS course_progress_course_idx ON course_lecture_progress (profile_id, course_id);

CREATE TABLE IF NOT EXISTS course_notes (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecture_id text NOT NULL REFERENCES course_lectures(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  at_sec integer NOT NULL DEFAULT 0,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_notes_owner_idx ON course_notes (profile_id, course_id);

CREATE TABLE IF NOT EXISTS course_reviews (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  body text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_reviews_unique ON course_reviews (course_id, profile_id);

CREATE TABLE IF NOT EXISTS course_questions (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecture_id text REFERENCES course_lectures(id) ON DELETE SET NULL,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_questions_course_idx ON course_questions (course_id, created_at);

CREATE TABLE IF NOT EXISTS course_answers (
  id text PRIMARY KEY,
  question_id text NOT NULL REFERENCES course_questions(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_answers_question_idx ON course_answers (question_id);

CREATE TABLE IF NOT EXISTS course_certificates (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  course_title text NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_certificates_unique ON course_certificates (course_id, profile_id);

CREATE TABLE IF NOT EXISTS course_wishlist (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_wishlist_unique ON course_wishlist (course_id, profile_id);
