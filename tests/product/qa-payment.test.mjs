import test from 'node:test';
import assert from 'node:assert/strict';
import {qaPayment} from '../../product/qa-payment.mjs';
const origin='https://fabrya-product-qa.sempehugo03.chatgpt.site';
const base={tag:'A',password:'original-qa-password',action:'prepare',owner:'admin',env:{FABRYA_PRODUCT_QA:'true',FABRYA_STRIPE_MODE:'test'},request:new Request(origin+'/mcp',{method:'POST',headers:{'oai-authenticated-user-id':'admin'}})};
test('QA payment refuses LIVE, public host, service credential, customer session and foreign administrator before transport',async()=>{
 let touched=0;const db={prepare(){touched++;throw Error('UNEXPECTED_DB');}};
 for(const change of [{env:{...base.env,FABRYA_STRIPE_MODE:'live'}},{request:new Request('https://fabrya.fr/mcp',{method:'POST'})},{request:new Request(origin+'/mcp',{method:'POST',headers:{'oai-authenticated-user-id':'admin','oai-sites-authorization':'Bearer service'}})},{request:new Request(origin+'/mcp',{method:'POST',headers:{'oai-authenticated-user-id':'admin',cookie:'fabrya_session=value'}})},{owner:'foreign'}])await assert.rejects(qaPayment({...base,...change,db,productFetch:()=>{touched++;}}),e=>e.code==='QA_ADMIN_REQUIRED');
 assert.equal(touched,0);
});
test('QA payment requires original owner binding and refuses unspecified actions',async()=>{
 let requests=0;const db={prepare(){return{bind(){return{first:async()=>null}}}}};
 await assert.rejects(qaPayment({...base,db,productFetch:()=>requests++}),e=>e.code==='QA_ADMIN_NOT_AUTHORIZED');
 await assert.rejects(qaPayment({...base,db,action:'grant',productFetch:()=>requests++}),e=>e.code==='INVALID_REQUEST');assert.equal(requests,0);
});
