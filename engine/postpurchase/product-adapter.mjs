import {createModifier} from './engine.mjs';
import {productApprovalVerifier} from './product-approval.mjs';
import {productImageResolver,readSafePhotograph} from './images.mjs';
import {sitesAssetReferences} from './sites-data-assets.mjs';
import {isOpaqueId,isSha} from '../contracts/site-changes/v1/protocol.mjs';

// In-process bridge for the existing Product port. The caller must obtain this
// principal from its authenticated session and owned project, never JSON input.
// One instance per scope; no mutable/global "current customer".
export function createProductModifier({db,principal,...dependencies}) {
 if(!principal?.customer_ref||!principal?.project_ref)throw Error('ENGINE_PRINCIPAL_REQUIRED');
 const scope=Object.freeze({customer_ref:principal.customer_ref,project_ref:principal.project_ref});
 const {adapter,store}=createModifier({db,productApproval:productApprovalVerifier(db),assetResolver:productImageResolver(db),...dependencies});
 const publisher=dependencies.publisher,policy=dependencies.costPolicy;
 const bridge={kind:adapter.kind,
  publication_available:['publish','restore','verify','reconcile'].every(method=>typeof publisher?.[method]==='function'),
  cost_policy_available:Number.isSafeInteger(policy?.estimate_microeur)&&policy.estimate_microeur>=0&&Number.isSafeInteger(policy?.cap_microeur)&&policy.cap_microeur>=policy.estimate_microeur&&typeof policy.basis==='string'&&policy.basis.length>5&&policy.basis.length<=250
 };
 for(const method of ['quote','findTask','submitTask','getTask','validatePreview','readPreview','publish','restore','validateRelease'])bridge[method]=args=>adapter[method](scope,args);
 bridge.readPreviewAsset=async args=>{
  if(!args||Object.keys(args).some(key=>!['request_id','site_ref','sha256'].includes(key))||!isOpaqueId(args.request_id)||!isOpaqueId(args.site_ref)||!isSha(args.sha256))throw Error('ENGINE_PREVIEW_ASSET_INPUT');
  const task=await store.task(scope,args.request_id);
  if(task.site_ref!==args.site_ref)throw Error('ENGINE_NOT_FOUND');
  // readPreview verifies the task's immutable artifact SHA and permitted state;
  // the asset is selected only from those exact bytes, never from a caller URL.
  const html=await adapter.readPreview(scope,args);
  const reference=sitesAssetReferences(html,scope.project_ref).find(asset=>asset.sha256===args.sha256);
  if(!reference)throw Error('ENGINE_PREVIEW_ASSET_NOT_REFERENCED');
  if(!scope.customer_ref.startsWith('customer_')||scope.customer_ref.length<=9)throw Error('ENGINE_PRINCIPAL_REQUIRED');
  const photograph=await readSafePhotograph(db,{sha256:args.sha256,project_ref:scope.project_ref,user_ref:scope.customer_ref.slice('customer_'.length)});
  if(photograph.mime!=='image/png'||photograph.proof.safe_mime!=='image/png'||photograph.proof.safe_sha256!==args.sha256||photograph.proof.scan_method!=='bounded-raster-decode-and-reencode-v1')throw Error('ENGINE_PREVIEW_ASSET_SCAN_REQUIRED');
  const receipt=await adapter.validatePreview(scope,args);
  return {bytes:photograph.bytes,mime:'image/png',sha256:args.sha256,byte_size:photograph.bytes.length,locator:reference.locator,artifact_sha256:receipt.artifact_sha256};
 };
 bridge.reconcilePublication=async args=>{
  // Resume only a command already persisted by the Engine before its external
  // effect. Calling publish without this record could start a new deployment.
  const task=await store.task(scope,args.change_ref);
  if(task.site_ref!==args.site_ref)throw Error('ENGINE_NOT_FOUND');
  const command=await store.first("SELECT command_key FROM fm_commands WHERE command_key=? AND change_ref=? AND kind='publish'",'publish_'+args.change_ref,args.change_ref);
  if(!command)throw Error('ENGINE_RECONCILIATION_REQUIRED');
  return adapter.publish(scope,args);
 };
 bridge.getCurrentRelease=async(args={})=>{
  if(args.project_id&&args.project_id!==scope.project_ref)throw Error('ENGINE_NOT_FOUND');
  if(args.user_ref&&'customer_'+args.user_ref!==scope.customer_ref)throw Error('ENGINE_NOT_FOUND');
  let siteRef=args.site_ref;
  if(!siteRef){const site=await store.first('SELECT site_ref FROM fm_sites WHERE customer_ref=? AND project_ref=?',scope.customer_ref,scope.project_ref);if(!site)throw Error('ENGINE_NOT_FOUND');siteRef=site.site_ref;}
  return adapter.getCurrentRelease(scope,{...args,site_ref:siteRef});
 };
 return Object.freeze(bridge);
}
