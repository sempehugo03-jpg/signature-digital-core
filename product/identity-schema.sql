-- Used only when provisioning an isolated product QA database.
-- Same table/column/password/cookie contracts as the existing Fabrya identity.
CREATE TABLE IF NOT EXISTS sd_platform_users(id TEXT PRIMARY KEY,email TEXT NOT NULL,first_name TEXT NOT NULL,last_name TEXT NOT NULL,avatar_url TEXT NOT NULL DEFAULT '',provider TEXT NOT NULL DEFAULT 'password',provider_subject TEXT NOT NULL DEFAULT '',password_hash TEXT NOT NULL DEFAULT '',password_salt TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS sd_platform_users_email_idx ON sd_platform_users(email);
CREATE TABLE IF NOT EXISTS sd_platform_sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,last_seen_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS sd_platform_sessions_token_idx ON sd_platform_sessions(token_hash);
