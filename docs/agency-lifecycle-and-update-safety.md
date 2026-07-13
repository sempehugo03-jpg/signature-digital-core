# Agency lifecycle and update safety

## Project and agency types

Signature Digital uses one official type on projects and generated agencies:

- `client`: normal paying customer. It follows the commercial activation and payment path.
- `pilot`: real pilot agency. It is visible as a pilot and must not be mixed with paying client metrics.
- `internal-test`: internal test agency. Real email addresses are allowed, payment is not required, and the agency is excluded from paying-client metrics.

Old projects and agencies without a type resolve to `client`.

## Metrics

Internal tests are excluded from commercial counters such as active paying clients, payments, subscriptions and conversions.

Pilots are counted separately so they remain visible without inflating paying-client metrics.

## Internal test activation

An internal test project can create a real agency through the normal `Creer la demo moteur` action.

Only after that, ProjectDetail exposes the controlled admin action:

`Activer en mode test`

This action:

- does not call Stripe;
- marks the generated agency active for test usage;
- keeps account provisioning and invitation links usable with real emails;
- marks the project as an internal test path;
- is never displayed for a `client` project.

Pilot projects do not automatically bypass payment. Any free or special treatment must stay explicit.

## Engine update vs configuration update

Engine update:

- new common code;
- every agency benefits automatically;
- no agency duplication.

Configuration update:

- identity;
- contact details;
- colors;
- VisualBlueprint;
- modules;
- texts;
- imported listings.

Active agencies require an explicit confirmation when a configuration update changes sensitive fields.

## Update safety

`resolveAgencyUpdateSafety(currentAgency, nextConfig)` checks a configuration update before save.

It blocks:

- agency slug changes;
- silent `client` / `pilot` / `internal-test` changes;
- loss of a configured custom domain;
- invalid VisualBlueprint;
- commercial offer or subscription mutation through configuration maintenance.

It warns about:

- active agency status or mode changes;
- custom domain replacement;
- fewer listings than the current agency;
- module deactivation while module data exists;
- automatic config version increment.

Disabled modules keep their data. Reactivating the module can reveal the data again.

## Version and snapshots

Agencies store:

- `configVersion`;
- `updatedAt`;
- `lastUpdatedBy`;
- a short `updateHistory`;
- `previousConfigSnapshot`.

The snapshot is intentionally light. It keeps identity, visual configuration, VisualBlueprint and modules. It does not duplicate heavy or sensitive data.

## Restore

Maintenance exposes:

`Restaurer la configuration precedente`

The restore only applies:

- identity;
- contact and visual fields;
- VisualBlueprint;
- modules.

It never deletes or rewrites:

- accounts;
- permissions;
- requests;
- documents;
- listings created since;
- payments;
- confirmed custom domains.

## Limits

This contract does not create a second test engine, duplicate active agencies, bypass Stripe for normal clients, or add a complex versioning system.
