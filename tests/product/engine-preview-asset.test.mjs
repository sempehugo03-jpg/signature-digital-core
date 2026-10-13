import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createProductModifier} from '../../engine/postpurchase/product-adapter.mjs';
import {ModifierStore} from '../../engine/postpurchase/durable-store.mjs';
import {migrateImages,privateImageStorage,photographScanner} from '../../engine/postpurchase/images.mjs';
import {encodePng} from '../../engine/postpurchase/png-raster.mjs';
import {sha256} from '../../engine/postpurchase/auth.mjs';
import {SITE_CHANGE_PROTOCOL} from '../../engine/contracts/site-changes/v1/protocol.mjs';
const hash=s=>sha256(new TextEncoder().encode(s));
function database(){
 const connection=new DatabaseSync(':memory:');
 const prepare=(sql,values=[])=>({bind(...args){return prepare(sql,args.map(value=>value instanceof ArrayBuffer?new Uint8Array(value):value));},async first(){return connection.prepare(sql).get(...values)||null;},async all(){return {results:connection.prepare(sql).all(...values)};},async run(){const result=connection.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}});
 return {connection,db:{prepare,async batch(statements){connection.exec('BEGIN IMMEDIATE');try{const results=[];for(const statement of statements)results.push(await statement.run());connection.exec('COMMIT');return results;}catch(error){connection.exec('ROLLBACK');throw error;}}}};
}
async function fixture(){
 const f=database(),principal={customer_ref:'customer_preview_original01',project_ref:'project_preview_original01'},site='site_preview_original01',version='version_preview_original01',release='release_preview_original01';
 const store=new ModifierStore(f.db);await store.migrate();await migrateImages(f.db);
 async function photograph(value,suffix){
  const data=new Uint8Array(4*3*2).fill(value);for(let i=3;i<data.length;i+=4)data[i]=255;
  const bytes=encodePng({width:3,height:2,data}),sha=await sha256(bytes),storage=privateImageStorage({db:f.db,project_ref:principal.project_ref,user_ref:'preview_original01'});
  await storage.put('client-change-quarantine/'+principal.project_ref+'/file_photo_'+suffix,bytes);
  assert.equal(await photographScanner(f.db).verifySafe({bytes,mime:'image/png',sha256:sha}),true);
  return {bytes,sha};
 }
 const image=await photograph(70,'referenced01'),unused=await photograph(150,'unreferenced01');
 const locator='/engine/assets/'+principal.project_ref+'/'+image.sha+'.png',html='<html><script>const vehicleAsset="'+locator+'";</script><p>Horaires: 18:00</p></html>';
 const config={template:html.replace('18:00','{{FABRYA:hours}}'),manifest:{schema:'fabrya.mutable-content.v1',fields:[{id:'hours',pointer:'/hours',type:'time',aliases:['horaire']}]}};
 await store.batch([
  ['INSERT INTO fm_sites(site_ref,customer_ref,project_ref,config_json,current_release) VALUES(?,?,?,?,?)',site,principal.customer_ref,principal.project_ref,JSON.stringify(config),release],
  ['INSERT INTO fm_artifacts(version_ref,site_ref,html,content_json,sha256,created_at) VALUES(?,?,?,?,?,?)',version,site,html,JSON.stringify({hours:'18:00'}),await hash(html),Date.now()],
  ['INSERT INTO fm_releases(release_ref,site_ref,version_ref,sha256,receipt_json,created_at) VALUES(?,?,?,?,?,?)',release,site,version,await hash(html),JSON.stringify({release_ref:release}),Date.now()]
 ]);
 const bridge=createProductModifier({db:f.db,principal}),envelope={protocol:SITE_CHANGE_PROTOCOL,...principal,site_ref:site,change_ref:'change_preview_original01',base_version_ref:version,base_release_ref:release,base_sha256:await hash(html),idempotency_key:'intent_preview_original01',message:'Modifie horaire à 19 h',attachments:[],requested_at:'2026-10-13T20:00:00Z'};
 await bridge.submitTask(envelope);
 return {...f,bridge,principal,site,image,unused,args:{request_id:envelope.change_ref,site_ref:site,sha256:image.sha}};
}
test('preview port returns only owner-scanned PNG actually referenced in immutable script-backed preview',async()=>{
 const f=await fixture();try{
  const asset=await f.bridge.readPreviewAsset(f.args);
  assert.equal(asset.mime,'image/png');assert.equal(asset.sha256,f.image.sha);assert.deepEqual(asset.bytes,f.image.bytes);
  assert.equal(asset.artifact_sha256,(await f.bridge.validatePreview({request_id:f.args.request_id})).artifact_sha256);
  await assert.rejects(f.bridge.readPreviewAsset({...f.args,sha256:f.unused.sha}),/ENGINE_PREVIEW_ASSET_NOT_REFERENCED/);
  await assert.rejects(f.bridge.readPreviewAsset({...f.args,url:'https://external.example/image.png'}),/ENGINE_PREVIEW_ASSET_INPUT/);
 }finally{f.connection.close();}
});
test('foreign customer, project and site are denied before any preview photograph is returned',async()=>{
 const f=await fixture();try{
  for(const principal of [{customer_ref:'customer_other_original01',project_ref:f.principal.project_ref},{customer_ref:f.principal.customer_ref,project_ref:'project_other_original01'}]){
   await assert.rejects(createProductModifier({db:f.db,principal}).readPreviewAsset(f.args),/ENGINE_NOT_FOUND/);
  }
  await assert.rejects(f.bridge.readPreviewAsset({...f.args,site_ref:'site_other_original01'}),/ENGINE_NOT_FOUND/);
 }finally{f.connection.close();}
});
test('preview artifact corruption and scanned raster chunk corruption both fail closed',async()=>{
 const f=await fixture();try{
  const task=f.connection.prepare('SELECT version_ref FROM fm_tasks WHERE change_ref=?').get(f.args.request_id),artifact=f.connection.prepare('SELECT html FROM fm_artifacts WHERE version_ref=?').get(task.version_ref);
  f.connection.prepare('UPDATE fm_artifacts SET html=? WHERE version_ref=?').run(artifact.html+' ',task.version_ref);
  await assert.rejects(f.bridge.readPreviewAsset(f.args),/ENGINE_ARTIFACT_CORRUPT/);
  f.connection.prepare('UPDATE fm_artifacts SET html=? WHERE version_ref=?').run(artifact.html,task.version_ref);
  const chunk=f.connection.prepare('SELECT bytes FROM fm_image_safe_chunks WHERE safe_sha256=? AND part=0').get(f.image.sha).bytes,changed=Uint8Array.from(chunk);changed[changed.length-1]^=1;
  f.connection.prepare('UPDATE fm_image_safe_chunks SET bytes=? WHERE safe_sha256=? AND part=0').run(changed,f.image.sha);
  await assert.rejects(f.bridge.readPreviewAsset(f.args),/ENGINE_IMAGE_STORAGE_HASH/);
 }finally{f.connection.close();}
});
