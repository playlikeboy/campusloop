-- 0017: Admin email campaigns (Admin -> Emails).
-- Additive only: new tables and indexes. Safe to run more than once.
--
--   email_templates            saved templates (subject, preheader, heading, body, one button)
--   email_campaigns            one send: content snapshot, audience spec, progress counters
--   email_campaign_recipients  one row per (campaign, student); the unique index is what
--                              guarantees nobody is emailed twice for the same campaign
--   email_unsubscribes         marketing-email opt-outs (one-click link, no login).
--                              Security and account emails ignore this table.

CREATE TABLE IF NOT EXISTS email_templates (
  id text PRIMARY KEY,
  preset_key text,
  name text NOT NULL,
  subject text NOT NULL,
  preheader text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  button_label text,
  button_url text,
  created_by_id text REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_templates_updated_idx ON email_templates (updated_at);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id text PRIMARY KEY,
  name text NOT NULL,
  template_id text REFERENCES email_templates(id) ON DELETE SET NULL,
  subject text NOT NULL,
  preheader text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  button_label text,
  button_url text,
  segment jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- QUEUED | SENDING | DONE | CANCELLED
  status text NOT NULL DEFAULT 'QUEUED',
  total_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_by_id text REFERENCES user_profiles(id) ON DELETE SET NULL,
  started_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns (status, created_at);
CREATE INDEX IF NOT EXISTS email_campaigns_created_idx ON email_campaigns (created_at);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- QUEUED | SENDING | SENT | FAILED | SKIPPED
  status text NOT NULL DEFAULT 'QUEUED',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  message_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_recipients_campaign_profile_idx
  ON email_campaign_recipients (campaign_id, profile_id);
CREATE INDEX IF NOT EXISTS email_campaign_recipients_campaign_status_idx
  ON email_campaign_recipients (campaign_id, status, created_at);

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id text PRIMARY KEY,
  profile_id text REFERENCES user_profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- LINK | ONE_CLICK | ADMIN
  source text NOT NULL DEFAULT 'LINK',
  campaign_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_unsubscribes_email_idx ON email_unsubscribes (email);
CREATE UNIQUE INDEX IF NOT EXISTS email_unsubscribes_profile_idx ON email_unsubscribes (profile_id);
