# Real estate repository V1

This repository layer isolates real estate data access from UI components.

Components should not read mock data directly and should not call Supabase directly. Future PRs should import functions from `src/real-estate-engine/data/realEstateRepository.ts`.

## Role

The repository exposes one stable API for the real estate engine:

- read agencies, properties, agents, sellers and profiles
- read photos, documents, visits, reports, offers and requests
- prepare V1 write operations for photos, documents, visits, reports, agents, seller access and requests

It is a technical foundation only. It does not upload files, send emails, wire modals, change routes or change visuals.

## Supabase vs mock fallback

When `isSupabaseConfigured` is true, the repository uses `src/lib/supabaseClient.ts` and reads or writes the Supabase tables prepared by the real estate schema.

When Supabase variables are absent, the repository uses the existing mock data from `src/data/realEstateTemplate.ts`. The fallback keeps `/demo/template-immobilier` usable with the current demo data:

- `template-immobilier`
- Appartement Haussmannien
- Duplex contemporain
- Loft sur Seine
- Camille Aurel
- Hugo Martin
- Clara Moreau
- demo documents, visits, reports and offers

Fallback writes are kept in memory inside the repository and do not modify the source mock file.

## Exposed functions

Reads:

- `getAgencyBySlug(agencySlug)`
- `getProperties(agencyId)`
- `getPropertyById(agencyId, propertyId)`
- `getAgents(agencyId)`
- `getProfileByEmail(email)`
- `getSellerByEmail(agencyId, email)`
- `getDocuments(agencyId, propertyId)`
- `getPhotos(agencyId, propertyId)`
- `getVisits(agencyId, propertyId)`
- `getReports(agencyId, propertyId)`
- `getOffers(agencyId, propertyId)`
- `getRequests(agencyId)`

Writes:

- `addPropertyPhoto(agencyId, propertyId, data)`
- `addPropertyDocument(agencyId, propertyId, data)`
- `addVisit(agencyId, propertyId, data)`
- `addReport(agencyId, propertyId, data)`
- `addAgent(agencyId, data)`
- `deactivateAgent(agencyId, agentId)`
- `createSellerAccess(agencyId, propertyId, sellerData)`
- `createRequest(agencyId, data)`

## agencyId rule

`agencyId` is mandatory for agency-scoped data. Supabase reads and writes must always include an agency filter or an `agency_id` value.

The only exception is `getProfileByEmail(email)`, because login lookup starts from an email. It still returns `agencyId` and `role` so callers can route the user safely.

## Next PR usage

The next PR should use this repository for the agent and owner actions:

- add photo
- add document
- schedule visit
- add report
- add agent
- create seller access

The UI should call repository functions instead of mutating component-only mock arrays directly.

## Do not do

- Do not access real estate mock arrays directly from new components.
- Do not run Supabase queries directly inside components.
- Do not read or write agency data without `agencyId`.
- Do not load all Supabase rows and filter in the browser.
- Do not add uploads, full auth, CRM logic or visual changes in this layer.
