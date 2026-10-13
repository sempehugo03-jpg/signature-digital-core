import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {sqliteD1} from './helpers.mjs';
import {productService} from '../../product/service.mjs';
import {digest} from '../../product/contract.mjs';
const dir=mkdtempSync(join(tmpdir(),'fabrya-work-test-'));
await build({entryPoints:[resolve('product/work-product-adapter.mjs'),resolve('product/work-mcp.mjs')],outdir:dir,bundle:true,format:'esm',platform:'node',plugins:[{name:'raw',setup(b){b.onResolve({filter:/\?raw$/},a=>({path:resolve(a.resolveDir,a.path.slice(0,-4)),namespace:'raw'}));b.onLoad({filter:/.*/,namespace:'raw'},a=>({contents:readFileSync(a.path,'utf8'),loader:'text'}));}}]});
const {workProductAdapter,workDeliveryVerifier,recordWorkClientPreview,reconcileProductWorkDelivery}=await import('file://'+join(dir,'work-product-adapter.js'));
const {initializeWork,workMcp}=await import('file://'+join(dir,'work-mcp.js'));
async function fixture(){const db=sqliteD1();db.connection.exec(readFileSync('product/drizzle/0004_private_delivery_gate.sql','utf8'));db.exec=async sql=>db.connection.exec(sql);await initializeWork(db);const adapter=workProductAdapter({db});const service=productService({db,kevin:adapter,qa:true,deliveryVerifier:workDeliveryVerifier(db)});return {db,service,adapter};}
async function company(f,u,name){const d=await f.service.create(u,{request_key:crypto.randomUUID()});const id=d.project.id;await f.service.save(u,id,{draft_revision:0,step:1,company_input:{name,activity:'Garage fictif',objective:'Préparer une visite'}});return id;}
async function rpc(f,owner,name,args,env={}){const r=await workMcp(new Request('https://qa.test/mcp',{method:'POST',headers:{'oai-authenticated-user-id':owner},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}),{...env,DB:f.db});return (await r.json()).result;}
test('existing queue binds two clients, duplicate requests and returned bytes to their original job only',async()=>{
 const f=await fixture();const originalFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({});try{
 await f.db.prepare('INSERT INTO fp_work_mcp_subscriptions VALUES(?,?,?,?,?)').bind('sub_qa','operator','https://chatgpt.com/test','whsec_'+btoa('a'.repeat(32)),Date.now()+600000).run();
 const a={id:'customer_a'},b={id:'customer_b'};const pa=await company(f,a,'Atelier A'),pb=await company(f,b,'Atelier B');
 const key=crypto.randomUUID();const ja=await f.service.requestDemo(a,pa,{request_key:key});await f.service.read(a,pa);
 assert.equal((await f.service.requestDemo(a,pa,{request_key:key})).job_id,ja.job_id);
 await f.service.requestDemo(b,pb,{request_key:crypto.randomUUID()});await f.service.read(b,pb);
 assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fp_work_product_links').get().n,2);
 await assert.rejects(f.service.read(b,pa),e=>e.code==='NOT_FOUND');
 const link=f.db.connection.prepare('SELECT * FROM fp_work_product_links WHERE job_id=?').get(ja.job_id);
 const claim=(await rpc(f,'operator','fabrya_work_request_claim',{request_id:link.request_id})).structuredContent;assert.ok(claim.lease);assert.equal(claim.delivery.user_id,a.id);
 assert.equal((await rpc(f,'intruder','fabrya_work_request_read',{request_id:link.request_id})).isError,true);
 assert.equal((await rpc(f,'operator','fabrya_work_request_claim',{request_id:link.request_id})).isError,true);
 const html='<!doctype html><html lang="fr"><title>LOCAL SYNTHETIC RECEIPT TEST ONLY</title><body>Atelier A</body></html>',hash=await digest(html),artifact='a'.repeat(64);
 const args={request_id:link.request_id,lease:claim.lease,demo_url:'https://local-test.chatgpt.site',site_project_id:'synthetic_local_site_id',version_id:'synthetic_local_version_id',artifact_sha256:artifact};
 const proof={desktop:{status:'PASS'},mobile:{status:'PASS'},client_access_verified:true,artifact_sha256:artifact,request_id:link.request_id,product_project_id:pa,product_user_id:b.id,artifact_html:html,client_artifact_sha256:hash};
 assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)})).isError,true);
 proof.product_user_id=a.id;proof.client_artifact_sha256='b'.repeat(64);assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)})).isError,true);
 proof.client_artifact_sha256=hash;
 proof.publisher_readback={verified:true};
 assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)},{FABRYA_PRODUCT_QA:'true'})).isError,true,'missing private verifier cannot accept a QA demo');
 assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)},{FABRYA_PRODUCT_QA:'true',FABRYA_WORK_PUBLISHER_VERIFY:async()=>{throw Error('READBACK_MISMATCH');}})).isError,true,'self-attested readback cannot replace actual verification');
 assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)},{FABRYA_PRODUCT_QA:'true',FABRYA_WORK_PUBLISHER_VERIFY:async()=>({verified:false})})).isError,true,'negative readback cannot complete the request');
 assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fp_work_mcp_artifacts').get().n,0);
 const result=await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)});assert.equal(result.structuredContent?.status,'completed');
 assert.equal(result.structuredContent.result.proof.publisher_readback,undefined);
 const done=await f.service.read(a,pa);assert.equal(done.job.status,'ready');assert.equal((await f.service.version(a,pa,link.version_id)).html,html);
 await assert.rejects(f.service.version(b,pa,link.version_id),e=>e.code==='NOT_FOUND');assert.notEqual((await f.service.read(b,pb)).job.status,'ready');
 await f.service.approve(a,pa,{version_id:link.version_id,artifact_hash:hash});assert.equal((await f.service.read(a,pa)).delivery.checkout_allowed,false,'Work assertion alone cannot prove client access');
 await recordWorkClientPreview(f.db,a,await f.service.version(a,pa,link.version_id));assert.equal((await f.service.read(a,pa)).delivery.checkout_allowed,true);
 assert.equal(f.db.connection.prepare('SELECT user_id FROM fp_work_site_bindings').get().user_id,a.id);
 assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)})).isError,true);
 }finally{globalThis.fetch=originalFetch;f.db.close();}
});
test('missing verified operator preserves the order, never falls back to mock generation',async()=>{const f=await fixture();try{const u={id:'customer_missing'};const p=await company(f,u,'Atelier conservé');await f.service.requestDemo(u,p,{request_key:crypto.randomUUID()});const r=await f.service.read(u,p);assert.equal(r.job.status,'failed');assert.equal(r.job.recoverable,true);assert.equal(r.versions[0].source,'work-mcp');assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fp_work_mcp_requests').get().n,0);}finally{f.db.close();}});
test('authenticated real-draft receipt transfers bytes without certifying mobile QA or opening Checkout',async()=>{
 const f=await fixture(),oldFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({});try{
  await f.db.prepare('INSERT INTO fp_work_mcp_subscriptions VALUES(?,?,?,?,?)').bind('sub_draft','operator','https://chatgpt.com/test','whsec_'+btoa('a'.repeat(32)),Date.now()+600000).run();
  const u={id:'customer_local_draft'},p=await company(f,u,'Cabinet local draft');await f.service.requestDemo(u,p,{request_key:crypto.randomUUID()});await f.service.read(u,p);
  const link=f.db.connection.prepare('SELECT * FROM fp_work_product_links WHERE project_id=?').get(p),claim=(await rpc(f,'operator','fabrya_work_request_claim',{request_id:link.request_id})).structuredContent;
  const html='<!doctype html><html><body>LOCAL DRAFT RECEIPT FIXTURE</body></html>',hash=await digest(html);
  const proof={delivery_mode:'preview_only',desktop:{status:'NOT_VERIFIED'},mobile:{status:'NOT_VERIFIED'},artifact_sha256:hash,request_id:link.request_id,product_project_id:p,product_user_id:u.id,artifact_html:html,client_artifact_sha256:hash};
  const args={request_id:link.request_id,lease:claim.lease,demo_url:'https://local-draft.chatgpt.site',site_project_id:'synthetic_draft_site',version_id:'synthetic_draft_version',artifact_sha256:hash,proof:JSON.stringify(proof)};
  assert.equal((await rpc(f,'operator','fabrya_work_request_complete',args)).isError,true,'draft delivery is QA-only');
  const done=await rpc(f,'operator','fabrya_work_request_complete',args,{FABRYA_PRODUCT_QA:'true',FABRYA_WORK_PRODUCT_RECONCILE:id=>reconcileProductWorkDelivery(f.db,id)});assert.equal(done.structuredContent.result.delivery_qualification,'preview_only');
  assert.equal(done.structuredContent.product_reconciliation.status,'ready');
  assert.equal(f.db.connection.prepare('SELECT state FROM fp_versions WHERE id=?').get(link.version_id).state,'ready','completion imports actual bytes before the next client poll');
  assert.equal((await f.service.read(u,p)).job.status,'ready');const v=await f.service.version(u,p,link.version_id);assert.equal(v.html,html);
  await f.service.approve(u,p,{version_id:link.version_id,artifact_hash:hash});await recordWorkClientPreview(f.db,u,v);
  assert.equal((await f.service.read(u,p)).delivery.checkout_allowed,false,'even a real owner preview cannot turn unverified mobile status into paid readiness');
  await assert.rejects(f.service.version({id:'customer_foreign_draft'},p,link.version_id),e=>e.code==='NOT_FOUND');
 }finally{globalThis.fetch=oldFetch;f.db.close();}
});
process.on('exit',()=>rmSync(dir,{recursive:true,force:true}));
