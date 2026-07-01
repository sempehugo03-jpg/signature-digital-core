# Supabase real estate schema V1

This document describes the technical foundation for the future real estate engine. It does not connect UI buttons, uploads, auth flows or agency-specific skins.

## Client-side variables

Vercel must expose only public client variables to Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in the client. Service role keys must stay server-side only.

The client helper is `src/lib/supabaseClient.ts`. It exports:

- `supabase`: Supabase client when variables are present, otherwise `null`
- `isSupabaseConfigured`: `true` only when URL and anon key are configured

When variables are missing, the app can keep using mock/local fallback behavior without breaking the build.

## Tables

### `agencies`

Existing Signature Digital agency table. Real estate V1 tables reference `agencies(id)` through `agency_id` to keep every agency isolated.

### `profiles`

Future access profiles for:

- `seller`
- `agent`
- `owner`

Each profile belongs to one agency through `agency_id`. A profile can later be linked to a Supabase Auth user through `auth_user_id`.

### `properties`

Real estate property records owned by an agency. A property can be linked to:

- one seller profile through `seller_profile_id`
- one assigned agent profile through `agent_profile_id`

### `property_photos`

Photo metadata for a property. Files are not uploaded by this PR. The table stores the bucket and path that future upload code will use.

### `property_documents`

Document metadata for a property. Files are not uploaded by this PR. The table stores the bucket and path that future upload code will use.

### `visits`

Visit requests and scheduled visits attached to one property. A visit can reference the assigned agent and seller profiles.

### `reports`

Agent reports or visit summaries attached to a property, optionally linked to a visit.

### `offers`

Buyer offers attached to a property, with a simple status lifecycle.

### `requests`

Simple contact, visit, estimate or information requests. This is intentionally not a heavy CRM.

### `invitations`

Future invitation records for seller, agent and owner access. Invitations are scoped by agency and can optionally target one property. The table stores `token_hash`, not a raw token.

## Relationships

- An agency owns profiles.
- An agency owns properties.
- A property can have photos, documents, visits, reports and offers.
- A seller profile can be linked to a property.
- An agent profile can be assigned to properties, visits, reports and offers.
- An invitation can create future access for an agent, seller or owner.

## Storage buckets

Create these Supabase Storage buckets before enabling real uploads:

- `property-photos`
- `property-documents`

Recommended paths:

- `property-photos/{agencyId}/{propertyId}/{filename}`
- `property-documents/{agencyId}/{propertyId}/{filename}`

## Later work

Planned future steps:

- photo upload
- document upload
- email invitations
- real seller, agent and owner profiles
- persistence for visits and reports
