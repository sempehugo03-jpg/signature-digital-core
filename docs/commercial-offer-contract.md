# Commercial Offer Contract

## Role

The commercial offer is the single pricing source for new Signature Digital activation flows.
It replaces hard-coded activation prices in public screens.

This contract does not integrate Stripe and does not change existing active agencies automatically.

## Structure

`CommercialOffer` contains:

- `id`
- `name`
- `installationAmount` in cents
- `recurringAmount` in cents
- `currency`, currently `EUR`
- `recurringInterval`, currently `month`
- `active`
- `description`
- `includedFeatures`
- optional `stripeInstallationPriceId`
- optional `stripeRecurringPriceId`

Default official values:

- installation: `100000` cents, displayed as `1 000 €`
- recurring: `25000` cents, displayed as `250 €/mois`

## Storage

The current implementation stores one editable offer in local storage through
`src/data/commercialOfferStore.ts`.

If storage is missing or corrupted, Signature Digital falls back to the default official offer.
Only one active official offer exists in this PR.

## Admin Editing

The admin block "Offre commerciale" allows editing:

- offer name
- installation amount
- monthly recurring amount
- EUR currency
- short description
- included features
- active/inactive state
- optional Stripe price IDs

An invalid offer cannot be saved as active.

## Project Snapshot

When a project moves to `client-review` or `approved`, the project captures:

- `offerId`
- `name`
- `installationAmount`
- `recurringAmount`
- `currency`
- `recurringInterval`
- `capturedAt`

This prevents later price changes from silently changing an offer already presented to a client.

Projects without a snapshot continue to display the currently active offer.
Older projects remain compatible.

## Stripe Preparation

The offer includes optional fields:

- `stripeInstallationPriceId`
- `stripeRecurringPriceId`

They are stored as plain identifiers only. This PR does not call Stripe, create Checkout sessions,
charge clients, or expose secrets.

## Limits

- No multiple plans.
- No automatic migration of existing active agencies.
- No billing workflow.
- No change to public engine behavior.
