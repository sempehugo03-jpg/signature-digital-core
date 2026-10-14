import {sitesAssetReferences,base64Bytes} from '../engine/postpurchase/sites-data-assets.mjs';
import {sha256} from '../engine/postpurchase/auth.mjs';
const hash=s=>sha256(new TextEncoder().encode(s));
const MAX_PRESENTATION_BYTES=12*1024*1024;
// Presentation only. Approval/publication retain the immutable logical HTML.
// The opaque sandbox can display scanned photos without client-session cookies
// or an asset-access token. Never open allow-same-origin to Work scripts.
export async function privatePreviewPresentation({html,artifactSha256,projectRef,requestId,siteRef,modifier}){
 if(await hash(html)!==artifactSha256)throw Error('PREVIEW_LOGICAL_HASH_INVALID');
 let presentation=html;const refs=sitesAssetReferences(html,projectRef);
 if(refs.length&&typeof modifier?.readPreviewAsset!=='function')throw Error('PREVIEW_ASSET_READER_REQUIRED');
 for(const ref of refs){
  const asset=await modifier.readPreviewAsset({request_id:requestId,site_ref:siteRef,sha256:ref.sha256});
  if(asset?.mime!=='image/png'||asset.artifact_sha256!==artifactSha256||asset.locator!==ref.locator||asset.sha256!==ref.sha256||!(asset.bytes instanceof Uint8Array)||await sha256(asset.bytes)!==ref.sha256)throw Error('PREVIEW_ASSET_UNVERIFIED');
  const data='data:image/png;base64,'+base64Bytes(asset.bytes);
  presentation=presentation.replaceAll(ref.locator,()=>data);
  if(new TextEncoder().encode(presentation).length>MAX_PRESENTATION_BYTES)throw Error('PREVIEW_PRESENTATION_TOO_LARGE');
 }
 return {html:presentation,artifact_sha256:artifactSha256,presentation_sha256:await hash(presentation),embedded_assets:refs.length};
}
