-- 0010: Login with CampusLoop (OpenID Connect provider). Idempotent.
CREATE TABLE IF NOT EXISTS oauth_clients (
  id text PRIMARY KEY,
  owner_profile_id text REFERENCES user_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  homepage_url text,
  privacy_url text,
  terms_url text,
  redirect_uris jsonb NOT NULL DEFAULT '[]'::jsonb,
  type text NOT NULL DEFAULT 'CONFIDENTIAL',
  client_secret_hash text,
  secret_last4 text,
  requested_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_status text NOT NULL DEFAULT 'NONE',
  review_note text,
  is_first_party boolean NOT NULL DEFAULT false,
  sector text,
  status text NOT NULL DEFAULT 'ACTIVE',
  users_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oauth_clients_owner_idx ON oauth_clients (owner_profile_id);
CREATE INDEX IF NOT EXISTS oauth_clients_review_idx ON oauth_clients (review_status);

CREATE TABLE IF NOT EXISTS oauth_codes (
  code_hash text PRIMARY KEY,
  client_id text NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  scopes jsonb NOT NULL,
  code_challenge text,
  nonce text,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oauth_codes_expires_idx ON oauth_codes (expires_at);

CREATE TABLE IF NOT EXISTS oauth_grants (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scopes jsonb NOT NULL,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS oauth_grants_unique ON oauth_grants (client_id, profile_id);
CREATE INDEX IF NOT EXISTS oauth_grants_profile_idx ON oauth_grants (profile_id);

CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  token_hash text PRIMARY KEY,
  family_id text NOT NULL,
  client_id text NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scopes jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  rotated_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oauth_refresh_family_idx ON oauth_refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS oauth_refresh_grant_idx ON oauth_refresh_tokens (client_id, profile_id);
