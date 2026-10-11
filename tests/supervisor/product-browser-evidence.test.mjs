import test from 'node:test';
import assert from 'node:assert/strict';
import { readEvidence,saveEvidence } from '../../supervisor/product/browser/evidence.mjs';
const task={id:'a'.repeat(64),commit:'b'.repeat(40),run:'100'};
function apiFor(receipt){const writes=[];return {writes,path:x=>x,async api(path,method='GET',body){if(method!=='GET'){writes.push({path,method,body});throw new Error('Unexpected mutation');}if(path.startsWith('git/ref'))return {object:{sha:'c'.repeat(40)}};if(path.startsWith('contents'))return {content:Buffer.from(JSON.stringify(receipt)).toString('base64')};throw new Error('Unexpected read');}};}
test('lost checkpoint finds committed browser receipt and never writes evidence twice',async()=>{
 const receipt={action_id:task.id,commit:task.commit,run:task.run,result:'PASS',effect_count:1,scope:'PUBLIC_CODE_SYNTHETIC_LOOPBACK'};
 const api=apiFor(receipt);const recovered=await saveEvidence(api,task,{status:'PASS',captures:[]},'/does-not-exist');assert.equal(recovered.run,'100');assert.equal(recovered.effect_count,1);assert.equal(recovered.evidence_commit,'c'.repeat(40));assert.equal(api.writes.length,0);
});
test('receipt from a different commit or private capture scope cannot clear QA',async()=>{
 for(const change of [{commit:'d'.repeat(40)},{scope:'PRIVATE_DEPLOYMENT'}])await assert.rejects(()=>readEvidence(apiFor({action_id:task.id,commit:task.commit,scope:'PUBLIC_CODE_SYNTHETIC_LOOPBACK',...change}),task),/SCOPE_INVALID/);
});
test('absent durable receipt is unproved, not a successful browser task',async()=>{
 const api={path:x=>x,async api(){throw Object.assign(new Error('missing'),{status:404});}};assert.equal(await readEvidence(api,task),null);
});
