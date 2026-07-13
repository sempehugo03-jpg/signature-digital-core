# Stripe Checkout Contract

## Scope

PR 31 creates a hosted Stripe Checkout Session for activation payment.
It does not confirm payment, activate an agency, create the owner account, send emails, or handle webhooks.

## Endpoint

Server endpoint:

`POST /api/create-checkout-session`

The browser sends only activation context:

- `projectId`
- `activationToken`
- `agencyId`
- `agencySlug`
- `clientEmail`
- `offerSnapshot`

The browser never sends a free amount or arbitrary Stripe Price ID.

## Stripe Mode

Checkout mode used:

`subscription`

The session contains two `line_items`:

- one recurring monthly Price for the subscription;
- one one-time Price for the installation fee.

This follows Stripe Checkout subscription behavior for adding a one-time setup fee to the first invoice.

## Server Price IDs

The server reads authorized Price IDs from environment variables:

- `STRIPE_INSTALLATION_PRICE_ID_TEST`
- `STRIPE_RECURRING_PRICE_ID_TEST`
- `STRIPE_INSTALLATION_PRICE_ID_LIVE`
- `STRIPE_RECURRING_PRICE_ID_LIVE`

Fallback aliases are also supported:

- `STRIPE_INSTALLATION_PRICE_ID`
- `STRIPE_RECURRING_PRICE_ID`

The selected mode comes from:

- `STRIPE_CHECKOUT_MODE=test`
- `STRIPE_CHECKOUT_MODE=live`

The frontend cannot choose the mode.
If the project snapshot contains Stripe Price IDs, the endpoint accepts them only when they match
the authorized server-side Price IDs for the selected mode.

## Environment

Required for checkout:

- `STRIPE_SECRET_KEY`
- `PUBLIC_APP_URL` or `VERCEL_URL`
- installation Price ID for the selected mode
- recurring Price ID for the selected mode

Prepared for PR 32:

- `STRIPE_WEBHOOK_SECRET`

## Metadata

The Checkout Session and Subscription metadata include:

- `projectId`
- `agencyId`
- `agencySlug`
- `offerId`
- `offerSnapshotCapturedAt`
- `checkoutMode`

## Project State

`Project.stripeCheckout` stores:

- `sessionId`
- `status`: `not-started`, `pending`, `cancelled`, `confirmation-required`, or `error`
- `mode`: `test` or `live`
- `createdAt`

The payment status stays pending until PR 32 verifies Stripe webhooks.

## Return Pages

Success URL:

`/paiement/succes`

It displays that Stripe received the payment and that activation is awaiting confirmation.
It does not mark the project paid.

Cancel URL:

`/paiement/annule`

It preserves all data and lets the client resume activation.

## Security

The endpoint rejects requests when:

- project context is missing;
- activation token is missing;
- agency context is missing;
- agency is marked active;
- offer snapshot is missing or invalid;
- Stripe Price IDs are not configured;
- currency or recurring interval is unsupported.

No card data, Stripe secret, or banking information is stored.

## Local Test Procedure

1. Create one one-time Stripe Price for installation in test mode.
2. Create one recurring monthly Stripe Price in test mode.
3. Set `STRIPE_SECRET_KEY`, `STRIPE_CHECKOUT_MODE=test`, `STRIPE_INSTALLATION_PRICE_ID_TEST`, `STRIPE_RECURRING_PRICE_ID_TEST`, and `PUBLIC_APP_URL`.
4. Open an activation page for a project with a generated agency.
5. Click `Continuer vers le paiement securise`.
6. Complete or cancel hosted Checkout.
7. Verify that the return page does not activate the agency.
