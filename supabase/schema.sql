create extension if not exists pgcrypto;

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text default 'immobilier',
  city text,
  website_url text,
  status text default 'draft',
  primary_color text,
  secondary_color text,
  accent_color text,
  logo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade,
  type text,
  message text,
  created_at timestamp with time zone default now()
);
