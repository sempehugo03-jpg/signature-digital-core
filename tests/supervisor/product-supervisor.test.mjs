import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initialState, validate, privacyCheck, reconcile, nextAction, humanGate, queueTask, key, BASELINE, BRANCH, REPOSITORY, readiness } from '../../supervisor/product/model.mjs';
import { GitHub } from '../../supervisor/product/github.mjs';
const gates=JSON.parse(await readFile(new URL('../../docs/product/interface-gates.json',import.meta.url)));
const make=()=>initialState(gates);
const snapshot=(head=BASELINE,files=[])=>({repository:REPOSITORY,head,pr:{number:202,head:{ref:BRANCH,sha:head},state:'open'},baselineAncestor:true,changedFiles:files});
test('acquired 21 gates remain PASS and billing does not authorize charge',()=>{
 const s=make();assert.equal(Object.keys(gates.gates).length,21);assert.equal(s.stages.INTERFACE,'ACQUIRED_PASS');assert.equal(s.authorization.payment,null);assert.equal(s.readiness.READY_TO_CHARGE_59_EUR,'NO');assert.equal(s.next_action,'WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION');validate(s);
});
test('supervisor-only commit preserves acquired interface proof',()=>{
 const s=reconcile(make(),snapshot('a'.repeat(40),['supervisor/product/run.mjs','.github/workflows/fabrya-product-supervisor.yml']));assert.equal(s.stages.QA,'ACQUIRED_PASS');for(const name of Object.keys(gates.gates))assert.equal(s.gates[name].status,'PASS');
});
test('changed interface requires technical tests and real browser QA',()=>{
 const s=reconcile(make(),snapshot('a'.repeat(40),['product/client.mjs']));assert.equal(s.stages.QA,'REQUIRED');assert.equal(s.stages.INTERFACE,'REVIEW_REQUIRED');assert.equal(s.gates.AUTH_UI.status,'REVIEW_REQUIRED');
});
test('backend change does not invalidate all visual gates',()=>{
 const s=reconcile(make(),snapshot('a'.repeat(40),['product/service.mjs']));assert.equal(s.stages.QA,'REQUIRED');assert.equal(s.pending_zones.worker,true);assert.equal(s.gates.AUTH_UI.status,'PASS');assert.equal(s.gates.CHECKOUT_RETURN.status,'REVIEW_REQUIRED');assert.deepEqual(s.pending_files,['product/service.mjs']);
});
test('branch mismatch, closed PR and lost acquired baseline fail closed',()=>{
 for(const edit of [x=>x.pr.head.ref='main',x=>x.pr.head.sha='b'.repeat(40),x=>x.pr.state='closed',x=>x.baselineAncestor=false]){const x=snapshot();edit(x);assert.throws(()=>reconcile(make(),x));}
});
test('duplicate worker and browser queues retain one commit-scoped task each',()=>{
 const s=make();for(let i=0;i<2;i++){queueTask(s,'CODEX','Correct regression',['product/service.mjs']);queueTask(s,'BROWSER_QA','Visual verification',['product/client.mjs']);}assert.equal(s.worker_queue.length,1);assert.equal(s.qa_queue.length,1);assert.equal(s.worker_queue[0].paid_calls_authorized,false);assert.throws(()=>queueTask(s,'CODEX','Wrong scope',['src/App.tsx']));assert.throws(()=>queueTask(s,'CODEX','Traversal',['product/../src/App.tsx']));
});
test('crash recovery takes precedence over planning and keeps receipt',()=>{
 const s=make();const id=key('probe',BASELINE);s.current_action={id,status:'RUNNING'};s.ledger[id]={status:'SUCCEEDED'};assert.equal(nextAction(s),'RECONCILE_RUNNING_ACTION');assert.deepEqual(s.ledger[id],{status:'SUCCEEDED'});
});
test('human gates cannot be cleared by readiness or queue creation',()=>{
 const s=make();humanGate(s,'WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION');assert.equal(s.human_blocker,'FIRST_LIVE_PAYMENT_AUTHORIZATION');assert.equal(s.authorization.payment,null);humanGate(s,'WAITING_FOR_PUBLIC_DEPLOYMENT_AUTHORIZATION');assert.equal(s.human_blocker,'PUBLIC_DEPLOYMENT_AUTHORIZATION');assert.equal(s.authorization.public_deployment,null);
});
test('secrets and private Stripe identifiers never enter public durable state',()=>{
 for(const value of [{a:'sk_live_abcdef'},{a:'whsec_abcdef'},{a:'Bearer abcdef'},{email:'customer@example.test'},{card_number:'4242424242424242'},{a:'cs_live_abcdef'}])assert.throws(()=>privacyCheck(value));
});
test('queues cannot claim real dispatch or supervisor readiness',()=>{
 const s=make();queueTask(s,'CODEX','Inspect',['product/service.mjs']);queueTask(s,'BROWSER_QA','Inspect',['product/client.mjs']);assert.equal(readiness(s),'FAIL');assert.equal(s.gates.PRODUCT_WORKER_DISPATCH.status,'FAIL');assert.equal(s.gates.PRODUCT_QA_DISPATCH.status,'FAIL');
});
test('API rejects cross repository operations before transmitting credentials',async()=>{
 const api=new GitHub('test',()=>{throw Error('Must not send')});await assert.rejects(api.api('/repos/other/repo/git/refs'),/API_REPOSITORY_SCOPE/);
});
test('durable save uses non-force ref updates and competing stale writers fail',async()=>{
 let current='parent';let serial=0;const requests=[];
 const api=new GitHub('not-a-real-token',async(url,options)=>{
  const body=options.body?JSON.parse(options.body):null;requests.push({url,body});
  if(url.endsWith('/git/trees'))return Response.json({sha:'tree'});
  if(url.endsWith('/git/commits'))return Response.json({sha:`commit${++serial}`});
  if(url.includes('/git/refs/heads/')){assert.equal(body.force,false);if(current!=='parent')return Response.json({}, {status:422});current=body.sha;return Response.json({});}
  throw Error('Unexpected request');
 });
 await api.save(make(),'parent');await assert.rejects(api.save(make(),'parent'),/GITHUB_HTTP_422/);assert.equal(requests.filter(x=>x.url.includes('/git/refs/heads/')).length,2);
});
