# FABRYA Product ↔ Modification Engine — site-change/v1.0.0

**Status: CONTRACT CANDIDATE — not public.** This exact protocol module and this document must be byte-identical in both repositories. A major version bump is required for incompatible changes. Do not connect either side by assuming an unverified Work API.

## Authorities and identity

- **Product** is the sole authority for customer/project authorization, Stripe, the 100 paid-period credits, top-ups, credit quotations, reservations, settlements, refunds, rate limiting, and the customer's decision. The engine must never mint or debit credits.
- **Engine** is the sole authority for `site_ref`, technical `version_ref`, artifact SHA-256, preview, actual deployed `release_ref`, publication receipt, and restoration. Product may retain opaque references, never substitute its pre-purchase `fp_versions` as the technical post-purchase site history.
- Product's authenticated customer id is mapped to a scoped opaque `customer_ref`; real emails and PII are not part of the transport. The Engine registers the client/project ↔ site binding in a private table before accepting tasks. A raw `site_ref` from the browser is never trusted.
- Each request uses Product-issued `change_ref` and stable `idempotency_key` for its entire lifecycle; no new id/key after lost response. `base_version_ref`, `base_release_ref`, and `base_sha256` are from Engine's authenticated current-release read, never from customer input.

## Commands — authenticated server-to-server only

`quote(envelope)` → Engine estimates micro-euro work cost and max exposure (`estimated_cost_microeur`, `max_cost_microeur`, `cost_basis`), **never credits**. Product maps the Engine cost to an internal bounded credit rate under its own verified cost policy. No priced policy means no reservation/dispatch.

`findTask(change_ref)` → exactly one matching task or a proven `NOT_FOUND`; timeout/ambiguous responses mean `RECONCILIATION_REQUIRED` and **no blind replay**.

`submitTask(envelope)` → idempotent creation, bound to site, owner, baseline and attachment hashes. `getTask(change_ref)` → terminal/nonterminal status, version refs and trusted receipts. State is monotonic, with explicit compensating rollback; duplicate webhook notifications do not regress state.

`validatePreview(change_ref)` → authenticated Engine read of persisted artifact and SHA-256, not a self-attested `verified:true` from a client. Returns PREVIEW_READY; no public publication implied. Preview must be owner-private, scoped and short-lived.

`publish(change_ref, preview_ref, approval_ref, idempotency_key)` → only after a durable explicit customer approval and Engine-side `If-Match` of current release/base SHA. Must use deployment locking or compare-and-swap and persist one publication receipt. `getCurrentRelease(site_ref)` and `validateRelease(change_ref)` → independent read-after-write of the current public artifact; a `PUBLISHED` string alone never settles credits.

`restore(change_ref, previous_release_ref, idempotency_key)` → Engine-owned rollback to a retained real deploy with another read-after-write. Product records customer consent and accounting but cannot overwrite Engine versions.

Complex change route: Engine returns `AWAITING_WORK` with a reason and bounded cost cap. Do not auto-start a Work conversation; dispatch only if an authenticated programmable transport with checkpointing is verified. Otherwise hold as pending with no debit, and release on failure/expiry.

## Credits lifecycle

1. Invoice `paid` and genuine subscription billing period → Product grants exactly 100 monthly credits, idempotently.
2. Product verifies ownership/active subscription, receives Engine cost quote, calculates credits from a private pricing policy and atomically **holds** them; no Engine call is a money movement.
3. Engine creates one task, actually edits site bytes, persists **unpublished** preview. Product independently verifies the private preview; hold remains, `spent=0`.
4. Client explicitly approves the identified preview version/hash; Product records approval. Engine publishes **only that version** using a separate authenticated command.
5. Product independently verifies Engine's actual current release and its served content hash, then atomically converts the hold into **one** `settled` debit, releasing any difference. Subsequent receipts are idempotent.
6. Failed, canceled or rejected unpublished change → Product releases hold. Ambiguous publication blocks release and new dispatch until Engine confirms outcome. Reversed *successful* publication keeps spent credits (work was delivered); a service-failure refund requires an explicit audited Product-only compensation, never an Engine-triggered credit grant.

Monthly period expiry/hold timeout require a bounded reconciliation policy. A pending hold should be released only after the Engine proves no publish; never allow a stale attempt to publish after its authorization expired. Customer can always view available/held/spent/history and accessible tariff conditions without showing per-message unit cost by default.

## Security and operations

- HTTPS private service transport with authenticated service identity, payload signature (timestamp/nonce, SHA-256), narrow site-scoped permissions, replay rejection, key rotation; do not place credentials or tokens in a public repo or preview links.
- Attachments are validated and antivirus-scanned by Product, stored in private object storage, and transferred through short-lived, scoped retrieval authorized to Engine. Contract carries only opaque refs, content SHA-256, MIME and size; Engine rechecks checksum. No raw URLs or public bucket URLs in the command.
- No external network access, paid provider call, customer upload, public site mutation, DNS, Stripe payment, or Vercel/Sites deployment in the reference conformance harness.
- Webhook events are hints. Before any debit the Product independently retrieves the authoritative Engine release. Disagreement, unknown version, unexpected amount, timeout or stale baseline ⇒ fail-closed.
- No concurrent modifications of a single site; application-level site lock, CAS on release and durable task outbox/inbox required.
- Production readiness requires genuine private integration, authenticated route tests, non-synthetic deployment QA at 1440/390/320, backup/restore of customer sites, incident recovery, GDPR retention and verified Stripe invoices. **The local reference test cannot prove these production gates.**

## Acceptance contract test

A local Product SQLite wallet and an **actual on-disk** fictitious Engine site are connected through this protocol: input → reserve → change real HTML bytes → private preview → customer approval → actual HTTP-served published bytes → exactly one Product debit → real rollback to prior bytes. It proves protocol logic on an isolated fixture, **not a production adapter, hosting integration, or an AI authoring capability**.