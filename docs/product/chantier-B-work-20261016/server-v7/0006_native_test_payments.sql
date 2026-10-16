-- FABRYA post-purchase credits, additive private migration. Never auto-run on the public database.
-- Billing periods are keyed by a Stripe invoice verified by the server, not by a browser clock.
CREATE TABLE IF NOT EXISTS fp_credit_wallets (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES fp_projects(id),
 source TEXT NOT NULL CHECK(source IN ('monthly_invoice','verified_topup')),
 source_ref TEXT NOT NULL,
 allowance INTEGER NOT NULL CHECK(allowance BETWEEN 1 AND 10000),
 held INTEGER NOT NULL DEFAULT 0 CHECK(held>=0),
 spent INTEGER NOT NULL DEFAULT 0 CHECK(spent>=0),
 valid_from TEXT NOT NULL,
 valid_until TEXT,
 created_at TEXT NOT NULL,
 UNIQUE(source,source_ref),
 CHECK(held+spent<=allowance),
 CHECK(valid_until IS NULL OR valid_until > valid_from)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fp_credit_wallet_project ON fp_credit_wallets(project_id,valid_until,source);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fp_credit_one_monthly_period ON fp_credit_wallets(project_id,valid_from) WHERE source='monthly_invoice';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS fp_credit_wallet_no_delete BEFORE DELETE ON fp_credit_wallets BEGIN SELECT RAISE(ABORT,'CREDIT_WALLET_APPEND_ONLY'); END;
--> statement-breakpoint
-- Final SQL guard closes the approval/version race between provider reads and activation.
-- Historical projects retain their original activation path.
CREATE TRIGGER IF NOT EXISTS fp_native_activation_binding BEFORE INSERT ON fp_activations
WHEN EXISTS(SELECT 1 FROM fp_projects WHERE id=NEW.project_id AND request_key LIKE 'native_work_%')
BEGIN
 SELECT CASE WHEN NOT EXISTS(
  SELECT 1 FROM fp_projects p
  JOIN fp_approvals a ON a.project_id=p.id AND a.id=NEW.approval_id AND a.user_id=p.user_id
  JOIN fp_versions v ON v.project_id=p.id AND v.id=a.version_id AND v.id=NEW.version_id AND v.state='ready' AND v.source='work-mcp'
  JOIN fp_work_product_links l ON l.project_id=p.id AND l.user_id=p.user_id AND l.version_id=v.id AND l.job_id=v.job_id
  JOIN fp_work_site_bindings b ON b.request_id=l.request_id AND b.project_id=p.id AND b.user_id=p.user_id AND b.version_id=v.id
  JOIN fp_checkouts c ON c.project_id=p.id AND c.approval_id=a.id AND c.stripe_session_id=NEW.stripe_session_id
  WHERE p.id=NEW.project_id AND p.approved_version_id=v.id AND a.artifact_hash=NEW.artifact_hash
  AND v.artifact_hash=NEW.artifact_hash AND b.client_artifact_sha256=NEW.artifact_hash
 ) THEN RAISE(ABORT,'NATIVE_ACTIVATION_BINDING_CHANGED') END;
END;
