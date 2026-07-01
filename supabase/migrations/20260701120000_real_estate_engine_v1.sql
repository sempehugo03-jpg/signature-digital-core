-- Real estate engine V1 foundation.
-- This migration prepares shared multi-agency tables for future seller,
-- agent and owner spaces. It does not connect UI actions or uploads yet.

create extension if not exists pgcrypto;

comment on table agencies is
  'Signature Digital agencies. Real estate V1 records are isolated through agency_id references to this table.';

create table if not exists profiles (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  auth_user_id uuid unique,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  role text not null check (role in ('seller', 'agent', 'owner')),
  status text not null default 'invited' check (status in ('invited', 'active', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  seller_profile_id text references profiles(id) on delete set null,
  agent_profile_id text references profiles(id) on delete set null,
  title text not null,
  address text not null default '',
  city text not null default '',
  postal_code text not null default '',
  property_type text not null default '',
  price numeric(12, 2),
  status text not null default 'draft' check (status in ('draft', 'active', 'under_offer', 'sold', 'archived')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_photos (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  storage_bucket text not null default 'property-photos',
  storage_path text not null,
  file_name text not null default '',
  mime_type text not null default '',
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists property_documents (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  uploaded_by_profile_id text references profiles(id) on delete set null,
  storage_bucket text not null default 'property-documents',
  storage_path text not null,
  file_name text not null default '',
  mime_type text not null default '',
  document_type text not null default '',
  visible_to_seller boolean not null default true,
  visible_to_agent boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists visits (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  agent_profile_id text references profiles(id) on delete set null,
  seller_profile_id text references profiles(id) on delete set null,
  visitor_name text not null default '',
  visitor_email text not null default '',
  visitor_phone text not null default '',
  scheduled_at timestamptz,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'done', 'cancelled')),
  notes text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  visit_id text references visits(id) on delete set null,
  agent_profile_id text references profiles(id) on delete set null,
  title text not null default '',
  summary text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists offers (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  agent_profile_id text references profiles(id) on delete set null,
  buyer_name text not null default '',
  buyer_email text not null default '',
  buyer_phone text not null default '',
  amount numeric(12, 2),
  status text not null default 'received' check (status in ('received', 'accepted', 'rejected', 'withdrawn')),
  notes text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists requests (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text references properties(id) on delete set null,
  requester_profile_id text references profiles(id) on delete set null,
  assigned_agent_profile_id text references profiles(id) on delete set null,
  request_type text not null default 'contact' check (request_type in ('contact', 'visit', 'estimate', 'information')),
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invitations (
  id text primary key default gen_random_uuid()::text,
  agency_id text not null references agencies(id) on delete cascade,
  property_id text references properties(id) on delete set null,
  invited_by_profile_id text references profiles(id) on delete set null,
  target_profile_id text references profiles(id) on delete set null,
  email text not null,
  role text not null check (role in ('seller', 'agent', 'owner')),
  token_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_agency_email_idx
  on profiles(agency_id, lower(email))
  where email <> '';

create index if not exists profiles_agency_id_idx on profiles(agency_id);
create index if not exists profiles_role_idx on profiles(role);
create index if not exists properties_agency_id_idx on properties(agency_id);
create index if not exists properties_seller_profile_id_idx on properties(seller_profile_id);
create index if not exists properties_agent_profile_id_idx on properties(agent_profile_id);
create index if not exists property_photos_property_id_idx on property_photos(property_id);
create index if not exists property_documents_property_id_idx on property_documents(property_id);
create index if not exists visits_property_id_idx on visits(property_id);
create index if not exists visits_agent_profile_id_idx on visits(agent_profile_id);
create index if not exists reports_property_id_idx on reports(property_id);
create index if not exists offers_property_id_idx on offers(property_id);
create index if not exists requests_agency_id_idx on requests(agency_id);
create index if not exists requests_property_id_idx on requests(property_id);
create index if not exists invitations_agency_id_idx on invitations(agency_id);
create index if not exists invitations_email_idx on invitations(email);
create index if not exists invitations_property_id_idx on invitations(property_id);

comment on table profiles is
  'Future real estate access profiles for sellers, agents and agency owners, scoped by agency_id.';
comment on table properties is
  'Real estate properties owned by an agency, with optional seller and assigned agent profiles.';
comment on table property_photos is
  'Photo metadata only. Files should live in the property-photos storage bucket.';
comment on table property_documents is
  'Document metadata only. Files should live in the property-documents storage bucket.';
comment on table visits is
  'Visit requests and scheduled visits for a property.';
comment on table reports is
  'Agent visit reports and seller-facing summaries for a property.';
comment on table offers is
  'Buyer offers attached to a property.';
comment on table requests is
  'Simple contact, visit, estimate or information requests. Not a full CRM.';
comment on table invitations is
  'Future invitation records for seller, agent and owner access. token_hash stores a hash, not a raw token.';
