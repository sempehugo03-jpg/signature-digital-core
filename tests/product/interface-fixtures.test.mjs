import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(new URL('../../product/package.json',import.meta.url));
const {build}=require('esbuild');
const result=await build({entryPoints:[fileURLToPath(new URL('../../product/worker-entry.mjs',import.meta.url))],bundle:true,format:'esm',platform:'browser',write:false,loader:{'.html':'text','.css':'text'},plugins:[{name:'raw',setup(b){b.onResolve({filter:/\?raw$/},a=>({path:fileURLToPath(new URL(a.path.slice(0,-4),'file://'+a.resolveDir+'/')),namespace:'raw'}));b.onLoad({filter:/.*/,namespace:'raw'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}));}}]});
const worker=(await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))).default;
const origin='https://fabrya-product-live-validation.sempehugo03.chatgpt.site';
test('UI fixtures are unavailable outside pinned private origin and never touch DB or Stripe',async()=>{
 const db={get prepare(){throw new Error('Fixture touched LIVE DB');}};
 for(const path of ['/interface-fixture?scenario=active','/product-assets/fixture-product-client.mjs','/api/interface-fixtures/projects/fixture_project/versions/fixture_v2/preview']){
  assert.equal((await worker.fetch(new Request(origin+path),{DB:db,FABRYA_PRODUCT_ORIGIN:'https://fabrya.fr'})).status,404);
  const r=await worker.fetch(new Request(origin+path),{DB:db,FABRYA_PRODUCT_ORIGIN:origin});
  assert.equal(r.status,200);
  const text=await r.text();
  if(path.startsWith('/interface-fixture')) assert.match(text,/simulé/);
  if(path.startsWith('/product-assets')) {assert.doesNotMatch(text,/\/api\/product\//);assert.match(text,/\/api\/interface-fixtures\//);}
 }
});
