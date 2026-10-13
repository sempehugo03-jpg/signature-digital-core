import {sha256,signRequest,AUTH_WINDOW_MS} from './auth.mjs';
import {isOpaqueId,isSha} from '../contracts/site-changes/v1/protocol.mjs';
import {sitesAssetReferences,SITE_ASSET_PART_BYTES,SITE_ASSET_MAX_BYTES,decodeBase64} from './sites-data-assets.mjs';
import {decodePng,encodePng} from './png-raster.mjs';
const encode=s=>new TextEncoder().encode(s),digest=s=>sha256(encode(s));
export const SITES_DATA_PATH='/_fabrya/site-content';
const MAX_BODY=2_100_000,MAX_HTML=2_000_000;
const fail=(code,status=409)=>{throw Object.assign(Error(code),{status});};
export function validateSitesBinding(binding){
 if(!binding||Object.keys(binding).sort().join(',')!=='customer_ref,origin,project_ref,site_project_id,site_ref')fail('SITE_BINDING_INVALID',503);
 for(const k of ['customer_ref','project_ref','site_project_id','site_ref'])if(!isOpaqueId(binding[k]))fail('SITE_BINDING_INVALID',503);
 const u=new URL(binding.origin);if(u.protocol!=='https:'||u.origin!==binding.origin||u.username||u.password||!u.hostname.endsWith('.chatgpt.site'))fail('SITE_ORIGIN_INVALID',503);
 return Object.freeze({customer_ref:binding.customer_ref,origin:binding.origin,project_ref:binding.project_ref,site_project_id:binding.site_project_id,site_ref:binding.site_ref});
}
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'private, no-store'}});

// This factory is compiled into EACH retained Site, with immutable server-owned
// binding and original HTML. No browser-selected project, origin or file path.
// Deployment MUST preserve confirmed owner-private Sites access. Its platform
// service boundary is supplemented by a separate per-Site HMAC writer secret.
export function createSitesDataWorker({binding,baseline,baseline_release_ref,clock=()=>Date.now()}){
 const scope=validateSitesBinding(binding),bindingJson=JSON.stringify(scope);
 if(typeof baseline!=='string'||encode(baseline).length>MAX_HTML||!isOpaqueId(baseline_release_ref))fail('SITE_BASELINE_INVALID',503);
 const baselineHash=digest(baseline);
 const row=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
 const statement=(db,sql,...args)=>db.prepare(sql).bind(...args);
 async function initialize(db){
  // Schema is migration-owned and installed by Sites before Worker upload.
  // Requests may seed the retained immutable baseline, never CREATE/ALTER.
  const sha=await baselineHash,receipt={release_ref:baseline_release_ref,site_project_id:scope.site_project_id,artifact_sha256:sha,actual_cost_microeur:null};
  await db.batch([
   statement(db,'INSERT OR IGNORE INTO fs_data_artifacts VALUES(?,?)',sha,baseline),
   statement(db,'INSERT OR IGNORE INTO fs_data_releases VALUES(?,?,0,?)',baseline_release_ref,sha,JSON.stringify(receipt)),
   statement(db,'INSERT OR IGNORE INTO fs_data_state VALUES(1,?,?,0)',bindingJson,baseline_release_ref)
  ]);
  const state=await row(db,'SELECT * FROM fs_data_state WHERE singleton=1');
  if(state.binding_json!==bindingJson)fail('SITE_BINDING_CHANGED');
  const original=await row(db,'SELECT * FROM fs_data_artifacts WHERE sha256=?',sha);
  if(!original||original.html!==baseline)fail('SITE_BASELINE_CONFLICT');
 }
 async function authenticate(request,env){
  if(Number(request.headers.get('content-length')||0)>MAX_BODY)fail('SITE_BODY_TOO_LARGE',413);
  const reader=request.body?.getReader(),chunks=[];let length=0;
  if(reader){for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BODY){await reader.cancel();fail('SITE_BODY_TOO_LARGE',413);}chunks.push(value);}}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const timestamp=request.headers.get('x-fabrya-timestamp'),nonce=request.headers.get('x-fabrya-nonce'),sig=request.headers.get('x-fabrya-signature');
  if(!/^\d{13}$/.test(timestamp||'')||Math.abs(clock()-Number(timestamp))>AUTH_WINDOW_MS||!/^[A-Za-z0-9_-]{16,100}$/.test(nonce||'')||!/^[a-f0-9]{64}$/.test(sig||''))fail('SITE_WRITER_UNAUTHORIZED',401);
  const expected=await signRequest({secret:env.FABRYA_SITE_WRITER_SECRET,method:'POST',path:SITES_DATA_PATH,body:raw,timestamp,nonce});
  // Constant-work comparison; signature is never logged or returned.
  let difference=0;for(let i=0;i<64;i++)difference|=expected.charCodeAt(i)^sig.charCodeAt(i);
  if(difference)fail('SITE_WRITER_UNAUTHORIZED',401);
  if(!env.DB)fail('SITE_STORAGE_UNAVAILABLE',503);await initialize(env.DB);
  const consumed=await statement(env.DB,'INSERT OR IGNORE INTO fs_data_nonces VALUES(?,?)',nonce,Number(timestamp)+AUTH_WINDOW_MS).run();
  if(consumed.meta.changes!==1)fail('SITE_WRITER_REPLAY',401);
  let body;try{body=JSON.parse(raw);}catch{fail('SITE_INVALID_JSON',400);}
  if(JSON.stringify(body.binding)!==bindingJson)fail('SITE_SCOPE_REFUSED',403);
  if(!isOpaqueId(body.command_key))fail('SITE_COMMAND_INVALID',400);
  return body;
 }
 async function write(db,body){
  const allow=body.action==='publish'?['action','binding','command_key','html','artifact_sha256','expected_release_ref']:['action','binding','command_key','target_release_ref','expected_release_ref'];
  if(!['publish','restore'].includes(body.action)||Object.keys(body).some(k=>!allow.includes(k))||!isOpaqueId(body.expected_release_ref))fail('SITE_COMMAND_INVALID',400);
  let artifactSha;
  if(body.action==='publish'){
   if(typeof body.html!=='string'||encode(body.html).length>MAX_HTML||!isSha(body.artifact_sha256)||await digest(body.html)!==body.artifact_sha256)fail('SITE_ARTIFACT_INVALID',400);
   for(const asset of sitesAssetReferences(body.html,scope.project_ref)){
    const ready=await row(db,"SELECT sha256 FROM fs_data_assets WHERE sha256=? AND state='READY'",asset.sha256);
    if(!ready)fail('SITE_ASSET_TRANSPORT_NOT_CONNECTED',503);
   }
   artifactSha=body.artifact_sha256;
  }else if(!isOpaqueId(body.target_release_ref))fail('SITE_COMMAND_INVALID',400);
  const payloadHash=await digest(JSON.stringify(body));
  const claimed=await statement(db,"INSERT OR IGNORE INTO fs_data_commands VALUES(?,?,'STARTED',NULL)",body.command_key,payloadHash).run();
  const command=await row(db,'SELECT * FROM fs_data_commands WHERE command_key=?',body.command_key);
  if(command.payload_hash!==payloadHash)fail('SITE_COMMAND_CONFLICT');
  if(claimed.meta.changes!==1){if(command.state==='APPLIED')return JSON.parse(command.receipt_json);fail('SITE_RECONCILIATION_REQUIRED',503);}
  const state=await row(db,'SELECT * FROM fs_data_state WHERE singleton=1');
  if(state.current_release!==body.expected_release_ref)fail('SITE_RELEASE_CONFLICT');
  let target,receipt;
  if(body.action==='publish'){
   const existing=await row(db,'SELECT html FROM fs_data_artifacts WHERE sha256=?',artifactSha);if(existing&&existing.html!==body.html)fail('SITE_ARTIFACT_CONFLICT');
   target='sites_release_'+payloadHash.slice(0,40);
   receipt={release_ref:target,site_project_id:scope.site_project_id,artifact_sha256:artifactSha,actual_cost_microeur:null};
  }else{
   target=body.target_release_ref;const previous=await row(db,'SELECT * FROM fs_data_releases WHERE release_ref=?',target),current=await row(db,'SELECT * FROM fs_data_releases WHERE release_ref=?',state.current_release);
   if(!previous||!current||previous.generation>=current.generation)fail('SITE_RESTORE_TARGET_INVALID');
   receipt=JSON.parse(previous.receipt_json);
  }
  const commands=[];
  if(body.action==='publish')commands.push(
   statement(db,'INSERT OR IGNORE INTO fs_data_artifacts SELECT ?,? WHERE EXISTS(SELECT 1 FROM fs_data_state WHERE singleton=1 AND current_release=?)',artifactSha,body.html,body.expected_release_ref),
   statement(db,'INSERT OR IGNORE INTO fs_data_releases SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM fs_data_state WHERE singleton=1 AND current_release=?)',target,artifactSha,state.revision+1,JSON.stringify(receipt),body.expected_release_ref)
  );
  commands.push(
   statement(db,'UPDATE fs_data_state SET current_release=?,revision=revision+1 WHERE singleton=1 AND current_release=?',target,body.expected_release_ref),
   statement(db,"UPDATE fs_data_commands SET state='APPLIED',receipt_json=? WHERE command_key=? AND state='STARTED' AND EXISTS(SELECT 1 FROM fs_data_state WHERE singleton=1 AND current_release=?)",JSON.stringify(receipt),body.command_key,target)
  );
  await db.batch(commands);const applied=await row(db,'SELECT * FROM fs_data_commands WHERE command_key=?',body.command_key);
  if(applied.state!=='APPLIED')fail('SITE_RELEASE_CONFLICT');return JSON.parse(applied.receipt_json);
 }
 async function assetBytes(db,sha){
  const asset=await row(db,'SELECT * FROM fs_data_assets WHERE sha256=?',sha);if(!asset)fail('SITE_ASSET_NOT_FOUND',404);
  const parts=(await statement(db,'SELECT * FROM fs_data_asset_parts WHERE sha256=? ORDER BY part',sha).all()).results;
  if(parts.length!==asset.part_count)return null;
  const bytes=new Uint8Array(asset.byte_size);let at=0;
  for(let i=0;i<parts.length;i++){const part=parts[i],chunk=new Uint8Array(part.bytes);if(part.part!==i||at+chunk.length>bytes.length||await sha256(chunk)!==part.chunk_sha256)fail('SITE_ASSET_CORRUPT',503);bytes.set(chunk,at);at+=chunk.length;}
  if(at!==bytes.length||await sha256(bytes)!==sha)fail('SITE_ASSET_CORRUPT',503);return bytes;
 }
 async function assetPart(db,body){
  if(Object.keys(body).some(k=>!['action','binding','command_key','asset_sha256','byte_size','part','part_count','chunk_base64'].includes(k))||!isSha(body.asset_sha256)||!Number.isInteger(body.byte_size)||body.byte_size<17||body.byte_size>SITE_ASSET_MAX_BYTES||!Number.isInteger(body.part)||!Number.isInteger(body.part_count)||body.part_count!==Math.ceil(body.byte_size/SITE_ASSET_PART_BYTES)||body.part<0||body.part>=body.part_count||body.command_key!=='asset_'+body.asset_sha256+'_'+body.part)fail('SITE_ASSET_CHUNK_INVALID',400);
  let bytes;try{bytes=decodeBase64(body.chunk_base64);}catch{fail('SITE_ASSET_CHUNK_INVALID',400);}
  if(bytes.length!==Math.min(SITE_ASSET_PART_BYTES,body.byte_size-body.part*SITE_ASSET_PART_BYTES))fail('SITE_ASSET_CHUNK_INVALID',400);
  const sha=body.asset_sha256,chunkHash=await sha256(bytes),payloadHash=await digest(JSON.stringify(body));
  const existing=await row(db,'SELECT * FROM fs_data_assets WHERE sha256=?',sha);
  if(existing&&(existing.byte_size!==body.byte_size||existing.part_count!==body.part_count))fail('SITE_ASSET_IMMUTABLE');
  const previous=await row(db,'SELECT * FROM fs_data_asset_parts WHERE sha256=? AND part=?',sha,body.part);
  if(previous&&previous.chunk_sha256!==chunkHash)fail('SITE_ASSET_IMMUTABLE');
  const command=await row(db,'SELECT * FROM fs_data_commands WHERE command_key=?',body.command_key);
  if(command&&command.payload_hash!==payloadHash)fail('SITE_COMMAND_CONFLICT');
  await db.batch([
   statement(db,"INSERT OR IGNORE INTO fs_data_assets VALUES(?,?,?,'UPLOADING')",sha,body.byte_size,body.part_count),
   statement(db,'INSERT OR IGNORE INTO fs_data_asset_parts VALUES(?,?,?,?)',sha,body.part,chunkHash,bytes.buffer),
   statement(db,"INSERT OR IGNORE INTO fs_data_commands VALUES(?,?,'APPLIED',?)",body.command_key,payloadHash,JSON.stringify({asset_sha256:sha,part:body.part}))
  ]);
  const assembled=await assetBytes(db,sha);
  if(assembled){
   // Revalidate the exact canonical PNG raster, including CRCs and bounds.
   const png=decodePng(assembled,3000000),canonical=encodePng(png);
   if(await sha256(canonical)!==sha)fail('SITE_ASSET_SCAN_INVALID',400);
   await statement(db,"UPDATE fs_data_assets SET state='READY' WHERE sha256=? AND state='UPLOADING'",sha).run();
  }
  return {asset_sha256:sha,part:body.part,ready:!!assembled};
 }
 return {async fetch(request,env){try{
  const url=new URL(request.url);if(url.origin!==scope.origin||url.search)fail('SITE_HOST_REFUSED',403);
  if(url.pathname===SITES_DATA_PATH){
   if(request.method!=='POST')return json({error:'SITE_METHOD_REFUSED'},405);
   const body=await authenticate(request,env);
   if(body.action==='asset_part')return json({receipt:await assetPart(env.DB,body)});
   if(body.action==='reconcile'){
    if(Object.keys(body).some(k=>!['action','binding','command_key'].includes(k)))fail('SITE_COMMAND_INVALID',400);
    const command=await row(env.DB,'SELECT * FROM fs_data_commands WHERE command_key=?',body.command_key);
    return json({receipt:command?.state==='APPLIED'?JSON.parse(command.receipt_json):null});
   }
   return json({receipt:await write(env.DB,body)});
  }
  const assetPath=url.pathname.match(/^\/engine\/assets\/([A-Za-z0-9_-]{8,160})\/([a-f0-9]{64})\.png$/);
  if(assetPath){
   if(request.method!=='GET')return new Response('Method not allowed',{status:405});
   if(assetPath[1]!==scope.project_ref)fail('SITE_ASSET_SCOPE',404);
   const ready=await row(env.DB,"SELECT sha256 FROM fs_data_assets WHERE sha256=? AND state='READY'",assetPath[2]);if(!ready)fail('SITE_ASSET_NOT_FOUND',404);
   const bytes=await assetBytes(env.DB,assetPath[2]);if(!bytes)fail('SITE_ASSET_CORRUPT',503);
   return new Response(bytes,{headers:{'content-type':'image/png','cache-control':'private, no-store','x-content-type-options':'nosniff','x-fabrya-asset-sha256':assetPath[2]}});
  }
  if(!['/','/index.html'].includes(url.pathname))return new Response('Not found',{status:404});
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  let html=baseline,release=baseline_release_ref;
  if(env.DB){let state;try{state=await row(env.DB,'SELECT * FROM fs_data_state WHERE singleton=1');}catch(error){if(!/no such table.*fs_data_state/.test(error.message))throw error;}
   if(state){if(state.binding_json!==bindingJson)fail('SITE_BINDING_CHANGED');const artifact=await row(env.DB,'SELECT a.*,r.release_ref FROM fs_data_releases r JOIN fs_data_artifacts a ON a.sha256=r.sha256 WHERE r.release_ref=?',state.current_release);if(!artifact||await digest(artifact.html)!==artifact.sha256)fail('SITE_ARTIFACT_CORRUPT',503);html=artifact.html;release=artifact.release_ref;}
  }
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','x-fabrya-release':release,'x-fabrya-artifact-sha256':await digest(html)}});
 }catch(error){return json({error:error.status?error.message:'SITE_OPERATION_FAILED'},error.status||503);}}};
}
