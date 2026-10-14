-- Exact authenticated restoration consent; additive, no credit or payment effect.
CREATE TABLE IF NOT EXISTS fp_change_restore_consents (
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL UNIQUE REFERENCES fp_change_requests(id),
 project_id TEXT NOT NULL REFERENCES fp_projects(id),
 user_id TEXT NOT NULL,
 site_ref TEXT NOT NULL,
 target_release_ref TEXT NOT NULL,
 target_sha256 TEXT NOT NULL,
 expected_release_ref TEXT NOT NULL,
 approval_ref TEXT NOT NULL UNIQUE,
 idempotency_key TEXT NOT NULL UNIQUE,
 state TEXT NOT NULL CHECK(state IN ('pending','restoring','restored','failed')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
