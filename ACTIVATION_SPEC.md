# Activation Spec

## Purpose

This document defines how a Signature Digital Immobilier agency moves from demo to a real client activation.

Activation changes agency configuration and operational status.

Activation must never duplicate the engine.

## Modes

### demo

`demo` means the agency is a prospect or test/demo instance.

It may use prepared data, demo accounts, local fallback data, or non-production flows.

### live

`live` means the agency is a real active client.

It uses real users, real requests, real documents, real seller access, and production-ready email/data flows where configured.

## Statuses

### demo_ready

The agency is ready to present as a demo.

Rule:

```text
mode = demo
status = demo_ready
```

The route is visible and accessible as a demo.

### active

The agency is an active client.

Rule:

```text
mode = live
status = active
```

The route is visible and accessible as a live agency.

### paused

The agency is temporarily unavailable.

Public routes must display:

```text
Cette agence est temporairement indisponible.
```

Data and config are preserved.

### archived

The agency is archived.

Public routes must display:

```text
Cette agence n'est plus disponible.
```

Data and config are preserved unless a separate deletion policy is explicitly approved.

## Status Matrix

```text
demo_ready + mode demo = visible demo agency
active + mode live = active client agency
paused = temporarily unavailable message
archived = no longer available message
```

## Reactivation Rules

When reactivating:

- if `mode = demo`, set `status = demo_ready`
- if `mode = live`, set `status = active`

Reactivation must not create a new agency.

Reactivation must not duplicate data.

Reactivation must not duplicate the engine.

## Future "Activer l'agence" Button

A future admin button named `Activer l'agence` will convert a demo agency into a real client agency.

Expected behavior:

- change `mode` from `demo` to `live`
- change `status` from `demo_ready` to `active`
- activate real email flows when configured
- activate real access creation
- activate real data persistence
- activate real requests and follow-up data
- keep the same `agencyId`
- keep the same `agencySlug` unless a deliberate migration decision is made
- keep the same shared engine

The activation button must update config.

It must not fork the app.

It must not create a client-specific engine copy.

## Live Data Rules

In live mode, the agency should use production-ready data paths when configured:

- real agents
- real sellers
- real invitations
- real documents
- real photos
- real requests
- real visits
- real reports
- real offers

Fallback/demo data must not leak into a live agency unless explicitly seeded as onboarding content.

Every live data item must remain scoped by `agencyId`.

## Route Rules

Routes are generated from agency config:

```text
/demo/[agencySlug]
/demo/[agencySlug]/estimation
/demo/[agencySlug]/connexion
/demo/[agencySlug]/vendeur
/demo/[agencySlug]/agent
/demo/[agencySlug]/patron
/demo/[agencySlug]/bien/[propertyId]
```

Activation does not change the engine route structure.

A custom domain may be added later, but it must map to the same configured agency instance.

## Anti-Brico Rules

Forbidden:

- fork per client
- engine copy per client
- hard-coded route per agency
- `if agencySlug === "citya"` inside the common engine
- `if agencySlug === "foch"` inside the common engine
- client-specific property detail page
- client-specific seller/agent/owner spaces
- direct data sharing across agencies

Every new request must go through one of:

- config
- reusable module
- product parking
- refusal

No exception should be hidden inside engine code.

## Activation Checklist

Before activation:

- agency has a unique `agencyId`
- agency has a unique `agencySlug`
- agency config is complete
- enabled modules are reviewed
- theme config is reviewed
- data config is reviewed
- real users are ready or invitation flow is ready
- email settings are configured if email is required
- storage settings are configured if files are required
- private data access is scoped by `agencyId`

After activation:

- route is accessible
- mode is `live`
- status is `active`
- seller access is scoped to property
- agent access is scoped to agency
- owner access is scoped to agency
- public users do not see private modules
- documents are openable or cleanly pending
- no engine duplication occurred

## Definition of Done

An activation change is complete only when:

- demo agencies can stay in `mode = demo`
- live agencies use `mode = live`
- `demo_ready` agencies remain visible as demos
- `active` agencies are visible as live clients
- `paused` agencies show the temporary unavailable message
- `archived` agencies show the no longer available message
- reactivation returns to `demo_ready` or `active` according to mode
- `agencyId` is preserved
- `agencySlug` is preserved unless deliberately migrated
- real data is scoped by `agencyId`
- no client fork is created
- no agency-specific exception is added to the engine
- every new client request is handled through config, module, product parking, or refusal
