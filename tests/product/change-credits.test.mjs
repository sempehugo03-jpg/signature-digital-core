import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { creditService, CreditError } from '../../product/change-credits.mjs';
const schema = readFileSync(new URL('../../product/change-credits-schema.sql', import.meta.url),'utf8');
function fixture({engine=false,uploads=false}={}) {
  const connection=new DatabaseSync(':memory:');
  connection.exec('PRAGMA foreign_keys=ON');
  connection.exec(`CREATE TABLE fp_projects(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,active_version_id TEXT,status TEXT);
    CREATE TABLE fp_subscriptions(project_id TEXT PRIMARY KEY,stripe_subscription_id TEXT,state TEXT,price_id TEXT,amount INTEGER,currency TEXT);
    CREATE TABLE fp_activations(project_id TEXT PRIMARY KEY,version_id TEXT);
    CREATE TABLE fp_versions(id TEXT PRIMARY KEY,project_id TEXT,state TEXT,artifact_hash TEXT);`);
  connection.exec(schema);
  connection.prepare('INSERT INTO fp_projects VALUES(?,?,?,?)').run('project1','user1','v1','active');
  connection.prepare('INSERT INTO fp_subscriptions VALUES(?,?,?,?,?,?)').run('project1','sub_test1','active','price_test1',5900,'eur');
  connection.prepare('INSERT INTO fp_activations VALUES(?,?)').run('project1','v1');
  connection.prepare('INSERT INTO fp_versions VALUES(?,?,?,?)').run('v1','project1','ready','hashbase');
  let time=Date.parse('2026-10-13T12:00:00Z');
  const make=(sql,params=[])=>({bind(...v){return make(sql,v)},async first(){return connection.prepare(sql).get(...params)||null},async all(){return{results:connection.prepare(sql).all(...params)}},async run(){const r=connection.prepare(sql).run(...params);return{meta:{changes:Number(r.changes)}}}});
  const db={prepare:make,async batch(items){connection.exec('BEGIN IMMEDIATE');try{let results=[];for(const i of items)results.push(await i.run());connection.exec('COMMIT');return results;}catch(e){connection.exec('ROLLBACK');throw e;}}};
  const invoice={id:'in_test1',paid:true,status:'paid',currency:'eur',livemode:false,amount_paid:5900,subscription:'sub_test1',lines:{data:[{price:{id:'price_test1'},period:{start:1791763200,end:1794441600}}]}};
  const billing={livemode:false,getInvoice:async()=>structuredClone(invoice),getSubscription:async()=>({id:'sub_test1',status:'active'}),validSubscription:sub=>sub?.id==='sub_test1',getSession:null,verifyTopupPrice:null};
  const modifier=engine?{kind:'authenticated-site-modifier',quote:async()=>({credits:30,cost_provenance:'metered-risk-cap'}),findTask:async()=>null,validateReceipt:async({receipt})=>receipt}:null;
  const stored=new Map();
  const storage=uploads?{put:async(key,value)=>{stored.set(key,value)},get:async(key)=>({arrayBuffer:async()=>stored.get(key).buffer}),delete:async(key)=>{stored.delete(key)}}:null;
  const scanner=uploads?{verifySafe:async({bytes,mime})=>bytes[0]===37&&mime==='application/pdf'}:null;
  const service=creditService({db,clock:()=>time,billing,modifier,storage,scanner,enabled:true});
  return {connection,db,service,billing,invoice,modifier,storage,scanner,user:{id:'user1'},id:'project1',advance:ms=>{time+=ms},close:()=>connection.close()};
}
const request_key='intent_unique_123456789';
const input={request_key,message:'Rendez le texte du premier écran plus lisible.'};
const wallet=(f)=>f.connection.prepare('SELECT * FROM fp_credit_wallets ORDER BY id').all();
const failed=(promise,code)=>assert.rejects(promise,e=>e instanceof CreditError&&e.code===code);

test('paid invoice grants exactly 100 once, with real period boundaries and no calendar reset',async()=>{
 const f=fixture();
 try{
   const a=await f.service.grantPaidMonth(f.id,f.invoice.id);
   assert.equal(a.credits,100);
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   assert.equal(wallet(f).length,1);
   assert.equal((await f.service.overview(f.user,f.id)).monthly_available,100);
   f.advance(35*86400_000);
   assert.equal((await f.service.overview(f.user,f.id)).monthly_available,0);
 } finally{f.close();}
});
test('unpaid, wrong-mode, missing period or mismatched invoice never mint credits',async()=>{
 const f=fixture();try{
   f.invoice.paid=false;await failed(f.service.grantPaidMonth(f.id,f.invoice.id),'CREDIT_INVOICE_INVALID');
   f.invoice.paid=true;f.invoice.lines.data[0].period=null;
   await failed(f.service.grantPaidMonth(f.id,f.invoice.id),'CREDIT_PERIOD_UNVERIFIED');
   f.invoice.lines.data[0].period={start:1791763200,end:1794441600};f.invoice.subscription='sub_else';
   await failed(f.service.grantPaidMonth(f.id,f.invoice.id),'CREDIT_INVOICE_INVALID');
   assert.equal(wallet(f).length,0);
 }finally{f.close();}
});
test('no engine: preserves request without inventing delivery or charging',async()=>{
 const f=fixture();try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   const a=await f.service.request(f.user,f.id,input);
   assert.equal(a.status,'awaiting_engine');assert.equal(a.held,0);
   assert.equal((await f.service.request(f.user,f.id,input)).duplicate,true);
   assert.equal((await f.service.overview(f.user,f.id)).monthly_available,100);
   await failed(f.service.request(f.user,f.id,{...input,message:'autre chose'}),'CREDIT_IDEMPOTENCE_CONFLICT');
   assert.equal((await f.service.markFailed({requestId:a.id})).credits_released,0);
   assert.equal((await f.service.overview(f.user,f.id)).monthly_available,100);
 }finally{f.close();}
});
test('engine quote reserves credits, duplicate submission does not double hold, failed task releases reserve',async()=>{
 const f=fixture({engine:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   const a=await f.service.request(f.user,f.id,input);
   assert.equal(a.held,30);
   assert.equal((await f.service.overview(f.user,f.id)).monthly_available,70);
   const b=await f.service.request(f.user,f.id,input);
   assert.equal(b.id,a.id);assert.equal(b.duplicate,true);
   assert.equal(wallet(f)[0].held,30);
   const c=await f.service.markFailed({requestId:a.id});assert.equal(c.credits_released,30);
   assert.equal(wallet(f)[0].held,0);assert.equal(wallet(f)[0].spent,0);
   await f.service.markFailed({requestId:a.id});assert.equal(wallet(f)[0].spent,0);
 }finally{f.close();}
});
test('settle only matching verified version; no double charge; return estimate difference',async()=>{
 const f=fixture({engine:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   const a=await f.service.request(f.user,f.id,input);
   await failed(f.service.settleVerifiedPreview({requestId:a.id,receipt:{version_id:'fake',artifact_hash:'hash',verified:true,credits:21}}),'CREDIT_PREVIEW_UNVERIFIED');
   f.connection.prepare('INSERT INTO fp_versions VALUES(?,?,?,?)').run('v2','project1','ready','hashv2');
   const receipt={version_id:'v2',artifact_hash:'hashv2',verified:true,credits:21};
   const result=await f.service.settleVerifiedPreview({requestId:a.id,receipt});assert.equal(result.charged,21);
   assert.equal(wallet(f)[0].held,0);assert.equal(wallet(f)[0].spent,21);
   assert.equal((await f.service.overview(f.user,f.id)).monthly_available,79);
   assert.equal((await f.service.settleVerifiedPreview({requestId:a.id,receipt})).duplicate,true);
   assert.equal(wallet(f)[0].spent,21);
   await failed(f.service.markFailed({requestId:a.id}),'CREDIT_ALREADY_DELIVERED');
 }finally{f.close();}
});
test('failed credit transfers cannot overdraw or alter another customer ledger',async()=>{
 const f=fixture({engine:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   await failed(f.service.request({id:'intruder'},f.id,input),'CREDIT_NOT_FOUND');
   const a=await f.service.request(f.user,f.id,input);
   await assert.rejects(f.db.prepare(`INSERT INTO fp_credit_holds(id,request_id,wallet_id,amount,created_at,updated_at) VALUES(?,?,?,?,?,?)`).bind('evil',a.id,wallet(f)[0].id,100,'2026-10-13T12:00:00Z','2026-10-13T12:00:00Z').run(),/CREDIT_WALLET_EMPTY_OR_MISMATCH/);
   assert.equal(wallet(f)[0].held,30);
 }finally{f.close();}
});
test('one in-flight change per project and no customer recharge without configured payment validation',async()=>{
 const f=fixture({engine:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   await f.service.request(f.user,f.id,input);
   await failed(f.service.request(f.user,f.id,{request_key:'new_intent_abcdefghi',message:'Changer le menu'}),'CREDIT_CHANGE_PENDING');
   await failed(f.service.grantVerifiedTopup({projectId:f.id,intentId:'topup_fake123'}),'CREDIT_TOPUP_UNAVAILABLE');
 }finally{f.close();}
});

test('private PDF upload requires verified subscription, magic bytes, R2 and scanner',async()=>{
 const f=fixture({uploads:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   const pdf=new TextEncoder().encode('%PDF-1.7\nexample-fixture');
   const saved=await f.service.storeUpload(f.user,f.id,{bytes:pdf,mime:'application/pdf',filename:'brief.pdf'});
   assert.equal(saved.status,'clean');assert.ok(saved.id.startsWith('file_'));
   assert.equal(f.connection.prepare('SELECT scan_state FROM fp_change_attachments WHERE id=?').get(saved.id).scan_state,'clean');
   const change=await f.service.request(f.user,f.id,{request_key:'file_key_1234567',message:'Ajuster',attachments:[saved.id]});
   assert.equal(change.status,'awaiting_engine');
   await failed(f.service.request(f.user,f.id,{request_key:'another_key_1234567',message:'Autre',attachments:[saved.id]}),'CREDIT_ATTACHMENT_OWNER');
   await failed(f.service.storeUpload({id:'intruder'},f.id,{bytes:pdf,mime:'application/pdf'}),'CREDIT_NOT_FOUND');
   await failed(f.service.storeUpload(f.user,f.id,{bytes:new TextEncoder().encode('not a pdf data!!'),mime:'application/pdf'}),'CREDIT_UPLOAD_TYPE');
 }finally{f.close();}
});
test('preview rejection or accepted private version never falsely claims publication',async()=>{
 const f=fixture({engine:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   const a=await f.service.request(f.user,f.id,input);
   f.connection.prepare('INSERT INTO fp_versions VALUES(?,?,?,?)').run('v2','project1','ready','hashv2');
   await f.service.settleVerifiedPreview({requestId:a.id,receipt:{version_id:'v2',artifact_hash:'hashv2',verified:true,credits:20}});
   await failed(f.service.acknowledgeApproval(f.user,f.id,a.id,'v2'),'CREDIT_VERSION_NOT_APPROVED');
   f.connection.prepare('UPDATE fp_projects SET active_version_id=? WHERE id=?').run('v2',f.id);
   const result=await f.service.acknowledgeApproval(f.user,f.id,a.id,'v2');
   assert.equal(result.public_published,false);assert.equal(result.status,'approved');
   assert.equal(wallet(f)[0].spent,20);
 }finally{f.close();}
});
test('rejected preview retains correct spent history without charging again',async()=>{
 const f=fixture({engine:true});try{
   await f.service.grantPaidMonth(f.id,f.invoice.id);
   const a=await f.service.request(f.user,f.id,input);
   f.connection.prepare('INSERT INTO fp_versions VALUES(?,?,?,?)').run('v2','project1','ready','hashv2');
   await f.service.settleVerifiedPreview({requestId:a.id,receipt:{version_id:'v2',artifact_hash:'hashv2',verified:true,credits:22}});
   const r=await f.service.rejectPreview(f.user,f.id,a.id);
   assert.equal(r.status,'reverted');assert.equal(wallet(f)[0].spent,22);
   await f.service.rejectPreview(f.user,f.id,a.id);assert.equal(wallet(f)[0].spent,22);
 }finally{f.close();}
});