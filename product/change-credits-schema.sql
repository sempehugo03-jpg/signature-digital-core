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
CREATE INDEX IF NOT EXISTS fp_credit_wallet_project ON fp_credit_wallets(project_id,valid_until,source);
CREATE UNIQUE INDEX IF NOT EXISTS fp_credit_one_monthly_period ON fp_credit_wallets(project_id,valid_from) WHERE source='monthly_invoice';
CREATE TABLE IF NOT EXISTS fp_change_requests (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES fp_projects(id),
 user_id TEXT NOT NULL,
 request_key TEXT NOT NULL,
 message TEXT NOT NULL CHECK(length(message)<=2000),
 input_hash TEXT NOT NULL,
 attachment_ids_json TEXT NOT NULL DEFAULT '[]',
 base_version_id TEXT NOT NULL,
 engine_site_ref TEXT, base_release_ref TEXT, base_sha256 TEXT, engine_envelope_json TEXT, preview_receipt_json TEXT,
 approval_ref TEXT, engine_release_id TEXT, published_at TEXT,
 status TEXT NOT NULL CHECK(status IN ('awaiting_engine','reserved','processing','preview_ready','approved','publishing','published','rolled_back','failed','canceled','reverted')),
 credits_held INTEGER NOT NULL DEFAULT 0 CHECK(credits_held>=0),
 credits_charged INTEGER NOT NULL DEFAULT 0 CHECK(credits_charged>=0),
 engine_handle TEXT,
 candidate_version_id TEXT,
 candidate_hash TEXT,
 error_code TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(project_id,request_key)
);
CREATE INDEX IF NOT EXISTS fp_changes_owner ON fp_change_requests(project_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS fp_change_one_unfinished ON fp_change_requests(project_id) WHERE status IN ('awaiting_engine','reserved','processing','preview_ready','approved','publishing');
CREATE TABLE IF NOT EXISTS fp_credit_holds (
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL REFERENCES fp_change_requests(id),
 wallet_id TEXT NOT NULL REFERENCES fp_credit_wallets(id),
 amount INTEGER NOT NULL CHECK(amount>0),
 charged INTEGER NOT NULL DEFAULT 0 CHECK(charged>=0 AND charged<=amount),
 state TEXT NOT NULL DEFAULT 'held' CHECK(state IN ('held','settled','released')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(request_id,wallet_id)
);
-- The DB, not JS balances, enforces reserve/settle/release atomically.
CREATE TRIGGER IF NOT EXISTS fp_credit_hold_before_insert BEFORE INSERT ON fp_credit_holds BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM fp_credit_wallets w JOIN fp_change_requests c ON c.project_id=w.project_id WHERE w.id=NEW.wallet_id AND c.id=NEW.request_id AND NEW.created_at>=w.valid_from AND (w.valid_until IS NULL OR NEW.created_at<w.valid_until) AND w.allowance-w.held-w.spent>=NEW.amount)!=1 THEN RAISE(ABORT,'CREDIT_WALLET_EMPTY_OR_MISMATCH') END;
END;
CREATE TRIGGER IF NOT EXISTS fp_credit_hold_after_insert AFTER INSERT ON fp_credit_holds BEGIN
 UPDATE fp_credit_wallets SET held=held+NEW.amount WHERE id=NEW.wallet_id;
END;
CREATE TRIGGER IF NOT EXISTS fp_credit_hold_before_update BEFORE UPDATE ON fp_credit_holds BEGIN
 SELECT CASE WHEN OLD.state!='held' OR NEW.state NOT IN ('released','settled') OR NEW.amount!=OLD.amount OR NEW.wallet_id!=OLD.wallet_id OR NEW.request_id!=OLD.request_id OR (NEW.state='released' AND NEW.charged!=0) OR (NEW.state='settled' AND NEW.charged>OLD.amount) THEN RAISE(ABORT,'CREDIT_HOLD_INVALID_TRANSITION') END;
END;
CREATE TRIGGER IF NOT EXISTS fp_credit_hold_after_update AFTER UPDATE ON fp_credit_holds BEGIN
 UPDATE fp_credit_wallets SET held=held-OLD.amount,spent=spent+CASE WHEN NEW.state='settled' THEN NEW.charged ELSE 0 END WHERE id=OLD.wallet_id;
END;
CREATE TRIGGER IF NOT EXISTS fp_credit_hold_no_delete BEFORE DELETE ON fp_credit_holds BEGIN SELECT RAISE(ABORT,'CREDIT_LEDGER_APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS fp_credit_wallet_no_delete BEFORE DELETE ON fp_credit_wallets BEGIN SELECT RAISE(ABORT,'CREDIT_WALLET_APPEND_ONLY'); END;
CREATE TABLE IF NOT EXISTS fp_change_attachments (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES fp_projects(id),
 user_id TEXT NOT NULL,
 request_id TEXT REFERENCES fp_change_requests(id),
 object_key TEXT NOT NULL UNIQUE,
 filename TEXT NOT NULL,
 mime TEXT NOT NULL,
 scan_state TEXT NOT NULL DEFAULT 'quarantine' CHECK(scan_state IN ('quarantine','clean','rejected')),
 byte_size INTEGER NOT NULL CHECK(byte_size>0 AND byte_size<=8388608),
 sha256 TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS fp_change_attachments_owner ON fp_change_attachments(project_id,request_id);
-- These entries track top-up payment intents. Credits may be issued only after provider verification.
CREATE TABLE IF NOT EXISTS fp_credit_topup_intents (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES fp_projects(id),
 user_id TEXT NOT NULL,
 request_key TEXT NOT NULL,
 credits INTEGER NOT NULL CHECK(credits>0),
 cents INTEGER NOT NULL CHECK(cents>0),
 price_id TEXT NOT NULL,
 stripe_session_id TEXT UNIQUE,
 state TEXT NOT NULL CHECK(state IN ('preparing','open','paid','canceled','review_required')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(project_id,request_key)
);