import {validateChangeEnvelope} from '../contracts/site-changes/v1/protocol.mjs';
import {understand,applyOperations,validateManifest} from './content.mjs';
import {sha256} from './auth.mjs';
const encoder=new TextEncoder();
const fail=code=>{throw Object.assign(new Error(code),{code});};
// registry and snapshot are Engine-owned; never constructed from browser data.
// Does not claim an artifact, release or hosted preview exists.
export async function prepareChange(envelope,{binding,snapshot,verifiedAssets={}}){
 validateChangeEnvelope(envelope);
 if(!binding||['customer_ref','project_ref','site_ref'].some(k=>binding[k]!==envelope[k]))fail('ENGINE_SITE_SCOPE');
 if(!snapshot||snapshot.site_ref!==binding.site_ref||snapshot.version_ref!==envelope.base_version_ref||snapshot.release_ref!==envelope.base_release_ref||snapshot.sha256!==envelope.base_sha256)fail('ENGINE_BASE_CONFLICT');
 const raw=encoder.encode(snapshot.content_json);
 if(await sha256(raw)!==(snapshot.content_sha256||snapshot.sha256))fail('ENGINE_SOURCE_HASH_MISMATCH');
 validateManifest(snapshot.manifest);
 const started=performance.now(),plan=understand(envelope.message,snapshot.manifest,envelope.attachments);
 if(plan.classification==='COMPLEX_MODIFICATION_REQUIRED')return {
  protocol:envelope.protocol,change_ref:envelope.change_ref,site_ref:envelope.site_ref,
  state:'AWAITING_WORK',business_code:'COMPLEX_MODIFICATION_REQUIRED',
  dossier:{message:envelope.message,customer_ref:binding.customer_ref,project_ref:binding.project_ref,site_ref:binding.site_ref,
   base_version_ref:snapshot.version_ref,base_release_ref:snapshot.release_ref,base_sha256:snapshot.sha256,
   reason:plan.reason,attachments:envelope.attachments},
  dispatch_performed:false
 };
 if(plan.classification==='CLARIFICATION_REQUIRED')return {classification:plan.classification,reason:plan.reason,question:plan.question};
 const checked={};
 for(const attachment of envelope.attachments){
  const asset=verifiedAssets[attachment.file_ref];
  if(!asset||asset.customer_ref!==binding.customer_ref||asset.project_ref!==binding.project_ref||asset.sha256!==attachment.sha256||asset.mime!==attachment.mime||asset.byte_size!==attachment.byte_size||asset.scan_status!=='clean'||!asset.bytes)fail('ENGINE_ATTACHMENT_SCOPE_OR_HASH');
  if(asset.bytes.byteLength!==attachment.byte_size||await sha256(asset.bytes)!==attachment.sha256)fail('ENGINE_ATTACHMENT_BYTES');checked[attachment.file_ref]=asset;
 }
 const data=applyOperations(JSON.parse(snapshot.content_json),snapshot.manifest,plan.operations,checked);
 const next=JSON.stringify(data);if(next===snapshot.content_json)fail('ENGINE_EMPTY_CHANGE');
 return {classification:'SMALL_MODIFICATION',operations:plan.operations,content_json:next,
  content_sha256:await sha256(encoder.encode(next)),metrics:{elapsed_ms:performance.now()-started,provider_calls:0,provider_cost_microeur:0,total_cost_microeur:null}};
}
