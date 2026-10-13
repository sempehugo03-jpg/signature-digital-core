# FABRYA PRODUCT — site-change/v1 contract readiness (13 October 2026)

This is a **review-only** code candidate. It is a descendant of Product review commit 422227662d5870f5df28290e65434d9fcd19e906, not a modification of PR #202, its working branch, private Sites QA or fabrya.fr. No amount, Stripe object, account, SEO state or public route was modified.

## Shared protocol

Contract files **MUST** have identical bytes in both repos:

- `contracts/site-changes/v1/protocol.mjs`
- `contracts/site-changes/v1/schema.json`
- `contracts/site-changes/v1/README.md`

Version: `fabrya.site-change.v1.0.0`. Product owns customer authentication, plan/period entitlement, ledger, quotes in credits and approval. Engine owns site/version/release identities, artifact hashes, preview, actual publishing and rollback. Product caches opaque refs but cannot author technical versions. Signed/private transport is mandatory for LIVE.

The previous prototype of `change-credits.mjs` treated a preview as a debit and checked `fp_versions`, which are for earlier Product demos. In this **new** candidate that is replaced by authenticated Engine-owned receipts and an explicit **publish-then-verify-then-settle** transaction. An unpublished rejected/failed preview releases the reservation. A successful publication may later be rolled back without silent refunds; audited compensation is a separate Product decision.

## Evidence of shared local acceptance

Command (Node 22+): `node --test tests/product/change-credits.test.mjs` with a local test-only reference static Engine in `tests/product/reference-static-modifier.mjs`. Test uses a real temporary HTML site and localhost HTTP server, actual byte edits, private preview, customer approval, actual new served bytes, read-after-write release validation, **one credit settlement**, prior-file rollback, private invoice and attachment fixture, repeat and concurrency checks. No network external calls or paid provider. Report saved separately by the reviewer.

Engine repo independently runs `node --test tests/site-change-protocol.test.mjs`. This tests incompatible versions, forged receipts, untrusted attachment URLs and adapter method requirements. The Product and Engine contracts are byte-identical.

Important: the local reference engine is a **conformance fixture** only, not an implementation of the actual FABRYA production modifier. It accepts one bounded sample HTML change and cannot alter real customer sites. No motor mutation public transport has been authenticated or integrated, no Live site bytes were changed, and no real Work automation or remote site publication is claimed.

## Required hard gates before public activation

1. Real authenticated mapping of customer/project to engine site. No client-supplied site path or URL.
2. Engine must implement quote, task lookup/submit/get, private preview/get, validated publication/get-current, rollback and signed receipts with durable CAS, version pinning, and idempotent retries. STOP if any capability is missing. Complex changes may become `AWAITING_WORK` only; no automatic Work call until real programmable access is proven.
3. Product invoice-paid webhook reconciliation; period-bound grants, balance and top-up constraints in real private DB. Internal unit-cost policy (`FABRYA_CREDIT_UNIT_MICROEUR`) only after cost measurement, not a public price. Recharge SKU/pricing/terms still undefined and disabled.
4. Additive SQL migration on a verified QA snapshot, backup, rollback. Never deploy SQL implicitly.
5. Private R2 upload, checksum, antivirus and retention. Browser UX must use real secure Engine preview, never link to the old pre-purchase demo as post-sale output. Until this is available, preview controls stay disabled and clearly labeled.
6. Test actual private site update/preview/publish/restore with confirmed client identity and return GET; QA at 1440/390/320; concurrent/malformed/timeout cases; preservation of original accounts/Stripe, SEO and site pages.
7. No public release until separate human authorization. `FABRYA_CREDITS_ENABLED` remains off by default; private adapter not wired. No provider paid calls.

## Gate summary

- COMMON_CONTRACT_V1: **LOCAL PASS**
- PRODUCT_LEDGER_REFERENCE_CONFORMANCE: **LOCAL PASS**
- ENGINE_PROTOCOL_VALIDATOR: **LOCAL PASS**
- REAL_ENGINE_POSTPURCHASE_PUBLISH: **NOT_CONNECTED**
- PRIVATE_HOSTED_END_TO_END: **NOT_TESTED**
- PUBLIC_MIGRATION: **NOT_DONE**
- TOPUP_STRIPE: **BLOCKED_PRICING**
- FABRYA_CREDITS_ENABLED: **OFF**