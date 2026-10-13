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
const {workProductAdapter,workDeliveryVerifier}=await import('file://'+join(dir,'work-product-adapter.js'));
const {initializeWork,workMcp}=await import('file://'+join(dir,'work-mcp.js'));
async function fixture(){const db=sqliteD1();db.connection.exec(readFileSync('product/drizzle/0004_private_delivery_gate.sql','utf8'));db.exec=async sql=>db.connection.exec(sql);await initializeWork(db);const adapter=workProductAdapter({db});const service=productService({db,kevin:adapter,qa:true,deliveryVerifier:workDeliveryVerifier(db)});return {db,service,adapter};}
async function company(f,u,name){const d=await f.service.create(u,{request_key:crypto.randomUUID()});const id=d.project.id;await f.service.save(u,id,{draft_revision:0,step:1,company_input:{name,activity:'Garage fictif',objective:'Préparer une visite'}});return id;}
async function rpc(f,owner,name,args){const r=await workMcp(new Request('https://qa.test/mcp',{method:'POST',headers:{'oai-authenticated-user-id':owner},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}),{DB:f.db});return (await r.json()).result;}
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
 proof.client_artifact_sha256=hash;const result=await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)});assert.equal(result.structuredContent?.status,'completed');
 const done=await f.service.read(a,pa);assert.equal(done.job.status,'ready');assert.equal((await f.service.version(a,pa,link.version_id)).html,html);
 await assert.rejects(f.service.version(b,pa,link.version_id),e=>e.code==='NOT_FOUND');assert.notEqual((await f.service.read(b,pb)).job.status,'ready');
 await f.service.approve(a,pa,{version_id:link.version_id,artifact_hash:hash});assert.equal((await f.service.read(a,pa)).delivery.checkout_allowed,true);
 assert.equal((await rpc(f,'operator','fabrya_work_request_complete',{...args,proof:JSON.stringify(proof)})).isError,true);
 }finally{globalThis.fetch=originalFetch;f.db.close();}
});
test('missing verified operator preserves the order, never falls back to mock generation',async()=>{const f=await fixture();try{const u={id:'customer_missing'};const p=await company(f,u,'Atelier conservé');await f.service.requestDemo(u,p,{request_key:crypto.randomUUID()});const r=await f.service.read(u,p);assert.equal(r.job.status,'failed');assert.equal(r.job.recoverable,true);assert.equal(r.versions[0].source,'work-mcp');assert.equal(f.db.connection.prepare('SELECT count(*) n FROM fp_work_mcp_requests').get().n,0);}finally{f.db.close();}});
process.on('exit',()=>rmSync(dir,{recursive:true,force:true}));
