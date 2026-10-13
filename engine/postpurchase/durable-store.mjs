// Engine-only D1 tables. Explicit migration; no Product accounting changes.
export const migration=[
 `CREATE TABLE IF NOT EXISTS fm_sites(site_ref TEXT PRIMARY KEY,customer_ref TEXT NOT NULL,project_ref TEXT NOT NULL,config_json TEXT NOT NULL,current_release TEXT NOT NULL,busy_change TEXT,revision INTEGER NOT NULL DEFAULT 1,UNIQUE(customer_ref,project_ref))`,
 `CREATE TABLE IF NOT EXISTS fm_artifacts(version_ref TEXT PRIMARY KEY,site_ref TEXT NOT NULL,html TEXT NOT NULL,content_json TEXT NOT NULL,sha256 TEXT NOT NULL,created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fm_releases(release_ref TEXT PRIMARY KEY,site_ref TEXT NOT NULL,version_ref TEXT NOT NULL,sha256 TEXT NOT NULL,receipt_json TEXT NOT NULL,created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fm_tasks(change_ref TEXT PRIMARY KEY,site_ref TEXT NOT NULL,customer_ref TEXT NOT NULL,project_ref TEXT NOT NULL,idempotency_key TEXT NOT NULL,envelope_json TEXT NOT NULL,payload_hash TEXT NOT NULL,state TEXT NOT NULL,result_json TEXT NOT NULL DEFAULT '{}',version_ref TEXT,preview_token_hash TEXT,preview_expires INTEGER,elapsed_ms REAL NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(customer_ref,idempotency_key))`,
 `CREATE TABLE IF NOT EXISTS fm_events(id INTEGER PRIMARY KEY AUTOINCREMENT,change_ref TEXT NOT NULL,event TEXT NOT NULL,created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fm_commands(command_key TEXT PRIMARY KEY,change_ref TEXT NOT NULL,kind TEXT NOT NULL,payload_hash TEXT NOT NULL,state TEXT NOT NULL,receipt_json TEXT,created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS fm_nonces(service_id TEXT NOT NULL,nonce TEXT NOT NULL,expires_at INTEGER NOT NULL,PRIMARY KEY(service_id,nonce))`
];
export class ModifierStore{
 constructor(db){if(!db)throw Error('ENGINE_DB_REQUIRED');this.db=db.withSession?db.withSession('first-primary'):db;}
 statement(sql,...args){return this.db.prepare(sql).bind(...args);}
 first(sql,...args){return this.statement(sql,...args).first();}
 run(sql,...args){return this.statement(sql,...args).run();}
 async migrate(){for(const sql of migration)await this.db.prepare(sql).run();}
 batch(commands){return this.db.batch(commands.map(([sql,...args])=>this.statement(sql,...args)));}
 async event(change,event,now){await this.run('INSERT INTO fm_events(change_ref,event,created_at) VALUES(?,?,?)',change,JSON.stringify(event),now);}
 async site(principal,siteRef){if(!principal?.customer_ref||!principal?.project_ref)throw Error('ENGINE_PRINCIPAL_REQUIRED');const site=await this.first('SELECT * FROM fm_sites WHERE site_ref=? AND customer_ref=? AND project_ref=?',siteRef,principal.customer_ref,principal.project_ref);if(!site)throw Error('ENGINE_NOT_FOUND');return site;}
 async task(principal,change){const row=await this.first('SELECT * FROM fm_tasks WHERE change_ref=? AND customer_ref=? AND project_ref=?',change,principal.customer_ref,principal.project_ref);if(!row)throw Error('ENGINE_NOT_FOUND');await this.site(principal,row.site_ref);return row;}
 async artifact(siteRef,version){const row=await this.first('SELECT * FROM fm_artifacts WHERE site_ref=? AND version_ref=?',siteRef,version);if(!row)throw Error('ENGINE_ARTIFACT_NOT_FOUND');return row;}
 async release(siteRef,release){const row=await this.first('SELECT * FROM fm_releases WHERE site_ref=? AND release_ref=?',siteRef,release);if(!row)throw Error('ENGINE_RELEASE_NOT_FOUND');return row;}
}
