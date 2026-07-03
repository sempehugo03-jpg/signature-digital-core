# Agency Creation Spec

## Purpose

This document defines how Signature Digital Immobilier creates and manages real estate agencies.

An agency is not a copy of the real estate engine. An agency is an instance configured from the shared engine.

Core rule:

- the engine is never duplicated
- the agency is configured
- the visual skin is applied
- data is isolated by `agencyId`

## Agency Model

Every agency must have a readable and editable configuration.

Minimum agency fields:

- `agencyId`
- `agencySlug`
- `agencyName`
- `city`
- `mode: demo | live`
- `status: demo_ready | active | paused | archived`
- `contactEmail`
- `contactPhone`
- `logoUrl`
- `themeConfig`
- `dataConfig`
- `enabledModules`
- `createdAt`
- `updatedAt`

## Identity Rules

Each agency has a unique `agencyId`.

Each agency has a unique `agencySlug`.

The public demo route is generated from the agency config:

```text
/demo/[agencySlug]
```

Subroutes also come from the same config:

```text
/demo/[agencySlug]/estimation
/demo/[agencySlug]/connexion
/demo/[agencySlug]/vendeur
/demo/[agencySlug]/agent
/demo/[agencySlug]/patron
/demo/[agencySlug]/bien/[propertyId]
```

No agency route should be hard-coded for a client.

## Template Mother

`/demo/template-immobilier` is the official mother template.

It is the base used to create agency configurations.

It must never become a client agency.

It must remain stable and reusable.

## Test Agency

`/demo/agence-test` is only an internal test instance.

It validates that an agency can be configured without duplicating the engine.

It is not a real client agency.

It must not introduce special engine logic.

## Admin Creation

An agency can be created from the admin.

The admin creation flow must create:

- `agencyConfig`
- `themeConfig`
- `dataConfig`
- `enabledModules`
- `mode`
- `status`

Creating an agency must not copy engine components.

Creating an agency must not create a parallel app.

Creating an agency must not add agency-specific exceptions to the engine.

## Admin Edition

An agency can be edited from the admin.

Admin edition may update:

- agency identity fields
- contact fields
- logo and visual tokens
- module activation flags
- mode
- status

The edit operation updates config only.

It must not fork the engine.

It must not duplicate data from another agency except through a controlled template initialization.

## Status Management

An agency can be:

- `demo_ready`
- `active`
- `paused`
- `archived`

Admin can pause an agency.

Admin can archive an agency.

Admin can reactivate an agency.

Pausing or archiving changes status only.

It must not delete:

- engine code
- agency config
- data config
- theme config
- documents
- users
- invitations

## Data Isolation

All agency data must be isolated by `agencyId`.

Data tied to one agency must never appear inside another agency.

This applies to:

- properties
- agents
- sellers
- visits
- reports
- documents
- photos
- offers
- requests
- invitations

Every query, repository function, fallback store, and admin action must preserve agency scoping.

No unfiltered agency data access is allowed.

## Hard-Coding Rules

No agency should be hard-coded in the engine.

Hard-coded client exceptions are forbidden.

Allowed:

- registering a demo/test config
- loading an agency by config
- applying a skin by config
- enabling modules by config

Forbidden:

- `if agencySlug === "client-name"` inside the engine
- dedicated client routes outside `/demo/[agencySlug]`
- duplicated property detail pages per agency
- duplicated seller/agent/owner spaces per agency
- copied engine folders for one agency

## Definition of Done

An agency creation change is complete only when:

- the engine remains shared
- no engine component is copied
- every agency has a unique `agencyId`
- every agency has a unique `agencySlug`
- `/demo/[agencySlug]` is generated from config
- data is isolated by `agencyId`
- `/demo/template-immobilier` remains the mother template
- `/demo/agence-test` remains only an internal test instance
- admin can create or edit config without hard-coding an agency
- paused and archived statuses do not delete data
- build and route checks pass when code is modified
