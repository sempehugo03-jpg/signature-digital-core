// LOCAL ONLY: fixture invoices and a real in-memory Sites data Worker.
// No hosted account, provider payment, browser or deployment is claimed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {sqliteD1} from './helpers.mjs';
import {ModifierStore} from '../../engine/postpurchase/durable-store.mjs';
import {qaSitesModifier,verifyWorkSitePublisher} from '../../private-release/qa-sites-modifier.mjs';
import {createSitesDataWorker} from '../../engine/postpurchase/sites-data-worker.mjs';
import {renderContent} from '../../engine/postpurchase/html-content.mjs';
import {sha256} from '../../engine/postpurchase/auth.mjs';

async function fixture(){
 const db=sqliteD1(),siteDb=sqliteD1(':memory:',false),project='prj_fresh_fixture_C',user='user_fresh_fixture_C',version='ver_fresh_fixture_C',site='appgprj_fresh_fixture_C',request='wrk_fresh_fixture_C';
 const authored={schema:'fabrya.work-baseline.v1',template:'<!doctype html><h1>Cabinet C</h1><time>{{FABRYA:hours.opening}}</time>',manifest:{schema:'fabrya.mutable-content.v1',fields:[{id:'hours.opening',pointer:'/hours',type:'time',aliases:['horaire ouverture']}]},content:{hours:'09:00'}};
 const html=renderContent(authored.template,authored.manifest,authored.content),hash=await sha256(new TextEncoder().encode(html));
 db.connection.exec(`CREATE TABLE fp_work_site_bindings(site_project_id TEXT PRIMARY KEY,project_id TEXT UNIQUE,user_id TEXT,request_id TEXT,version_id TEXT,client_artifact_sha256 TEXT,demo_url TEXT);
 CREATE TABLE fp_work_product_links(request_id TEXT PRIMARY KEY,project_id TEXT,user_id TEXT,version_id TEXT);
 CREATE TABLE fp_work_mcp_requests(id TEXT PRIMARY KEY,status TEXT,result TEXT);`);
 const run=(sql,...values)=>db.connection.prepare(sql).run(...values),stamp='2026-10-13T21:34:28Z';
 run('INSERT INTO fp_projects(id,user_id,request_key,created_at,updated_at) VALUES(?,?,?,?,?)',project,user,'local_fixture',stamp,stamp);
 run("INSERT INTO fp_jobs(id,project_id,version_id,request_key,status,adapter_handle,input_snapshot,created_at,updated_at) VALUES('job_fixture_C',?,?,?,'ready','{}','{}',?,?)",project,version,'fixture_job',stamp,stamp);
 run("INSERT INTO fp_versions(id,project_id,number,job_id,source,state,html,artifact_hash,created_at,updated_at) VALUES(?,?,1,'job_fixture_C','work-mcp','ready',?,?,?,?)",version,project,html,hash,stamp,stamp);
 run("INSERT INTO fp_approvals(id,project_id,version_id,artifact_hash,user_id,created_at) VALUES('approval_fixture_C',?,?,?,?,?)",project,version,hash,user,stamp);
 run("INSERT INTO fp_activations VALUES(?,?, 'approval_fixture_C','cs_test_fixture_C',?,?)",project,version,hash,stamp);
 run("INSERT INTO fp_subscriptions(project_id,stripe_subscription_id,stripe_customer_id,state,price_id,amount,currency,created_at,updated_at) VALUES(?,'sub_fixture_C','cus_fixture_C','active','price_fixture_C',5900,'eur',?,?)",project,stamp,stamp);
 run('INSERT INTO fp_work_site_bindings VALUES(?,?,?,?,?,?,?)',site,project,user,request,version,hash,'https://fresh-C.chatgpt.site');
 run('INSERT INTO fp_work_product_links VALUES(?,?,?,?)',request,project,user,version);
 run("INSERT INTO fp_work_mcp_requests VALUES(?,'completed',?)",request,JSON.stringify({proof:{site_change_baseline:authored}}));
 await new ModifierStore(db).migrate();
 const directory=new URL('../../engine/postpurchase/sites-data-drizzle/',import.meta.url);
 for(const name of readdirSync(directory).filter(x=>x.endsWith('.sql')))siteDb.connection.exec(readFileSync(new URL(name,directory),'utf8'));
 const binding={customer_ref:'customer_'+user,project_ref:project,site_project_id:site,site_ref:site,origin:'https://fresh-c.chatgpt.site'};
 const secret='local_fixture_only_secret_'.repeat(3),worker=createSitesDataWorker({binding,baseline:html,baseline_release_ref:'work_release_'+version});
 const env={FABRYA_PRODUCT_QA:'true',FABRYA_STRIPE_MODE:'test',FABRYA_QA_CREDIT_POLICY:'measured-bytes-v1',['FABRYA_ENGINE_SITE_'+site+'_WRITE_SECRET']:secret,['FABRYA_ENGINE_SITE_'+site+'_READ']:'local-fixture-service-token'};
 const options={db,principal:{customer_ref:binding.customer_ref,project_ref:project}};
 let calls=0;const fetchImpl=async(url,init)=>{calls++;assert.equal(new Headers(init.headers).get('OAI-Sites-Authorization'),'Bearer local-fixture-service-token');return worker.fetch(new Request(url,init),{DB:siteDb,FABRYA_SITE_WRITER_SECRET:secret});};
 return {db,siteDb,project,user,site,version,hash,authored,env,options,fetchImpl,calls:()=>calls,close(){db.close();siteDb.close();}};
}
test('a fresh third client provisions through its verified Work binding and existing publisher; restart is idempotent',async()=>{
 const f=await fixture(),oldFetch=globalThis.fetch;globalThis.fetch=f.fetchImpl;
 try{
  const modifier=await qaSitesModifier(f.options,f.env);assert.equal(modifier.publication_available,true);assert.equal(modifier.publisher_transport_verified,true);
  const current=await modifier.getCurrentRelease({project_id:f.project,user_ref:f.user});assert.equal(current.sha256,f.hash);assert.equal(current.site_ref,f.site);
  const again=await qaSitesModifier(f.options,f.env);assert.equal((await again.getCurrentRelease()).release_ref,current.release_ref);
  assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fm_sites').get().n,1);
  assert.equal(f.siteDb.connection.prepare('SELECT count(*) n FROM fs_data_commands').get().n,0,'commissioning does not publish');
  await assert.rejects(again.getCurrentRelease({user_ref:'user_foreign_fixture'}),/NOT_FOUND/);
 }finally{globalThis.fetch=oldFetch;f.close();}
});
test('Work commissioning verifies served bytes before payment; no Engine baseline or publish command is fabricated',async()=>{
 const f=await fixture(),oldFetch=globalThis.fetch;globalThis.fetch=f.fetchImpl;
 try{
  f.db.connection.prepare("DELETE FROM fp_activations").run();f.db.connection.prepare("DELETE FROM fp_subscriptions").run();
  const html=renderContent(f.authored.template,f.authored.manifest,f.authored.content);
  const input={site:f.site,project:f.project,user:f.user,version:f.version,hash:f.hash,demo_url:'https://fresh-c.chatgpt.site/',html,authored:f.authored};
  const result=await verifyWorkSitePublisher(input,f.env);assert.equal(result.verified,true);assert.equal(result.sha256,f.hash);
  assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fm_sites').get().n,0);
  assert.equal(f.siteDb.connection.prepare('SELECT count(*) n FROM fs_data_commands').get().n,0);
  await assert.rejects(verifyWorkSitePublisher({...input,hash:'a'.repeat(64)},f.env),/HASH/);
  await assert.rejects(verifyWorkSitePublisher({...input,authored:null},f.env),/REQUIRED/);
  await assert.rejects(verifyWorkSitePublisher(input,{...f.env,FABRYA_STRIPE_MODE:'live'}),/QA_ONLY/);
 }finally{globalThis.fetch=oldFetch;f.close();}
});
test('foreign owner, unpaid subscription, missing credential and mismatched activation cannot provision',async()=>{
 for(const reason of ['foreign','unpaid','credential','activation']){
  const f=await fixture(),oldFetch=globalThis.fetch;globalThis.fetch=f.fetchImpl;
  try{
   if(reason==='foreign')f.options.principal.customer_ref='customer_foreign_fixture';
   if(reason==='unpaid')f.db.connection.prepare("UPDATE fp_subscriptions SET state='past_due'").run();
   if(reason==='credential')delete f.env['FABRYA_ENGINE_SITE_'+f.site+'_WRITE_SECRET'];
   if(reason==='activation')f.db.connection.prepare('UPDATE fp_activations SET artifact_hash=?').run('a'.repeat(64));
   const modifier=await qaSitesModifier(f.options,f.env);assert.equal(modifier.publication_available,false);
   assert.equal(f.calls(),0);assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fm_sites').get().n,0);
  }finally{globalThis.fetch=oldFetch;f.close();}
 }
});
