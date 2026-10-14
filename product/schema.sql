CREATE TABLE fp_projects (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, request_key TEXT NOT NULL, company_input TEXT NOT NULL DEFAULT '{}',
 draft_revision INTEGER NOT NULL DEFAULT 0, step INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft',
 attribution TEXT NOT NULL DEFAULT '{}', approved_version_id TEXT, active_version_id TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id,request_key)
);
CREATE INDEX fp_projects_owner ON fp_projects(user_id,updated_at);
CREATE TABLE fp_jobs (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES fp_projects(id), version_id TEXT NOT NULL,
 request_key TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','queued','understanding','planning','creating','rendering','ready','failed','cancelled')),
 adapter_handle TEXT NOT NULL, input_snapshot TEXT NOT NULL, progress TEXT NOT NULL DEFAULT '{}',
 error TEXT, result_hash TEXT, recoverable INTEGER NOT NULL DEFAULT 1, attempt INTEGER NOT NULL DEFAULT 1,
 last_retry_key TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id,request_key)
);
CREATE UNIQUE INDEX fp_jobs_one_running ON fp_jobs(project_id) WHERE status IN ('queued','understanding','planning','creating','rendering');
CREATE TABLE fp_versions (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES fp_projects(id), number INTEGER NOT NULL, job_id TEXT NOT NULL REFERENCES fp_jobs(id),
 source TEXT NOT NULL, state TEXT NOT NULL, modification TEXT NOT NULL DEFAULT '', html TEXT, artifact_hash TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id,number)
);
CREATE TABLE fp_approvals (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES fp_projects(id), version_id TEXT NOT NULL REFERENCES fp_versions(id),
 artifact_hash TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(project_id,version_id,artifact_hash)
);
CREATE TABLE fp_checkouts (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES fp_projects(id), approval_id TEXT NOT NULL REFERENCES fp_approvals(id),
 attempt INTEGER NOT NULL DEFAULT 1, stripe_session_id TEXT UNIQUE, url TEXT, state TEXT NOT NULL DEFAULT 'creating',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(approval_id,attempt)
);
CREATE UNIQUE INDEX fp_checkouts_one_pending ON fp_checkouts(project_id) WHERE state IN ('creating','open','processing');
CREATE TABLE fp_subscriptions (
 project_id TEXT PRIMARY KEY REFERENCES fp_projects(id), stripe_subscription_id TEXT NOT NULL UNIQUE, stripe_customer_id TEXT NOT NULL,
 state TEXT NOT NULL, price_id TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount=5900), currency TEXT NOT NULL CHECK(currency='eur'),
 provider_updated_at INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE fp_activations (
 project_id TEXT PRIMARY KEY REFERENCES fp_projects(id), version_id TEXT NOT NULL REFERENCES fp_versions(id),
 approval_id TEXT NOT NULL REFERENCES fp_approvals(id), stripe_session_id TEXT NOT NULL UNIQUE, artifact_hash TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE fp_webhooks (
 id TEXT PRIMARY KEY, type TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL, processed_at TEXT
);
CREATE TABLE fp_events (
 id TEXT PRIMARY KEY, session_id TEXT NOT NULL, user_id TEXT, project_id TEXT, name TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX fp_events_project ON fp_events(project_id,created_at);
CREATE TABLE fp_auth_limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,updated_at TEXT NOT NULL);
