# Retained Sites data publisher — candidate only

This is the Engine's existing publisher port implemented as content updates in
each existing A/B Site, using the supported Sites Worker + D1 data-write model.
It creates no new Site, Engine, public proxy, cross-Site pointer or provider.
The existing Site IDs, origins, owner-private audience and exact Work baseline
HTML must be retained. Deployment into those Sites has not been performed.

## Migration packaging

`sites-data-db/schema.ts` is the Drizzle schema; generated SQL and metadata are
under `sites-data-drizzle/` (generated with
`node node_modules/drizzle-kit/bin.cjs generate --config engine/postpurchase/sites-data-drizzle.config.ts`).
The Site owner copies the schema/config and generated migration directory into
the target retained Site's source, preserving any existing migration history.
Declare its logical D1 binding `DB` in `.openai/hosting.json`, and include the
generated SQL, `meta/0000_snapshot.json` and `meta/_journal.json` in the deployed
artifact's `.openai/drizzle/` directory as the retained build does. Sites applies
hosted migrations before uploading the Worker. Inspect target migration state
before appending; never overwrite applied history. The worker does not execute
CREATE/ALTER. Its first authenticated writer only inserts immutable baseline
data into the migration-owned tables. No seed data is embedded in migrations.

## Trusted composition

Compile `createSitesDataWorker` into each original Site with server-fixed
`binding`, `baseline` and `baseline_release_ref`. Supply its private per-Site
`FABRYA_SITE_WRITER_SECRET` through Sites secrets, and preserve owner-private
Sites access. The Product-side publisher uses a server-only allowlist of the
exact same binding, its legitimate retained Sites service bearer and writer
secret. Neither credential nor scope is accepted from the browser.

`publish/restore` use a signed, same-origin POST to `/_fabrya/site-content`;
nonces, immutable command hashes and CAS are durable. A command started with an
unknown result is reconciled, never restarted. Readback independently hashes
the actual `/index.html` response and checks its release header. Restore serves
the retained earlier release's original immutable bytes.

## Photographs

Every `/engine/assets/<project>/<safe-sha>.png` reference is parsed, including
references in script variables. Absolute cross-origin or foreign-project
references are refused. The publisher obtains bytes through the retained
`readSafePhotograph` using the original project/user ownership, then transfers
immutable 256 KiB chunks via the signed writer. The target Site reassembles and
checks the full hash, bounded PNG raster and canonical re-encoding before READY.
The same Site serves those assets at the same relative path and the publisher
hashes their HTTP readback before committing HTML. Unavailable, unscanned,
foreign, incomplete or corrupt assets prevent publication.

## Limits

All results here remain local tests. No hosted A/B publication, migration,
customer/browser preview, isolation, restoration or cost observation is claimed.
Receipts explicitly report `actual_cost_microeur: null`; Product's verified-cost
settlement remains closed until an actual cost policy is established. This
candidate does not change subscription/credits/approvals or contract v1.0.0.
