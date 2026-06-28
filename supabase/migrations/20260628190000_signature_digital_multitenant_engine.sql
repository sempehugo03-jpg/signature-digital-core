create table if not exists agencies (
  id text primary key,
  slug text not null unique,
  name text not null,
  sector text not null check (sector in ('immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre')),
  city text not null default '',
  website_url text not null default '',
  logo_url text not null default '',
  primary_color text not null default '#7C3AED',
  secondary_color text not null default '#0F172A',
  status text not null default 'draft' check (status in ('draft', 'demo', 'active', 'disabled')),
  commercial_angle text not null default '',
  pain_point text not null default '',
  main_objective text not null default '',
  email_reception text not null default '',
  notification_emails text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  runtime_status text not null default 'not_ready' check (runtime_status in ('not_ready', 'ready', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists modules (
  id text primary key,
  key text not null unique,
  name text not null,
  description text not null default '',
  category text not null,
  default_enabled boolean not null default false,
  available_for_sectors text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists agency_modules (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  module_key text not null references modules(key) on delete restrict,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, module_key)
);

create table if not exists agency_settings (
  id text primary key,
  agency_id text not null unique references agencies(id) on delete cascade,
  theme text not null default 'premium',
  tone text not null default 'premium',
  visual_style text not null default 'premium_sobre',
  font_style text not null default 'moderne',
  layout_intensity text not null default 'immersive',
  cta_style text not null default 'analyse_personnalisee',
  email_reception text not null default '',
  notification_emails text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_requests (
  id text primary key,
  company_name text not null,
  sector text not null,
  city text not null default '',
  website_url text not null default '',
  contact_first_name text not null default '',
  contact_last_name text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  pain_point text not null default '',
  main_objective text not null default '',
  commercial_angle text not null default '',
  selected_modules jsonb not null default '[]'::jsonb,
  visual_style text not null default 'premium_sobre',
  notes text not null default '',
  status text not null default 'new' check (status in ('new', 'analyzed', 'demo_generated', 'sent', 'signed', 'lost')),
  generated_agency_id text references agencies(id) on delete set null,
  generated_prompt_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questionnaire_answers (
  id text primary key,
  demo_request_id text not null references demo_requests(id) on delete cascade,
  question_key text not null,
  answer_value jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists generated_prompts (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  demo_request_id text not null references demo_requests(id) on delete cascade,
  prompt_type text not null check (prompt_type in ('lovable_demo', 'codex_task', 'email', 'commercial_analysis')),
  content text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'demo_requests_generated_prompt_fk'
  ) then
    alter table demo_requests
      add constraint demo_requests_generated_prompt_fk
      foreign key (generated_prompt_id)
      references generated_prompts(id)
      on delete set null
      deferrable initially deferred;
  end if;
end $$;

create table if not exists users (
  id text primary key,
  agency_id text references agencies(id) on delete cascade,
  email text not null,
  role text not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  module_key text not null,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  source text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'lost', 'won')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  client_id text references users(id) on delete set null,
  title text not null,
  sector text not null,
  status text not null default 'demo',
  progress_step text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointments (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  lead_id text references leads(id) on delete set null,
  title text not null,
  date text not null default '',
  time text not null default '',
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'done')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  project_id text references projects(id) on delete set null,
  lead_id text references leads(id) on delete set null,
  name text not null,
  type text not null default '',
  url text not null default '',
  visible_to_client boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists emails (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  type text not null,
  recipient text not null default '',
  subject text not null default '',
  status text not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  user_id text references users(id) on delete set null,
  type text not null,
  title text not null,
  message text not null default '',
  read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  event_type text not null,
  page text not null default '',
  module_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists invite_tokens (
  id text primary key,
  agency_id text not null references agencies(id) on delete cascade,
  token text not null unique,
  type text not null check (type in ('manager_invite', 'agent_invite', 'client_invite', 'seller_invite')),
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  email text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists agency_modules_agency_id_idx on agency_modules(agency_id);
create index if not exists demo_requests_generated_agency_id_idx on demo_requests(generated_agency_id);
create index if not exists questionnaire_answers_demo_request_id_idx on questionnaire_answers(demo_request_id);
create index if not exists generated_prompts_agency_id_idx on generated_prompts(agency_id);
create index if not exists leads_agency_id_idx on leads(agency_id);
create index if not exists appointments_agency_id_idx on appointments(agency_id);
create index if not exists documents_agency_id_idx on documents(agency_id);
create index if not exists projects_agency_id_idx on projects(agency_id);
create index if not exists notifications_agency_id_idx on notifications(agency_id);
create index if not exists analytics_events_agency_id_idx on analytics_events(agency_id);
create index if not exists invite_tokens_agency_id_idx on invite_tokens(agency_id);
create index if not exists invite_tokens_token_idx on invite_tokens(token);
