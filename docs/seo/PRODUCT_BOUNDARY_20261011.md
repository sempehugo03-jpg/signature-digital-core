# Targeted SEO boundary — 11 October 2026

This change adds only the isolated SEO CMS and passive first-touch observation
requested by Hugo. It is based on the current Product branch, preserving concurrent
Product work. No UI, price, Stripe gateway, webhook, activation or Kevin changes.

## Implemented and verified

- Private owner-only CMS, maximum two allowlisted fields per staged change.
- Server validation, BEFORE/AFTER hash, request idempotence, CAS publication and
  rollback, mandatory QA and durable GSC provenance/expected effect.
- First-touch cookie and immutable server records, project linkage and read-only
  joins of existing checkout, activation and paid subscription records.
- Unknown query stays UNKNOWN for brand classification. Paid campaign identifiers
  and non-search Google services never become organic. Both verified brand and
  verified non-brand organic are eligible under the current user mandate.
- QA/private origins never qualify as live customers. Account acquisition must
  follow the touch; existing customers are not retrospectively assigned Google.
- Terminal success fails closed without FABRYA_ATTRIBUTION_INTERNAL_EMAILS in the
  runtime, excluding owner and technical identities. This value belongs only in
  runtime configuration, never a public repository or report.
- SQL triggers prohibit changes to first-touch acquisition and account/project
  bindings. Tracking failures do not block existing Product actions.

44 Product tests pass. Root npm run build and isolated Product Worker build pass.
Sensitive Product/UI files are identical to this change's parent commit.

## Deployment and remaining limits

The permitted private validation origin is
https://fabrya-product-live-validation.sempehugo03.chatgpt.site.
Private staging explicitly cannot publish production. Its plain SEO preview does
not demonstrate production layout QA. No production SEO change is authorized by
an asserted QA flag or a passing unit test.

The deployed public Site source observed at
4b7369b5bee6d400d13e0d52616ea88d87d4aab6 belongs to the same owner's Site but is a
separate runtime/schema. Its checkout source uses EUR90/month and a 30-day trial;
the requested Product branch uses EUR59/month. This integration does not alter
either payment flow or promote the private Product to the public Site.

A production CMS transport and a public first-touch/payment observation adapter
remain necessary. Never describe the private mirror as the production writer,
and never describe private Stripe TEST fixtures as real acquisitions or payments.
The Product owner must resolve the public release/payment contract before the
requested EUR59 compatibility gate can be claimed for the public funnel.

The SEO scheduler continues safe GSC reads, inspection, selection and private
staging while this Product release boundary remains unresolved. Technical gates
for public publication, measurement, rollback and attribution stay FAIL until
proven by their actual runtime receipts.

FIRST_GOOGLE_ORGANIC_CUSTOMER = NOT_YET. No real customer evidence was acquired.
