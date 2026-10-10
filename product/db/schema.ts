import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const table_sd_platform_users = sqliteTable(
  "sd_platform_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    avatar_url: text("avatar_url").notNull().default(""),
    provider: text("provider").notNull().default("password"),
    provider_subject: text("provider_subject").notNull().default(""),
    password_hash: text("password_hash").notNull().default(""),
    password_salt: text("password_salt").notNull().default(""),
    status: text("status").notNull().default("active"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("sd_platform_users_email_idx").on(table.email)],
);

export const table_sd_platform_sessions = sqliteTable(
  "sd_platform_sessions",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id").notNull(),
    token_hash: text("token_hash").notNull(),
    expires_at: text("expires_at").notNull(),
    created_at: text("created_at").notNull(),
    last_seen_at: text("last_seen_at").notNull(),
  },
  (table) => [
    uniqueIndex("sd_platform_sessions_token_idx").on(table.token_hash),
  ],
);

export const table_fp_projects = sqliteTable(
  "fp_projects",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id").notNull(),
    request_key: text("request_key").notNull(),
    company_input: text("company_input").notNull().default("{}"),
    draft_revision: integer("draft_revision").notNull().default(0),
    step: integer("step").notNull().default(0),
    status: text("status").notNull().default("draft"),
    attribution: text("attribution").notNull().default("{}"),
    approved_version_id: text("approved_version_id"),
    active_version_id: text("active_version_id"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("fp_projects_owner").on(table.user_id, table.updated_at),
    uniqueIndex("fp_projects_unique_user_id_request_key").on(
      table.user_id,
      table.request_key,
    ),
  ],
);

export const table_fp_jobs = sqliteTable(
  "fp_jobs",
  {
    id: text("id").primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => table_fp_projects.id),
    version_id: text("version_id").notNull(),
    request_key: text("request_key").notNull(),
    status: text("status").notNull(),
    adapter_handle: text("adapter_handle").notNull(),
    input_snapshot: text("input_snapshot").notNull(),
    progress: text("progress").notNull().default("{}"),
    error: text("error"),
    result_hash: text("result_hash"),
    recoverable: integer("recoverable").notNull().default(1),
    attempt: integer("attempt").notNull().default(1),
    last_retry_key: text("last_retry_key"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("fp_jobs_one_running")
      .on(table.project_id)
      .where(
        sql`status IN ('queued','understanding','planning','creating','rendering')`,
      ),
    uniqueIndex("fp_jobs_unique_project_id_request_key").on(
      table.project_id,
      table.request_key,
    ),
    check(
      "fp_jobs_status_check",
      sql`status IN ('draft','queued','understanding','planning','creating','rendering','ready','failed','cancelled')`,
    ),
  ],
);

export const table_fp_versions = sqliteTable(
  "fp_versions",
  {
    id: text("id").primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => table_fp_projects.id),
    number: integer("number").notNull(),
    job_id: text("job_id")
      .notNull()
      .references(() => table_fp_jobs.id),
    source: text("source").notNull(),
    state: text("state").notNull(),
    modification: text("modification").notNull().default(""),
    html: text("html"),
    artifact_hash: text("artifact_hash"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("fp_versions_unique_project_id_number").on(
      table.project_id,
      table.number,
    ),
  ],
);

export const table_fp_approvals = sqliteTable(
  "fp_approvals",
  {
    id: text("id").primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => table_fp_projects.id),
    version_id: text("version_id")
      .notNull()
      .references(() => table_fp_versions.id),
    artifact_hash: text("artifact_hash").notNull(),
    user_id: text("user_id").notNull(),
    created_at: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("fp_approvals_unique_project_id_version_id_artifact_hash").on(
      table.project_id,
      table.version_id,
      table.artifact_hash,
    ),
  ],
);

export const table_fp_checkouts = sqliteTable(
  "fp_checkouts",
  {
    id: text("id").primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => table_fp_projects.id),
    approval_id: text("approval_id")
      .notNull()
      .references(() => table_fp_approvals.id),
    attempt: integer("attempt").notNull().default(1),
    stripe_session_id: text("stripe_session_id"),
    url: text("url"),
    state: text("state").notNull().default("creating"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("fp_checkouts_one_pending")
      .on(table.project_id)
      .where(sql`state IN ('creating','open','processing')`),
    uniqueIndex("fp_checkouts_unique_approval_id_attempt").on(
      table.approval_id,
      table.attempt,
    ),
    uniqueIndex("fp_checkouts_unique_stripe_session_id").on(
      table.stripe_session_id,
    ),
  ],
);

export const table_fp_subscriptions = sqliteTable(
  "fp_subscriptions",
  {
    project_id: text("project_id")
      .primaryKey()
      .references(() => table_fp_projects.id),
    stripe_subscription_id: text("stripe_subscription_id").notNull(),
    stripe_customer_id: text("stripe_customer_id").notNull(),
    state: text("state").notNull(),
    price_id: text("price_id").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    provider_updated_at: integer("provider_updated_at").notNull().default(0),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("fp_subscriptions_unique_stripe_subscription_id").on(
      table.stripe_subscription_id,
    ),
    check("fp_subscriptions_amount_check", sql`amount=5900`),
    check("fp_subscriptions_currency_check", sql`currency='eur'`),
  ],
);

export const table_fp_activations = sqliteTable(
  "fp_activations",
  {
    project_id: text("project_id")
      .primaryKey()
      .references(() => table_fp_projects.id),
    version_id: text("version_id")
      .notNull()
      .references(() => table_fp_versions.id),
    approval_id: text("approval_id")
      .notNull()
      .references(() => table_fp_approvals.id),
    stripe_session_id: text("stripe_session_id").notNull(),
    artifact_hash: text("artifact_hash").notNull(),
    created_at: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("fp_activations_unique_stripe_session_id").on(
      table.stripe_session_id,
    ),
  ],
);

export const table_fp_webhooks = sqliteTable(
  "fp_webhooks",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    state: text("state").notNull(),
    created_at: text("created_at").notNull(),
    processed_at: text("processed_at"),
  },
  (table) => [],
);

export const table_fp_events = sqliteTable(
  "fp_events",
  {
    id: text("id").primaryKey(),
    session_id: text("session_id").notNull(),
    user_id: text("user_id"),
    project_id: text("project_id"),
    name: text("name").notNull(),
    created_at: text("created_at").notNull(),
  },
  (table) => [
    index("fp_events_project").on(table.project_id, table.created_at),
  ],
);

export const table_fp_auth_limits = sqliteTable(
  "fp_auth_limits",
  {
    bucket: text("bucket").primaryKey(),
    count: integer("count").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [],
);
