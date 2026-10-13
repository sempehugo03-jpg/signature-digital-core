// Additive storage in the EXISTING customer Site's own D1 binding.
export const sitesDataSchema=[
 `CREATE TABLE IF NOT EXISTS fs_data_state(singleton INTEGER PRIMARY KEY CHECK(singleton=1),binding_json TEXT NOT NULL,current_release TEXT NOT NULL,revision INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fs_data_artifacts(sha256 TEXT PRIMARY KEY,html TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fs_data_releases(release_ref TEXT PRIMARY KEY,sha256 TEXT NOT NULL,generation INTEGER NOT NULL,receipt_json TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fs_data_commands(command_key TEXT PRIMARY KEY,payload_hash TEXT NOT NULL,state TEXT NOT NULL,receipt_json TEXT)`,
 `CREATE TABLE IF NOT EXISTS fs_data_nonces(nonce TEXT PRIMARY KEY,expires_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fs_data_assets(sha256 TEXT PRIMARY KEY,byte_size INTEGER NOT NULL,part_count INTEGER NOT NULL,state TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fs_data_asset_parts(sha256 TEXT NOT NULL,part INTEGER NOT NULL,chunk_sha256 TEXT NOT NULL,bytes BLOB NOT NULL,PRIMARY KEY(sha256,part))`
];
