import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareContinuityProbe,integrationConnection } from '../../supervisor/product/continuity.mjs';
import { initialState,reconcile,browserEvidenceCurrent,validate,BASELINE,BRANCH,REPOSITORY } from '../../supervisor/product/model.mjs';
const gates=JSON.parse(await readFile(new URL('../../docs/product/interface-gates.json',import.meta.url)));
const make=()=>{const s=initialState(gates);s.proof={status:'PASS',effect_count:1,recovered_run:'old-run'};s.last_browser_qa={commit:BASELINE,status:'PASS',run:'old-browser',effect_count:1};s.last_test_run={commit:BASELINE,status:'PASS'};return s;};
const snapshot=files=>({repository:REPOSITORY,head:'a'.repeat(40),pr:{number:202,head:{ref:BRANCH,sha:'a'.repeat(40)},state:'open'},baselineAncestor:true,changedFiles:files});
test('new continuity request preserves old receipt and deduplicates subsequent wakes',()=>{
 const s=make();assert.equal(prepareContinuityProbe(s,'readonly-20261028'),true);assert.equal(s.proof.history[0].effect_count,1);const pending=structuredClone(s.proof);assert.equal(prepareContinuityProbe(s,'readonly-20261028'),false);assert.deepEqual(s.proof,pending);
 s.proof.status='INTERRUPTED';s.proof.effect_count=1;s.current_action={id:'persisted-intent'};assert.equal(prepareContinuityProbe(s,'another-request'),false);assert.equal(s.proof.effect_count,1);validate(s);
});
test('supervisor-only changes retain exact browser receipt applicability, without altering visual gates',()=>{
 const s=make();const old=structuredClone(s.gates);reconcile(s,snapshot(['supervisor/product/run.mjs','tests/supervisor/product-continuity.test.mjs','vercel.json']));assert.equal(browserEvidenceCurrent(s),true);assert.equal(s.last_browser_qa.commit,BASELINE);assert.equal(s.last_browser_qa.run,'old-browser');assert.deepEqual(s.gates,old);
});
test('product, product tests, dependencies and unknown source never inherit browser acceptance',()=>{
 for(const file of ['product/client.mjs','tests/product/client.test.mjs','package-lock.json','src/App.tsx']){const s=make();reconcile(s,snapshot([file]));assert.equal(browserEvidenceCurrent(s),false,file);}
});
test('private source probe is fixed GET, refuses redirects and never persists private body or credentials',async()=>{
 let bodyRead=false;const r=await integrationConnection(async(url,o)=>{
  assert.equal(url,'https://api.github.com/repos/sempehugo03-jpg/fabrya-engine/contents/docs/agent-governance/factory/registry.json?ref=infra%2Ffactory-20261016');assert.equal(o.method,'GET');assert.equal(o.redirect,'error');assert.equal(o.body,undefined);
  return {status:404,body:{cancel:async()=>{}},json:()=>{bodyRead=true;throw Error('private');}};
 },'test-credential');assert.equal(r.http_status,404);assert.equal(r.automatic_publication,false);assert.equal(r.source_read,false);assert.equal(bodyRead,false);assert.doesNotMatch(JSON.stringify(r),/test-credential/);
});
test('even existing read access cannot activate publishing or leak into public checkpoint',async()=>{
 const r=await integrationConnection(async()=>new Response('private registry',{status:200}),'test');assert.equal(r.status,'BLOCKED_PRIVATE_RECEIPT_SINK_REQUIRED');assert.equal(r.source_read,false);assert.equal(r.automatic_publication,false);
});
test('unknown network outcome stops without retry and no token means no request',async()=>{
 let n=0;const request=async()=>{n++;throw Error('transport');};assert.equal((await integrationConnection(request,null)).http_status,0);assert.equal(n,0);assert.equal((await integrationConnection(request,'test')).status,'BLOCKED_INTEGRATION_TRANSPORT');assert.equal(n,1);
});

test('actual acceptance checkpoint passes the unchanged privacy guard',()=>{const s=make();prepareContinuityProbe(s,'integration-readonly-20261028-v1');s.last_checkpoint={run:'40680206081',action:'CONTINUITY_REQUEST_ACCEPTED',at:'2026-10-28T11:30:00Z'};validate(s);});
