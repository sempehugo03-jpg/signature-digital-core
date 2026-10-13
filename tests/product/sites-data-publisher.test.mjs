import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {createSitesDataWorker,SITES_DATA_PATH} from '../../engine/postpurchase/sites-data-worker.mjs';
import {createSitesDataPublisher} from '../../engine/postpurchase/sites-data-publisher.mjs';
import {sha256,signRequest} from '../../engine/postpurchase/auth.mjs';
import {migrateImages,privateImageStorage,photographScanner} from '../../engine/postpurchase/images.mjs';
import {encodePng} from '../../engine/postpurchase/png-raster.mjs';
const encode=s=>new TextEncoder().encode(s),hash=s=>sha256(encode(s));
const clock=()=>Date.parse('2026-10-13T20:00:00Z');
const migrationDirectory=new URL('../../engine/postpurchase/sites-data-drizzle/',import.meta.url);
const migrations=await Promise.all((await readdir(migrationDirectory)).filter(name=>name.endsWith('.sql')).sort().map(name=>readFile(new URL(name,migrationDirectory),'utf8')));
function database(){
 const connection=new DatabaseSync(':memory:');
 const prepare=(sql,values=[])=>({bind(...args){return prepare(sql,args.map(value=>value instanceof ArrayBuffer?new Uint8Array(value):value));},async first(){return connection.prepare(sql).get(...values)||null;},async all(){return {results:connection.prepare(sql).all(...values)};},async run(){const r=connection.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}});
 return {connection,db:{prepare,async batch(statements){connection.exec('BEGIN IMMEDIATE');try{const out=[];for(const statement of statements)out.push(await statement.run());connection.exec('COMMIT');return out;}catch(error){connection.exec('ROLLBACK');throw error;}}}};
}
function fixture(label='a'){
 const {connection,db}=database(),binding={customer_ref:'customer_original_'+label,origin:'https://original-'+label+'.chatgpt.site',project_ref:'project_original_'+label,site_project_id:'appgprj_original_'+label,site_ref:'site_original_'+label};
 for(const sql of migrations)connection.exec(sql);
 const baseline='<html><h1>Site original '+label+'</h1></html>',baseline_release_ref='release_original_'+label,writerSecret='writer_'+label+'_'.repeat(40),serviceToken='test_only_service_'+label;
 const worker=createSitesDataWorker({binding,baseline,baseline_release_ref,clock}),env={DB:db,FABRYA_SITE_WRITER_SECRET:writerSecret};
 let publishCalls=0,loseNextResponse=false;
 const fetchImpl=async(url,options={})=>{
  assert.equal(new URL(url).origin,binding.origin);assert.equal(new Headers(options.headers).get('OAI-Sites-Authorization'),'Bearer '+serviceToken);
  if(options.body&&JSON.parse(options.body).action==='publish')publishCalls++;
  const response=await worker.fetch(new Request(url,options),env);
  if(loseNextResponse){loseNextResponse=false;throw Error('TEST_RESPONSE_LOST_AFTER_COMMIT');}return response;
 };
 const publisher=(sourceDb=null)=>createSitesDataPublisher({sites:[{binding,writerSecret,serviceToken}],db:sourceDb,fetchImpl,clock});
 return {binding,baseline,baseline_release_ref,writerSecret,worker,env,connection,publisher,loseResponse(){loseNextResponse=true;},publishCalls:()=>publishCalls};
}
async function signed(f,body,{nonce=crypto.randomUUID().replaceAll('-',''),timestamp=String(clock()),secret=f.writerSecret}={}){
 const raw=JSON.stringify({...body,binding:body.binding||f.binding}),signature=await signRequest({secret,method:'POST',path:SITES_DATA_PATH,body:raw,timestamp,nonce});
 return f.worker.fetch(new Request(f.binding.origin+SITES_DATA_PATH,{method:'POST',headers:{'x-fabrya-timestamp':timestamp,'x-fabrya-nonce':nonce,'x-fabrya-signature':signature},body:raw}),f.env);
}
test('retained same-Site HTML bytes publish and restore through signed data writer; cost remains unknown',async()=>{
 const a=fixture('a'),b=fixture('b');try{
  const before=await a.worker.fetch(new Request(a.binding.origin+'/index.html'),a.env);assert.equal(await before.text(),a.baseline);
  assert.equal(a.connection.prepare('SELECT count(*) n FROM fs_data_state').get().n,0,'GET does not initialize or write data');
  const html='<html><h1>Modification réelle des octets</h1></html>',sha=await hash(html),publisher=a.publisher();
  const receipt=await publisher.publish({site:a.binding,command_key:'publish_change_00001',html,artifact_sha256:sha,expected_release_ref:a.baseline_release_ref});
  assert.equal(receipt.actual_cost_microeur,null);
  assert.equal((await publisher.verify({site:a.binding,release:receipt,expected_sha256:sha})).sha256,sha);
  assert.deepEqual(await publisher.publish({site:a.binding,command_key:'publish_change_00001',html,artifact_sha256:sha,expected_release_ref:a.baseline_release_ref}),receipt);
  assert.equal(a.connection.prepare('SELECT revision FROM fs_data_state').get().revision,1);
  assert.equal(await (await b.worker.fetch(new Request(b.binding.origin+'/'),b.env)).text(),b.baseline);
  const restored=await publisher.restore({site:a.binding,command_key:'rollback_change_00001',target_release:{release_ref:a.baseline_release_ref},expected_release_ref:receipt.release_ref});
  assert.equal(restored.release_ref,a.baseline_release_ref);
  await publisher.verify({site:a.binding,release:restored,expected_sha256:await hash(a.baseline)});
  assert.equal(a.connection.prepare('SELECT count(*) n FROM fs_data_artifacts').get().n,2);
 }finally{a.connection.close();b.connection.close();}
});
test('interruption after atomic commit reconciles on new publisher without repeating publication',async()=>{
 const f=fixture();try{
  const html='<html>Version modifiée</html>',sha=await hash(html);f.loseResponse();
  await assert.rejects(f.publisher().publish({site:f.binding,command_key:'publish_interrupt001',html,artifact_sha256:sha,expected_release_ref:f.baseline_release_ref}),/TEST_RESPONSE_LOST_AFTER_COMMIT/);
  const receipt=await f.publisher().reconcile({site:f.binding,command_key:'publish_interrupt001'});
  assert.ok(receipt);await f.publisher().verify({site:f.binding,release:receipt,expected_sha256:sha});
  assert.equal(f.publishCalls(),1);assert.equal(f.connection.prepare('SELECT revision FROM fs_data_state').get().revision,1);
  assert.equal(await f.publisher().reconcile({site:f.binding,command_key:'publish_unknown001'}),null);
 }finally{f.connection.close();}
});
test('writer refuses scope attacks, invalid signatures, timestamp replay, unsigned and foreign host requests',async()=>{
 const f=fixture();try{
  const body={action:'reconcile',command_key:'publish_security001'};
  assert.equal((await signed(f,{...body,binding:{...f.binding,customer_ref:'customer_intruder'}})).status,403);
  assert.equal((await signed(f,body,{secret:'wrong_secret_'.repeat(5)})).status,401);
  assert.equal((await signed(f,body,{timestamp:String(clock()-120000)})).status,401);
  const nonce='nonce_once_security_0001';assert.equal((await signed(f,body,{nonce})).status,200);assert.equal((await signed(f,body,{nonce})).status,401);
  assert.equal((await f.worker.fetch(new Request(f.binding.origin+SITES_DATA_PATH,{method:'POST',body:JSON.stringify(body)}),f.env)).status,401);
  assert.equal((await f.worker.fetch(new Request('https://foreign.chatgpt.site/index.html'),f.env)).status,403);
  await assert.rejects(f.publisher().reconcile({site:{...f.binding,project_ref:'project_intruder'},command_key:body.command_key}),/SITES_PUBLISHER_SCOPE/);
 }finally{f.connection.close();}
});
test('CAS conflict, immutable command payload and unavailable assets fail closed',async()=>{
 const f=fixture();try{
  const html='<html>Nouvelle version</html>',sha=await hash(html),command={action:'publish',command_key:'publish_conflict001',html,artifact_sha256:sha,expected_release_ref:f.baseline_release_ref};
  assert.equal((await signed(f,command)).status,200);
  assert.equal((await signed(f,{...command,html:'different',artifact_sha256:await hash('different')})).status,409);
  assert.equal((await signed(f,{...command,command_key:'publish_stale0001'})).status,409);
  assert.equal((await signed(f,{...command,command_key:'publish_stale0001'})).status,503,'STARTED unknown commands are never reapplied');
  const photo='<html><img src="/engine/assets/project_orig/abc.png"></html>';
  assert.equal((await signed(f,{...command,command_key:'publish_photo0001',html:photo,artifact_sha256:await hash(photo)})).status,503);
  const scriptPhoto='<html><script>const vehicleAsset="/engine/assets/project_orig/abc.png";</script></html>';
  assert.equal((await signed(f,{...command,command_key:'publish_photo0002',html:scriptPhoto,artifact_sha256:await hash(scriptPhoto)})).status,503);
  assert.equal(f.connection.prepare('SELECT revision FROM fs_data_state').get().revision,1);
  assert.equal((await signed(f,{action:'restore',command_key:'rollback_future001',target_release_ref:'release_missing001',expected_release_ref:f.connection.prepare('SELECT current_release FROM fs_data_state').get().current_release})).status,409);
 }finally{f.connection.close();}
});
test('readback independently hashes served bytes and detects immutable artifact corruption',async()=>{
 const f=fixture();try{
  const html='<html>Version exacte</html>',sha=await hash(html),receipt=await f.publisher().publish({site:f.binding,command_key:'publish_integrity001',html,artifact_sha256:sha,expected_release_ref:f.baseline_release_ref});
  await assert.rejects(f.publisher().verify({site:f.binding,release:{...receipt,release_ref:'release_forged001'},expected_sha256:sha}),/SITES_READBACK_MISMATCH/);
  f.connection.prepare('UPDATE fs_data_artifacts SET html=? WHERE sha256=?').run('corrupted',sha);
  await assert.rejects(f.publisher().verify({site:f.binding,release:receipt,expected_sha256:sha}),/SITES_READBACK_REFUSED/);
 }finally{f.connection.close();}
});

test('scanned original-owner PNG transfers as immutable chunks to the same Site, is verified and appears in published HTML',async()=>{
 const f=fixture(),source=database();try{
  // Scanner/storage are the retained real Engine implementation, with SQLite
  // only as a local D1 test binding. No hosted proof is claimed by this test.
  await migrateImages(source.db);
  const pixels=new Uint8Array(300*300*4);let seed=19371;
  for(let i=0;i<pixels.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;pixels[i]=seed&255;}
  const png=encodePng({width:300,height:300,data:pixels}),sha=await sha256(png);
  assert.ok(png.length>256*1024,'exercises multiple immutable parts');
  const owner=f.binding.customer_ref.slice('customer_'.length),storage=privateImageStorage({db:source.db,project_ref:f.binding.project_ref,user_ref:owner});
  await storage.put('client-change-quarantine/'+f.binding.project_ref+'/file_real_photo001',png);
  assert.equal(await photographScanner(source.db).verifySafe({bytes:png,mime:'image/png',sha256:sha}),true);
  const locator='/engine/assets/'+f.binding.project_ref+'/'+sha+'.png';
  const html='<html><script>const vehicleAsset="'+locator+'";</script><img src="'+locator+'"></html>';
  const publisher=f.publisher(source.db),receipt=await publisher.publish({site:f.binding,command_key:'publish_real_photo001',html,artifact_sha256:await hash(html),expected_release_ref:f.baseline_release_ref});
  await publisher.verify({site:f.binding,release:receipt,expected_sha256:await hash(html)});
  const image=await f.worker.fetch(new Request(f.binding.origin+locator),f.env);
  assert.equal(image.headers.get('content-type'),'image/png');assert.equal(await sha256(new Uint8Array(await image.arrayBuffer())),sha);
  assert.equal(f.connection.prepare('SELECT count(*) n FROM fs_data_asset_parts').get().n,Math.ceil(png.length/(256*1024)));
  assert.equal(f.connection.prepare('SELECT state FROM fs_data_assets').get().state,'READY');
  assert.equal((await f.worker.fetch(new Request(f.binding.origin+locator.replace(f.binding.project_ref,'project_other_owner')),f.env)).status,404);
  const wrong=database();try{await migrateImages(wrong.db);await assert.rejects(f.publisher(wrong.db).publish({site:f.binding,command_key:'publish_unowned_photo001',html,artifact_sha256:await hash(html),expected_release_ref:receipt.release_ref}),/ENGINE_IMAGE_NOT_FOUND/);}finally{wrong.connection.close();}
  assert.equal(receipt.actual_cost_microeur,null);
 }finally{f.connection.close();source.connection.close();}
});
