import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture,register} from './helpers.mjs';
import {productApprovalReader} from '../../product/change-approval.mjs';
import {initializePrivateChanges} from '../../product/change-migration.mjs';

test('existing sessions scope wallets, changes, file refs and preview refs; client cannot grant/publish',async()=>{
 const f=fixture();f.env.FABRYA_CREDITS_ENABLED='true';
 f.db.connection.exec(readFileSync(new URL('../../product/change-credits-schema.sql',import.meta.url),'utf8'));
 await register(f,'charpentier@example.test');const a=f.cookie;
 const project=(await f.req('projects','POST',{request_key:crypto.randomUUID()})).data.project.id;
 assert.equal((await f.req('projects/'+project+'/credits')).data.monthly_available,0);
 assert.equal((await f.req('projects/'+project+'/changes','POST',{request_key:crypto.randomUUID(),message:'Nouveaux horaires'})).status,403);
 await register(f,'kine@example.test');
 for(const path of ['credits','changes/change_123456789/preview','change-files/file_123456789']) assert.equal((await f.req('projects/'+project+'/'+path)).status,404);
 assert.equal((await f.req('projects/'+project+'/changes','POST',{message:'Changer le site',request_key:crypto.randomUUID()})).status,404);
 assert.equal((await f.req('projects/'+project+'/changes/change_123456789/acknowledge','POST',{version_id:'version_12345678'})).status,404);
 f.cookie=a;
 for(const path of ['credits/grant','changes/change_123456789/publish']) assert.equal((await f.req('projects/'+project+'/'+path,'POST',{})).status,404);
 assert.equal((await f.req('projects/'+project+'/credits','POST',{}, {origin:'https://evil.test'})).status,403);
 f.cookie='';assert.equal((await f.req('projects/'+project+'/credits')).status,401);f.db.close();
});
test('approval verifier binds authenticated owner, project, exact version/hash and current paid state',async()=>{
 const f=fixture();f.db.connection.exec(readFileSync(new URL('../../product/change-credits-schema.sql',import.meta.url),'utf8'));
 const u=(await register(f)).data.user;const p=(await f.req('projects','POST',{request_key:crypto.randomUUID()})).data.project.id;
 const verify=productApprovalReader(f.db).verify;const args={principal:{customer_ref:'customer_'+u.id,project_ref:p},change_ref:'change_123456789',approval_ref:'approval_123456789',version_ref:'version_123456789',artifact_sha256:'a'.repeat(64),action:'publish'};
 assert.deepEqual(await verify(args),{approved:false});
 // Deliberately minimal fixture state; no Stripe or hosted activation claim.
 f.db.connection.exec('PRAGMA foreign_keys=OFF');
 f.db.connection.prepare("UPDATE fp_projects SET status='active' WHERE id=?").run(p);
 f.db.connection.prepare("INSERT INTO fp_subscriptions(project_id,stripe_subscription_id,stripe_customer_id,state,price_id,amount,currency,created_at,updated_at) VALUES(?,'sub_fixture','cus_fixture','active','price_fixture',5900,'eur',?,?)").run(p,new Date().toISOString(),new Date().toISOString());
 f.db.connection.prepare("INSERT INTO fp_activations(project_id,version_id,approval_id,stripe_session_id,artifact_hash,created_at) VALUES(?,'version_fixture','approval_fixture','cs_fixture',?,?)").run(p,'b'.repeat(64),new Date().toISOString());
 f.db.connection.prepare("INSERT INTO fp_change_requests(id,project_id,user_id,request_key,message,input_hash,base_version_id,status,candidate_version_id,candidate_hash,approval_ref,preview_receipt_json,created_at,updated_at) VALUES(?,?,?,'request_fixture','Horaires',?,'base_fixture','approved',?,?,?,'{}',?,?)").run(args.change_ref,p,u.id,'c'.repeat(64),args.version_ref,args.artifact_sha256,args.approval_ref,new Date().toISOString(),new Date().toISOString());
 f.db.connection.prepare('UPDATE fp_change_requests SET preview_receipt_json=? WHERE id=?').run(JSON.stringify({state:'PREVIEW_READY',published:false,change_ref:args.change_ref,version_ref:args.version_ref,artifact_sha256:args.artifact_sha256}),args.change_ref);
 assert.deepEqual(await verify(args),{approved:true});
 for(const mutation of [{version_ref:'other_version'},{artifact_sha256:'d'.repeat(64)},{approval_ref:'other_approval'},{action:'restore'},{principal:{customer_ref:'customer_other',project_ref:p}}]) assert.deepEqual(await verify({...args,...mutation}),{approved:false});
 f.db.connection.prepare("UPDATE fp_subscriptions SET state='past_due' WHERE project_id=?").run(p);assert.deepEqual(await verify(args),{approved:false});f.db.close();
});
test('credit migration is additive and refuses public or disabled environments',async()=>{
 let count=0;const db={prepare(){count++;return {async first(){return null},async run(){}}}};
 await initializePrivateChanges(db,{FABRYA_CREDITS_ENABLED:'true',FABRYA_PRODUCT_QA:'false'});assert.equal(count,0);
 await initializePrivateChanges(db,{FABRYA_CREDITS_ENABLED:'true',FABRYA_PRODUCT_QA:'true',FABRYA_PRODUCT_ORIGIN:'https://fabrya.fr'});assert.equal(count,0);
 await initializePrivateChanges(db,{FABRYA_CREDITS_ENABLED:'true',FABRYA_PRODUCT_QA:'true',FABRYA_PRODUCT_ORIGIN:'https://fabrya-product-qa.sempehugo03.chatgpt.site'});assert.ok(count>0);
});

test('signed invoice webhook grants exactly 100 once using re-read provider facts; failed invoice grants nothing (local provider fixture)',async()=>{
 const f=fixture();f.env.FABRYA_CREDITS_ENABLED='true';f.db.connection.exec(readFileSync(new URL('../../product/change-credits-schema.sql',import.meta.url),'utf8'));
 await register(f);const p=(await f.req('projects','POST',{request_key:crypto.randomUUID()})).data.project.id;
 const sub='sub_invoice_fixture';f.stripe.subscriptions.set(sub,{id:sub,status:'active',livemode:false,price:f.stripe.priceId,amount:5900,currency:'eur'});
 f.db.connection.prepare("INSERT INTO fp_subscriptions(project_id,stripe_subscription_id,stripe_customer_id,state,price_id,amount,currency,created_at,updated_at) VALUES(?,?,'cus_invoice_fixture','active',?,5900,'eur',?,?)").run(p,sub,f.stripe.priceId,new Date(f.time).toISOString(),new Date(f.time).toISOString());
 const start=Math.floor(f.time/1000),end=start+31*86400;
 f.stripe.getInvoice=async id=>({id,status:id==='in_paid_fixture'?'paid':'open',paid:id==='in_paid_fixture',livemode:false,currency:'eur',amount_paid:id==='in_paid_fixture'?5900:0,subscription:sub,lines:{data:[{price:{id:f.stripe.priceId},period:{start,end}}]}});
 f.stripe.getSessionsForSubscription=async()=>({data:[]});f.stripe.livemode=false;
 const {signedEvent}=await import('./helpers.mjs');
 async function send(event){const signed=await signedEvent(event,'whsec_fixture',f.time);return f.handle(new Request('https://qa.fabrya.test/api/product/webhook',{method:'POST',headers:{'stripe-signature':signed.signature},body:signed.raw}));}
 const event={id:'evt_invoice_paid_fixture',type:'invoice.paid',livemode:false,data:{object:{id:'in_paid_fixture'}}};
 assert.equal((await send(event)).status,200);assert.equal((await send(event)).status,200);
 assert.equal((await f.req('projects/'+p+'/credits')).data.monthly_available,100);
 assert.equal(f.db.connection.prepare('SELECT COUNT(*) n FROM fp_credit_wallets').get().n,1);
 assert.equal((await send({...event,id:'evt_invoice_failed_fixture',type:'invoice.payment_failed',data:{object:{id:'in_failed_fixture'}}})).status,200);
 assert.equal(f.db.connection.prepare('SELECT COUNT(*) n FROM fp_credit_wallets').get().n,1);f.db.close();
});
