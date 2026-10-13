import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {creditService,CreditError} from '../../product/change-credits.mjs';
import {createReferenceEngine,hash} from './reference-static-modifier.mjs';
import {
 SITE_CHANGE_PROTOCOL,validateChangeEnvelope,validatePreviewReceipt,validatePublicationReceipt,
 validateRollbackReceipt,validateModifierAdapter,ContractError
} from '../../contracts/site-changes/v1/protocol.mjs';
const schema=await readFile(new URL('../../product/change-credits-schema.sql',import.meta.url),'utf8');
const msg='Remplacer le titre par Atelier du Pic — ébénisterie sur mesure.';
const request_key='request_customer_123456789';
const billingStart=Date.parse('2026-10-13T00:00:00.000Z')/1000;
const billingEnd=Date.parse('2026-11-13T00:00:00.000Z')/1000;
function wrapSqlite(connection){
 const make=(sql,params=[])=>({bind(...v){return make(sql,v)},async first(){return connection.prepare(sql).get(...params)||null},
 async all(){return {results:connection.prepare(sql).all(...params)}},async run(){let s=connection.prepare(sql).run(...params);return {meta:{changes:Number(s.changes)}}}});
 return {prepare:make,async batch(stmts){connection.exec('BEGIN IMMEDIATE');try{const out=[];for(const s of stmts)out.push(await s.run());connection.exec('COMMIT');return out}catch(e){connection.exec('ROLLBACK');throw e}}};
}
async function fixture({engine=true,uploads=false}={}){
 const connection=new DatabaseSync(':memory:');connection.exec('PRAGMA foreign_keys=ON');
 connection.exec(`CREATE TABLE fp_projects(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,active_version_id TEXT,status TEXT);
  CREATE TABLE fp_subscriptions(project_id TEXT PRIMARY KEY,stripe_subscription_id TEXT,state TEXT,price_id TEXT,amount INTEGER,currency TEXT);
  CREATE TABLE fp_activations(project_id TEXT PRIMARY KEY,version_id TEXT);`);
 connection.exec(schema);connection.exec(await readFile(new URL('../../product/change-restore-schema.sql',import.meta.url),'utf8'));
 const user={id:'user_fictional01'},projectId='project_fiction01';
 connection.prepare('INSERT INTO fp_projects VALUES(?,?,?,?)').run(projectId,user.id,'demo_base','active');
 connection.prepare('INSERT INTO fp_subscriptions VALUES(?,?,?,?,?,?)').run(projectId,'sub_sample01','active','price_sample01',5900,'eur');
 connection.prepare('INSERT INTO fp_activations VALUES(?,?)').run(projectId,'demo_base');
 const invoice={id:'in_example0001',paid:true,status:'paid',currency:'eur',livemode:false,amount_paid:5900,subscription:'sub_sample01',lines:{data:[{price:{id:'price_sample01'},period:{start:billingStart,end:billingEnd}}]}};
 const billing={livemode:false,getInvoice:async()=>structuredClone(invoice),getSubscription:async()=>({id:'sub_sample01',status:'active',livemode:false}),validSubscription:x=>x?.id==='sub_sample01'};
 let t=Date.parse('2026-10-13T12:00:00Z');
 const ref=engine?await createReferenceEngine():null;
 const objects=new Map();
 const storage=uploads?{put:async(k,v)=>{objects.set(k,Uint8Array.from(v))},get:async k=>objects.has(k)?{arrayBuffer:async()=>Uint8Array.from(objects.get(k)).buffer}:null,delete:async k=>objects.delete(k)}:null;
 const scanner=uploads?{verifySafe:async({bytes,mime})=>mime==='application/pdf'&&new TextDecoder().decode(bytes.slice(0,5))==='%PDF-'}:null;
 const service=creditService({db:wrapSqlite(connection),billing,modifier:ref?.adapter||null,enabled:true,creditUnitMicroeur:50000,storage,scanner,clock:()=>t});
 return {connection,service,user,projectId,ref,invoice,objects,setNow:v=>{t=v},async close(){connection.close();await ref?.close()}};
}
const invalid=(call,code)=>assert.rejects(call,err=>err instanceof CreditError&&err.code===code);
const balance=async f=>f.service.overview(f.user,f.projectId);

test('common v1 schema rejects inconsistent payloads and untrusted attachment URLs',()=>{
 const valid={protocol:SITE_CHANGE_PROTOCOL,customer_ref:'customer_abcdef01',project_ref:'project_abcdef01',site_ref:'site_abcdef01',change_ref:'change_abcdef01',base_version_ref:'version_abcdef01',base_release_ref:'release_abcdef01',base_sha256:'a'.repeat(64),idempotency_key:'intent_abcdef01',message:'Corriger le titre',attachments:[],requested_at:'2026-10-13T12:00:00Z'};
 assert.equal(validateChangeEnvelope(valid).site_ref,valid.site_ref);
 assert.throws(()=>validateChangeEnvelope({...valid,protocol:'v0'}),e=>e instanceof ContractError);
 assert.throws(()=>validateChangeEnvelope({...valid,attachments:[{file_ref:'file_abcdef01',sha256:'b'.repeat(64),mime:'image/png',byte_size:120,url:'https://example.com/private'}]}),/CHANGE_ATTACHMENT_FIELDS/);
 assert.throws(()=>validateChangeEnvelope({...valid,message:'<invalid>'.repeat(500)}),/CHANGE_MESSAGE_INVALID/);
});

test('shared contract reference: real HTML edit -> private preview -> explicit approval -> real HTTP publication -> exactly one credit debit -> verified rollback',async()=>{
 const f=await fixture();try{
  validateModifierAdapter(f.ref.adapter);
  const before=await fetch(f.ref.origin+'/index.html').then(r=>r.text());
  assert.match(before,/Bienvenue dans notre atelier/);
  assert.doesNotMatch(before,/ébénisterie sur mesure/);
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  assert.equal(f.connection.prepare('SELECT count(*) n FROM fp_credit_wallets').get().n,1);
  const first=await f.service.request(f.user,f.projectId,{request_key,message:msg});
  assert.equal(first.status,'reserved');assert.equal(first.held,30);
  assert.equal((await balance(f)).monthly_available,70);
  assert.equal((await balance(f)).reserved,30);
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,0);
  await invalid(f.service.request({...f.user,id:'intruder_01'},f.projectId,{request_key:'another_req_01',message:msg}),'CREDIT_NOT_FOUND');
  const duplicate=await f.service.request(f.user,f.projectId,{request_key,message:msg});assert.equal(duplicate.duplicate,true);
  const dispatched=await f.service.dispatchPending({requestId:first.id});assert.equal(dispatched.status,'processing');
  const seen=await f.ref.adapter.getTask({change_ref:first.id});assert.equal(seen.state,'PREVIEW_READY');
  assert.equal((await f.service.dispatchPending({requestId:first.id})).duplicate,true);
  const preview=await f.ref.adapter.validatePreview({request_id:first.id,site_ref:f.ref.site_ref});
  assert.equal(preview.published,false);
  const previewBefore=await fetch(f.ref.origin+preview.preview_locator,{headers:{'x-reference-owner':'fixture-owner'}}).then(r=>r.text());
  assert.match(previewBefore,/ébénisterie sur mesure/);
  assert.equal(hash(previewBefore),preview.artifact_sha256);
  assert.equal(await fetch(f.ref.origin+preview.preview_locator).then(r=>r.status),401);
  assert.equal(await fetch(f.ref.origin+'/index.html').then(r=>r.text()),before,'previews MUST NOT be public deployments');
  const previewPersist=await f.service.settleVerifiedPreview({requestId:first.id,receipt:preview});
  assert.equal(previewPersist.charged,0);
  assert.equal((await balance(f)).monthly_available,70);
  assert.equal((await balance(f)).reserved,30);
  const approve=await f.service.acknowledgeApproval(f.user,f.projectId,first.id,preview.version_ref);
  assert.equal(approve.status,'approved');assert.equal(approve.charged,0);
  assert.equal((await f.service.acknowledgeApproval(f.user,f.projectId,first.id,preview.version_ref)).duplicate,true);
  assert.equal(await fetch(f.ref.origin+'/index.html').then(r=>r.text()),before,'approval alone MUST NOT publish');
  const pub=await f.service.publishApproved({requestId:first.id});
  assert.equal(pub.status,'published');assert.equal(pub.charged,30);
  const published=await fetch(f.ref.origin+'/index.html').then(r=>r.text());
  assert.match(published,/ébénisterie sur mesure/);
  assert.notEqual(published,before);assert.equal(hash(published),preview.artifact_sha256);
  const funds=await balance(f);assert.equal(funds.monthly_available,70);assert.equal(funds.reserved,0);
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,30);
  const pubAgain=await f.service.publishApproved({requestId:first.id});assert.equal(pubAgain.duplicate,true);
  assert.equal(pubAgain.charged,30);
  assert.equal(f.connection.prepare('SELECT count(*) n FROM fp_credit_holds WHERE state=\'settled\'').get().n,1);
  const consent=await f.service.acknowledgeRestore(f.user,f.projectId,first.id,{target_release_ref:f.connection.prepare('SELECT base_release_ref FROM fp_change_requests WHERE id=?').get(first.id).base_release_ref,request_key:'rollback_'+first.id});
  assert.ok(f.connection.prepare('SELECT * FROM fp_change_restore_consents WHERE request_id=?').get(first.id));
  await invalid(f.service.rollbackPublished({requestId:first.id,customerApprovalRef:'restore_forged_123'}),'CREDIT_ROLLBACK_REQUEST_INVALID');
  assert.equal((await f.service.request(f.user,f.projectId,{request_key,message:msg})).duplicate,true);
  const roll=await f.service.rollbackPublished({requestId:first.id,customerApprovalRef:consent.approval_ref});
  assert.equal(roll.status,'rolled_back');
  assert.equal(await fetch(f.ref.origin+'/index.html').then(r=>r.text()),before,'actual published bytes restored');
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,30,'delivered work remains charged; refund requires separate audited compensation');
  assert.equal((await f.service.rollbackPublished({requestId:first.id,customerApprovalRef:consent.approval_ref})).duplicate,true);
  assert.equal(f.connection.prepare('SELECT count(*) n FROM fp_change_requests').get().n,1);
 } finally {await f.close()}
});

test('rejected actual preview releases hold, without touching actual published site',async()=>{
 const f=await fixture();try{
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  const old=await fetch(f.ref.origin+'/index.html').then(r=>r.text());
  const req=await f.service.request(f.user,f.projectId,{request_key:'request_reject001',message:msg});
  await f.service.dispatchPending({requestId:req.id});
  const receipt=await f.ref.adapter.validatePreview({request_id:req.id,site_ref:f.ref.site_ref});
  await f.service.settleVerifiedPreview({requestId:req.id,receipt});
  const reject=await f.service.rejectPreview(f.user,f.projectId,req.id);
  assert.equal(reject.credits_released,30);assert.equal(reject.charged,0);
  assert.equal((await balance(f)).monthly_available,100);
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,0);
  assert.equal(await fetch(f.ref.origin+'/index.html').then(r=>r.text()),old);
  await invalid(f.service.publishApproved({requestId:req.id}),'CREDIT_NOT_APPROVED');
 }finally{await f.close()}
});

test('unknown engine response must never submit twice or settle credits',async()=>{
 const f=await fixture();try{
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  const req=await f.service.request(f.user,f.projectId,{request_key:'request_unknown01',message:msg});
  f.ref.adapter.findTask=async()=>undefined;
  await invalid(f.service.dispatchPending({requestId:req.id}),'CREDIT_DISPATCH_AMBIGUOUS');
  const s=await balance(f);assert.equal(s.reserved,30);
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,0);
  assert.equal((await f.ref.adapter.getCurrentRelease()).change_ref,null);
 }finally{await f.close()}
});

test('Engine absent: Product records request, no fake preview, no invented credits or publication',async()=>{
 const f=await fixture({engine:false});try{
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  const req=await f.service.request(f.user,f.projectId,{request_key:'request_noengine01',message:msg});
  assert.equal(req.status,'awaiting_engine');assert.equal(req.held,0);
  assert.equal((await balance(f)).monthly_available,100);
  await invalid(f.service.dispatchPending({requestId:req.id}),'CREDIT_ENGINE_UNAVAILABLE');
 }finally{await f.close()}
});

test('concurrent publish commands never double-settle the Product wallet',async()=>{
 const f=await fixture();try{
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  const req=await f.service.request(f.user,f.projectId,{request_key:'request_race1111',message:msg});
  await f.service.dispatchPending({requestId:req.id});
  await f.service.settleVerifiedPreview({requestId:req.id,receipt:await f.ref.adapter.validatePreview({request_id:req.id,site_ref:f.ref.site_ref})});
  const candidate=f.connection.prepare('SELECT candidate_version_id FROM fp_change_requests WHERE id=?').get(req.id).candidate_version_id;
  await f.service.acknowledgeApproval(f.user,f.projectId,req.id,candidate);
  const results=await Promise.allSettled([f.service.publishApproved({requestId:req.id}),f.service.publishApproved({requestId:req.id})]);
  assert.ok(results.some(x=>x.status==='fulfilled'));
  const state=f.connection.prepare('SELECT * FROM fp_change_requests WHERE id=?').get(req.id);
  assert.equal(state.status,'published');assert.equal(state.credits_charged,30);
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,30);
  assert.equal(f.connection.prepare("SELECT COUNT(*) n FROM fp_credit_holds WHERE state='settled'").get().n,1);
  assert.equal((await f.service.publishApproved({requestId:req.id})).duplicate,true);
 }finally{await f.close()}
});

test('unpaid or unlinked invoice never creates the 100-credit monthly wallet',async()=>{
 const f=await fixture({engine:false});try{
  const orig=f.invoice.paid;f.invoice.paid=false;
  await invalid(f.service.grantPaidMonth(f.projectId,f.invoice.id),'CREDIT_INVOICE_INVALID');
  f.invoice.paid=orig;f.invoice.subscription='sub_wrong001';
  await invalid(f.service.grantPaidMonth(f.projectId,f.invoice.id),'CREDIT_INVOICE_INVALID');
  assert.equal(f.connection.prepare('SELECT count(*) n FROM fp_credit_wallets').get().n,0);
 }finally{await f.close()}
});

test('real measured Engine cost below reserved maximum returns unused credits on verified publication',async()=>{
 const f=await fixture();try{
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  const original=f.ref.adapter.validateRelease.bind(f.ref.adapter);
  f.ref.adapter.validateRelease=async x=>({...await original(x),actual_cost_microeur:1000000});
  const req=await f.service.request(f.user,f.projectId,{request_key:'request_actualcost01',message:msg});
  assert.equal(req.held,30);
  await f.service.dispatchPending({requestId:req.id});
  const receipt=await f.ref.adapter.validatePreview({request_id:req.id,site_ref:f.ref.site_ref});
  await f.service.settleVerifiedPreview({requestId:req.id,receipt});
  await f.service.acknowledgeApproval(f.user,f.projectId,req.id,receipt.version_ref);
  const committed=await f.service.publishApproved({requestId:req.id});
  assert.equal(committed.charged,20);
  assert.equal((await balance(f)).monthly_available,80);
  assert.equal((await balance(f)).reserved,0);
  assert.equal(f.connection.prepare('SELECT SUM(spent) n FROM fp_credit_wallets').get().n,20);
 }finally{await f.close()}
});

test('file attachment path validates ownership, type, quarantine and private scanner before dispatch',async()=>{
 const f=await fixture({engine:false,uploads:true});try{
  await f.service.grantPaidMonth(f.projectId,f.invoice.id);
  const pdf=new TextEncoder().encode('%PDF-1.7\nFictional quote data');
  const file=await f.service.storeUpload(f.user,f.projectId,{bytes:pdf,mime:'application/pdf',filename:'devis.pdf'});
  assert.equal(file.status,'clean');assert.equal(f.objects.size,1);
  const sent=await f.service.request(f.user,f.projectId,{request_key:'request_attachment001',message:'Ajouter la pièce jointe',attachments:[file.id]});
  assert.equal(sent.status,'awaiting_engine');assert.equal((await balance(f)).monthly_available,100);
  await invalid(f.service.storeUpload(f.user,f.projectId,{bytes:new TextEncoder().encode('NOT_A_PDF'+'.'.repeat(25)),mime:'application/pdf'}),'CREDIT_UPLOAD_TYPE');
  assert.equal(f.objects.size,1);
 }finally{await f.close()}
});

test('recharges require an independently verified Stripe single-payment transport and price',async()=>{
 const f=await fixture({engine:false});try{
  await invalid(f.service.grantVerifiedTopup({projectId:f.projectId,intentId:'topup_unverified01'}),'CREDIT_TOPUP_UNAVAILABLE');
  assert.equal(f.connection.prepare('SELECT count(*) n FROM fp_credit_wallets').get().n,0);
 }finally{await f.close()}
});