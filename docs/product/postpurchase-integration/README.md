# Product / Engine integration — 2026-10-13

Product continues PR207, parent dc44d766b28476c9f87643c0301757845e273088.
Engine continues a9658fa via reviewed candidate13d4f2cebaaf37965c6d6d8f078c0da0a660510b.
Protocol site-change/v1.0.0 unchanged. Each owner changes only their repository.

The existing private QA composition supplies the existing Engine module via
FABRYA_POSTPURCHASE_ENGINE_FACTORY and the storage/scanner via
FABRYA_POSTPURCHASE_STORAGE_FACTORY. These are server functions, not request
fields or new credentials. Product checks the session and fp_projects.user_id
before creating an immutable customer/project Engine scope. Product files do
not import or duplicate Engine implementation. The retained Sites source holds
Engine modules at engine/postpurchase; the recorded hosting overlay imports
those exact modules and is NOT a replacement deployer or standalone app.

The existing conversation POST reserves and dispatches the durable command,
reconciles tasks, verifies preview receipts and persists the candidate. Client
validation persists first, then drives the internal publication method. No
browser publish/grant endpoint was added. Engine checks the stored exact decision.
Publication unavailable metadata stops before any ambiguous publishing state.

Restoration POST authenticates ownership and same-origin, records an immutable
release-specific consent in fp_change_restore_consents before invoking restore.
Target/old hash/current release/owner/approval/idempotency are read independently
by the Engine. Restoration outcome is verified before Product marks restored.
Opaque consent strings alone are refused. A retry retains the exact command.
Existing request retries use their saved baseline even after publication;
credit settlement is conditional/atomic and reconciles previously settled holds.

Commercial credit conversion is unavailable unless an explicit approved policy
reference, state and positive microEUR unit are configured by the Product owner.
No policy or amount has been invented or installed. Native D1 reread showed
fp_subscriptions,fp_activations,fp_credit_wallets,fp_change_requests EMPTY before
this integration. No paid TEST invoice or activated postpurchase customer site
exists to exercise positive modifications. No payment/credit grant was fabricated.

Private QA deployed source d661da93798a65797f90967b3121eac976dcf327;
deployment appgdep_6ace4e5a2b58819189a46a74421610d4 succeeded,env3,MCP preserved.
Fifteen targeted Product local tests PASS. The HTTP/static publisher in those
tests is explicitly LOCAL FIXTURE and does not certify hosted publish/rollback.
Engine22 local tests PASS. Native private QA build/assertions PASS.

## Hard blockers

1. Native Sites tools publish archive/source from the author environment. No
   documented operational hosted server publisher transport/credential is
   available. No second publisher, pointer-swapping site or fake deployment.
2. No authentic paid TEST activation exists for client A/B. Product eligibility
   must keep refusing changes/photos/consent, not bypass subscription checks.
3. Credit commercial policy and complete technical cost tariffs are not approved.
4. No authoritative binding of those customer projects to delivered mutable
   Work sites; Engine technical fixture registrations are not customer ownership.

Consequently no real client preview/publication/restoration/credit spend is
certified. Existing private photograph scan/render proof is Engine a9658fa,
not Product upload or a modified published client site. No fabrya.fr or Stripe
LIVE changes and no extra paid service. Full hosted journey remains FAIL.

Hosted authenticated HTTP run:49/49 checks PASS on source d661da9. Checks include
owner factory present, storage/scanner present, real sessions/logout/relogin,
project persistence, scoped reads and writes both ways, refusal of foreign
restore/validation, CSRF, no browser grant/publish, unpaid modification/photo
and restore refusal. hosted.json contains the fictional project IDs and exact
checks, with no session tokens/passwords. Full journey is NOT exercised because
eligibility and publisher gates remain closed. The later input-hash guarded
request batch change has15 local tests but no positive hosted credit transaction.
No real duplicate/concurrent/interrupt publication can be claimed from this run.
