# Private client administration: verified scope and remaining gates

Product only. Existing accounts, projects and credits candidate retained. No Engine code changed by this task; remote Engine change 48ffcd2 merged without rewriting it. site-change/v1.0.0 preserved.

Hosted source: 44beaa8ae6e5554da8c57abf536a6c4e597797bc, existing owner-private QA https://fabrya-product-qa.sempehugo03.chatgpt.site. HTTP probe executed on previous worker build e4a37c7; final source adds a migration-existence check and fixes the probe stdin handling, plus a signed invoice webhook fixture test. No public deployment or LIVE payment.

Validation:
- npm run build PASS (Vinext private Worker, DB-only assertions).
- 14/14 targeted Node/SQLite tests PASS. Includes a **local provider fixture** for signed invoice.paid -> 100 credits once; invoice failure -> no grant. This is not a real Stripe TEST subscription proof.
- 43/43 hosted HTTP checks PASS. Two genuine fictitious password accounts (charpentier / kiné), persisted company briefs, logout/login, own zero wallets, own lists, cross project/credit/preview/file refs rejected both ways, CSRF and browser grant/publish forbidden.
- Cross-file and preview tests use foreign refs. No real file upload, active customer site, modified private preview, browser visual QA or genuine paid Stripe TEST invoice was present. No complete post-purchase PASS.
- Existing historical Product suite on initial a766ef9: 5 pass / 13 fail (legacy tests expecting deterministic demo delivery to be payable/previewable, incompatible with retained delivery gate). Client UI legacy test dependency linkedom missing. Gates were not weakened to satisfy old fixtures.

Implemented additions:
- Existing credit module integrated into authenticated HTTP/Worker routes. Opt-in only; enabled exclusively on retained QA runtime.
- Additive schema initialization restricted to exact private QA origin + QA flag + credits flag; public DB never initialized. Fast installed-schema check; no destructive migration.
- Monthly invoice bridge in existing Stripe webhook and activation reconciliation; provider invoice and active subscription re-read, price/mode/period verified, idempotent wallet.
- FABRYA logo launcher for active accounts + existing change center: balance, history, natural-language request text, guarded attachment availability, private preview and approval actions, honest recharge state.
- Post-purchase customers cannot use pre-purchase demo generation or approve paths as a modifier.
- Owned file and preview reads with stored hash checks and no arbitrary browser URL/path. Preview route fails closed without modifier reader.
- Server-only Product approval verifier binds customer/project/change/approval/version/hash and current active subscription, available for coordinated Engine injection; not exposed as an unauthenticated HTTP approval service.

Blockers:
1. QA runtime lacks FABRYA_PRODUCT_STRIPE_TEST_KEY and FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET. Price TEST exists; no key was copied from another application. Real paid invoice -> activation/credits remains unproved.
2. r2=null; private file bucket and safety scanner unavailable. Photo/document/audio not open.
3. Real Engine transport, server-side customer/site binding, measured credit conversion policy and deployment adapter not connected to Product. Product verifier is available but not yet injected into Engine. No Engine code modified or fake preview/publication/debit.
4. Recharge prices/terms unspecified; Checkout remains closed. No price invented.
5. Complex request -> paid Work quote transport and real rollback not certified.

Overall private post-purchase end-to-end: FAIL; complete test ready: NO.

Changed review files:
- product/change-approval.mjs
- product/first-touch.mjs
- product/change-credits-http.mjs
- product/index.html
- product/delivery-gate.mjs
- product/private-composition.mjs
- product/auth.mjs
- product/presentation.mjs
- product/worker-entry.mjs
- product/work-remote-qa.mjs
- product/change-center.mjs
- product/service.mjs
- product/change-credits.mjs
- product/legacy-readonly.mjs
- product/work-mcp.mjs
- product/http.mjs
- product/product.css
- product/work-product-adapter.mjs
- product/client.mjs
- tests/product/change-credits.test.mjs
- private-release/platform-contract.mjs
- product/private-admin-probe.mjs
- product/change-migration.mjs
- docs/product/private-admin-local.tap
- tests/product/private-admin.test.mjs
- docs/product/private-admin-hosted.json
