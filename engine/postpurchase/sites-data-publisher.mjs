import {sha256,signRequest} from './auth.mjs';
import {SITES_DATA_PATH,validateSitesBinding} from './sites-data-worker.mjs';
import {readSafePhotograph} from './images.mjs';
import {sitesAssetReferences,SITE_ASSET_PART_BYTES,base64Bytes} from './sites-data-assets.mjs';
const encode=s=>new TextEncoder().encode(s);
// Server-owned map only. Entries are legitimate per-Site Sites service access,
// separate writer HMAC secret, and exact immutable customer/project binding.
export function createSitesDataPublisher({sites,db=null,fetchImpl=fetch,clock=()=>Date.now()}){
 const entries=new Map(sites.map(({binding,serviceToken,writerSecret})=>{
  const b=validateSitesBinding(binding);if(typeof serviceToken!=='string'||!serviceToken||typeof writerSecret!=='string'||writerSecret.length<32)throw Error('SITES_WRITER_NOT_CONFIGURED');
  return [b.site_project_id,{binding:b,serviceToken,writerSecret}];
 }));
 function entry(site){const e=entries.get(site.site_project_id);if(!e||site.origin!==e.binding.origin||site.site_ref!==e.binding.site_ref||site.customer_ref!==e.binding.customer_ref||site.project_ref!==e.binding.project_ref)throw Error('SITES_PUBLISHER_SCOPE');return e;}
 async function invoke(site,body){
  const e=entry(site),raw=JSON.stringify({...body,binding:e.binding}),timestamp=String(clock()),nonce=crypto.randomUUID().replaceAll('-','');
  const signature=await signRequest({secret:e.writerSecret,method:'POST',path:SITES_DATA_PATH,body:raw,timestamp,nonce});
  const response=await fetchImpl(e.binding.origin+SITES_DATA_PATH,{method:'POST',redirect:'manual',headers:{'content-type':'application/json','OAI-Sites-Authorization':'Bearer '+e.serviceToken,'x-fabrya-timestamp':timestamp,'x-fabrya-nonce':nonce,'x-fabrya-signature':signature},body:raw});
  if(!response.ok)throw Error('SITES_WRITER_REFUSED_'+response.status);const result=await response.json();
  return result.receipt;
 }
 async function transferAssets(site,html){
  const e=entry(site),references=sitesAssetReferences(html,e.binding.project_ref);
  if(references.length&&!db)throw Error('SITES_ASSET_SOURCE_NOT_CONNECTED');
  for(const asset of references){
   if(!e.binding.customer_ref.startsWith('customer_'))throw Error('SITES_ASSET_SCOPE');
   const photograph=await readSafePhotograph(db,{sha256:asset.sha256,project_ref:e.binding.project_ref,user_ref:e.binding.customer_ref.slice('customer_'.length)});
   if(photograph.mime!=='image/png'||photograph.proof.scan_method!=='bounded-raster-decode-and-reencode-v1'||await sha256(photograph.bytes)!==asset.sha256)throw Error('SITES_ASSET_SCAN_REQUIRED');
   for(let at=0,part=0;at<photograph.bytes.length;at+=SITE_ASSET_PART_BYTES,part++){
    await invoke(site,{action:'asset_part',command_key:'asset_'+asset.sha256+'_'+part,asset_sha256:asset.sha256,byte_size:photograph.bytes.length,part,part_count:Math.ceil(photograph.bytes.length/SITE_ASSET_PART_BYTES),chunk_base64:base64Bytes(photograph.bytes.subarray(at,at+SITE_ASSET_PART_BYTES))});
   }
   const readback=await fetchImpl(e.binding.origin+asset.locator,{redirect:'manual',headers:{'OAI-Sites-Authorization':'Bearer '+e.serviceToken}});
   if(!readback.ok||await sha256(new Uint8Array(await readback.arrayBuffer()))!==asset.sha256)throw Error('SITES_ASSET_READBACK_MISMATCH');
  }
 }
 return Object.freeze({
  async publish({site,command_key,html,artifact_sha256,expected_release_ref}){await transferAssets(site,html);return invoke(site,{action:'publish',command_key,html,artifact_sha256,expected_release_ref});},
  restore:({site,command_key,target_release,expected_release_ref})=>invoke(site,{action:'restore',command_key,target_release_ref:target_release.release_ref,expected_release_ref}),
  reconcile:({site,command_key})=>invoke(site,{action:'reconcile',command_key}),
  async verify({site,release,expected_sha256}){
   const e=entry(site),response=await fetchImpl(e.binding.origin+'/index.html',{redirect:'manual',headers:{'OAI-Sites-Authorization':'Bearer '+e.serviceToken,'cache-control':'no-cache'}});
   if(!response.ok)throw Error('SITES_READBACK_REFUSED');const sha=await sha256(new Uint8Array(await response.arrayBuffer()));
   if(sha!==expected_sha256||response.headers.get('x-fabrya-release')!==release.release_ref)throw Error('SITES_READBACK_MISMATCH');
   return {sha256:sha,release_ref:release.release_ref,url:e.binding.origin+'/index.html'};
  }
 });
}
