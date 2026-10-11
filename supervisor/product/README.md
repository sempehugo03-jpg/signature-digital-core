# Fabrya Product / Interface — durable supervisor

Scope: sempehugo03-jpg/signature-digital-core, branch work/fabrya-product-20261010, draft PR 202. Acquired interface reference 903d2715dc0962306d77272755dae574453a149c. No product, Kevin, SEO, legacy billing or public deployment code is changed.

## Runtime

`Fabrya Product Supervisor` runs one useful action and stops. GitHub Actions hosts it independently of Work. The workflow must also exist on the default branch for schedule, manual dispatch and workflow completion events; its checkout is always the fixed Product branch. This bootstrap adds only the supervisor workflow to main and does not merge the Product PR or deploy any site.

Wake sources: relevant Product pushes, workflow_dispatch, worker/browser workflow completion and failed supervisor completion. Supervisor wakes are scheduled at minutes 17 and 47; the separate Fabrya Product Watchdog wakes at minutes 7 and 37 and listens to failed Supervisor completions. Both execute the same single Supervisor and share its concurrency lock. GitHub prohibits a workflow from listening to its own completion. GitHub scheduling is best effort and may be delayed; no claim of exact 30-minute availability. Public repository schedules may be disabled by GitHub after prolonged inactivity. Observe run history and re-enable if GitHub disables the workflow.

State lives on a separate orphan branch `state/fabrya-product-supervisor`, file `state.json`. Every checkpoint is an append-only Git commit. The state ref advances without force, so a stale writer cannot overwrite another checkpoint. Concurrency serializes all normal wake events. Read-after-write reconciliation and commit-scoped task IDs prevent duplication; unknown external effects block rather than retry blindly. The state branch never changes product code.

Each wake reads the real Product branch, real PR 202, last durable state and comparison to the previous product commit. Losing the acquired baseline, changing branch, closing the PR or an incomplete diff blocks execution. Only Product changes trigger technical QA. Visual changes invalidate visual evidence until an actual browser consumer delivers new evidence; DOM checks alone cannot clear those gates.

## Controlled recovery proof

The first wake records a RUNNING read-only repository probe, then its successful receipt and checkpoint, then kills its own process with SIGKILL. There is no payment, deployment or customer data in this probe. A separate failed-workflow wake or scheduled watchdog reads the receipt, checks the previous GitHub execution is actually completed, and finishes without redoing the committed action. Durable evidence contains interrupted/recovered run IDs, effect_count=1 and recovery_count. PENDING/INTERRUPTED/PASS are recorded, never inferred from code existing. A still-active stale run blocks rather than creating a second worker.

## Actual remaining limitations

The repository currently has no authenticated durable Codex task consumer and no authenticated durable cloud-browser consumer. `worker_queue` and `qa_queue` are durable, commit-scoped task contracts, **not** executed Codex tasks or browser QA. Accordingly PRODUCT_WORKER_DISPATCH and PRODUCT_QA_DISPATCH stay FAIL. There is no paid provider API credential or open budget. No supplier request is made.

A future Codex consumer must claim one task by its stable ID, execute against the exact commit, preserve gates, reconcile a lost response before retry, and report a public-safe run receipt. A future browser consumer must bind the exact private version, really navigate and inspect pixels at 1440/390/320, and persist private screenshots with only safe evidence references in the public state. Neither transport can be declared PASS from a local fake, queue creation or a manually opened tab.

This version can detect relevant Product changes, run technical tests/build, queue precise correction/browser tasks and block honestly until the required consumer exists. On a crash during unknown external work it blocks technical execution; it never silently repeats an effect. Technical QA interrupted before its final receipt currently requires reconciliation, rather than pretending completion.

## Human boundaries

State remains BLOCKED_HUMAN / FIRST_LIVE_PAYMENT_AUTHORIZATION after the probe, next action WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION. Existing interface readiness does not provide fresh Checkout identity, validated version, price and no-duplicate private evidence. READY_TO_CHARGE_59_EUR is therefore NO until those are freshly attested in a private store. No project IDs, session URLs, customer names, payment authorization tokens or Stripe objects are placed in this public repository.

No workflow input, PR comment, issue label, worker output or previous readiness report authorizes payment or public deployment. This runtime contains no payment/public deployment capability at all. Payment, bank/3DS/MFA, legal/fiscal/identity changes, inaccessible secrets, irreversible deletion and sensitive public merge/deployment require Hugo. The proposed 59 EUR monthly charge is not executed. Future authorization must bind project, version, amount, cadence, Checkout identity and expiry in private state; the human enters payment credentials and handles 3DS themselves.

A full paid LIVE flow requires separate authentic evidence of payment, subscription, invoice, Stripe webhook delivery, activation, client space, portal and absence of duplicate payment/subscription. Only then may PUBLIC_READY be reached, followed by a separate human deployment gate. This installation does not claim any of those proofs.

## Privacy and verification

Public state excludes tokens, Stripe/customer identifiers, Checkout URLs, emails and payment credentials. Runtime GitHub token is transient, checkout does not persist credentials, logs contain only safe reports. API methods enforce the sole repository. State writes only target the dedicated state branch. Tasks only target product/ and tests/product/. No state or task includes personal browser sessions.

`node --test tests/supervisor/*.test.mjs` verifies acquisition, scope, changed-zone invalidation, task deduplication, recovery precedence, human gates, sensitive-state rejection and competing checkpoints. `npm run build` verifies the existing repository. No product/interface runtime change is included, so the acquired 32 Product tests and browser evidence are preserved rather than repeatedly redone.

PRODUCT_SUPERVISOR_READY can only PASS when all nine required gates PASS. Until real Codex/browser dispatch is proved it remains FAIL, even if installation and recovery succeed.
