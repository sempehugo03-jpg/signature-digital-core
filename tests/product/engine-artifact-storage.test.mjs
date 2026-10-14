import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const retainedQaArtifact=process.env.FABRYA_RETAINED_WORK_HTML||new URL('../../private-release/work-artifacts/a.html',import.meta.url);
import {createModifier} from '../../engine/postpurchase/engine.mjs';
import {retainedWorkBaseline} from '../../product/work-engine-baseline.mjs';
import {compactArtifactHtml,materializeArtifact,ARTIFACT_DERIVED_PREFIX,ARTIFACT_ROW_TEXT_BUDGET} from '../../engine/postpurchase/artifact-storage.mjs';
import {SITE_CHANGE_PROTOCOL} from '../../engine/contracts/site-changes/v1/protocol.mjs';
import {sha256} from '../../engine/postpurchase/auth.mjs';
const hash=s=>sha256(new TextEncoder().encode(s));
const originalHash='09e2612241991aa59cf8d5f936f3d40c9ccd82b4aa505d04c189a16609c98064';
function database(){
 const connection=new DatabaseSync(':memory:');
 const prepare=(sql,values=[])=>({bind(...args){return prepare(sql,args);},async first(){return connection.prepare(sql).get(...values)||null;},async all(){return {results:connection.prepare(sql).all(...values)};},async run(){const result=connection.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}});
 return {connection,db:{prepare,async batch(statements){connection.exec('BEGIN IMMEDIATE');try{const results=[];for(const statement of statements)results.push(await statement.run());connection.exec('COMMIT');return results;}catch(error){connection.exec('ROLLBACK');throw error;}}}};
}
test('large real Work A baseline survives D1 row budget, hours mutation, preview and new Engine instance with exact SHA',{skip:!existsSync(retainedQaArtifact)&&'Requires the retained authenticated Sites QA artifact (not copied into the Product repo)'},async()=>{
 const {connection,db}=database();try{
  const html=await readFile(retainedQaArtifact,'utf8');
  const baseline=await retainedWorkBaseline(html,originalHash),config={template:baseline.template,manifest:baseline.manifest};
  const storedHtml=await compactArtifactHtml({html,content_json:baseline.content_json,config});
  assert.ok(storedHtml.startsWith(ARTIFACT_DERIVED_PREFIX));
  const principal={customer_ref:'customer_large_original01',project_ref:'project_large_original01'},site='site_large_original01',version='version_large_original01',release='release_large_original01';
  const {adapter,store}=createModifier({db});await store.migrate();
  await store.batch([
   ['INSERT INTO fm_sites(site_ref,customer_ref,project_ref,config_json,current_release) VALUES(?,?,?,?,?)',site,principal.customer_ref,principal.project_ref,JSON.stringify(config),release],
   ['INSERT INTO fm_artifacts(version_ref,site_ref,html,content_json,sha256,created_at) VALUES(?,?,?,?,?,?)',version,site,storedHtml,baseline.content_json,originalHash,Date.now()],
   ['INSERT INTO fm_releases(release_ref,site_ref,version_ref,sha256,receipt_json,created_at) VALUES(?,?,?,?,?,?)',release,site,version,originalHash,JSON.stringify({release_ref:release}),Date.now()]
  ]);
  assert.equal((await adapter.getCurrentRelease(principal,{site_ref:site})).sha256,originalHash);
  const materialized=await materializeArtifact(await store.artifact(site,version),config);assert.equal(materialized.html,html);
  const envelope={protocol:SITE_CHANGE_PROTOCOL,...principal,site_ref:site,change_ref:'change_large_hours01',base_version_ref:version,base_release_ref:release,base_sha256:originalHash,idempotency_key:'intent_large_hours01',message:'Modifie horaire ouverture à 19 h',attachments:[],requested_at:'2026-10-13T20:00:00Z'};
  const task=await adapter.submitTask(principal,envelope);assert.equal(task.state,'PREVIEW_READY');
  const preview=await adapter.readPreview(principal,{change_ref:envelope.change_ref});
  assert.equal(preview,html.replace('Tarbes. Le goût du travail juste.','Tarbes. Le goût du travail juste. · Ouverture : 19:00'));
  assert.equal(await hash(preview),task.preview.artifact_sha256);
  const rows=connection.prepare('SELECT html,content_json FROM fm_artifacts').all();
  assert.equal(rows.length,2);for(const row of rows){assert.ok(row.html.startsWith(ARTIFACT_DERIVED_PREFIX));assert.ok(Buffer.byteLength(row.html)+Buffer.byteLength(row.content_json)<=ARTIFACT_ROW_TEXT_BUDGET);}
  const restarted=createModifier({db}).adapter;
  assert.equal(await restarted.readPreview(principal,{change_ref:envelope.change_ref}),preview);
  assert.equal((await restarted.submitTask(principal,envelope)).version_ref,task.version_ref);
  // Alias changes could preserve every rendered byte, so pin the full manifest
  // as well as the template, rather than relying only on the final HTML SHA.
  const altered={...config,manifest:{...config.manifest,fields:config.manifest.fields.map((field,i)=>i?field:{...field,aliases:['autre champ']})}};
  connection.prepare('UPDATE fm_sites SET config_json=? WHERE site_ref=?').run(JSON.stringify(altered),site);
  await assert.rejects(restarted.readPreview(principal,{change_ref:envelope.change_ref}),/ENGINE_RENDER_CONFIG_CHANGED/);
  connection.prepare('UPDATE fm_sites SET config_json=? WHERE site_ref=?').run(JSON.stringify(config),site);
  const artifact=await store.artifact(site,task.version_ref),data=JSON.parse(artifact.content_json);data.hours='20:00';
  connection.prepare('UPDATE fm_artifacts SET content_json=? WHERE version_ref=?').run(JSON.stringify(data),task.version_ref);
  await assert.rejects(restarted.readPreview(principal,{change_ref:envelope.change_ref}),/ENGINE_ARTIFACT_CORRUPT/);
 }finally{connection.close();}
});
test('compact storage rejects non-roundtripping HTML and an oversized single content value',async()=>{
 const config={template:'<p>{{FABRYA:large}}</p>',manifest:{schema:'fabrya.mutable-content.v1',fields:[{id:'large',pointer:'/large',type:'text',max_length:10000,aliases:['contenu']}]}};
 const content_json=JSON.stringify({large:'x'.repeat(1_100_000)});
 await assert.rejects(compactArtifactHtml({html:'<p>'+ 'y'.repeat(1_100_000)+'</p>',content_json,config}),/ENGINE_ARTIFACT_ROUNDTRIP_MISMATCH/);
 await assert.rejects(compactArtifactHtml({html:'<p>'+ 'x'.repeat(2_000_000)+'</p>',content_json:JSON.stringify({large:'x'.repeat(2_000_000)}),config}),/ENGINE_ARTIFACT_ROW_TOO_LARGE/);
});
