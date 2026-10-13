import test from 'node:test';
import assert from 'node:assert/strict';
import {privatePreviewPresentation} from '../../product/private-preview-presentation.mjs';
import {sha256} from '../../engine/postpurchase/auth.mjs';
const hash=s=>sha256(new TextEncoder().encode(s));
test('sandbox photo presentation embeds only the verified task-owned bytes; logical and served hashes remain distinct',async()=>{
 const bytes=Uint8Array.of(137,80,78,71,13,10,26,10),sha=await sha256(bytes),locator='/engine/assets/project_preview01/'+sha+'.png';
 const html='<script>const vehicleAsset="'+locator+'";</script>',artifactSha256=await hash(html);
 const input={html,artifactSha256,projectRef:'project_preview01',requestId:'change_preview01',siteRef:'site_preview001'};
 let seen;
 const modifier={async readPreviewAsset(args){seen=args;return {bytes,mime:'image/png',sha256:sha,locator,artifact_sha256:artifactSha256};}};
 const result=await privatePreviewPresentation({...input,modifier});
 assert.deepEqual(seen,{request_id:input.requestId,site_ref:input.siteRef,sha256:sha});
 assert.match(result.html,/data:image\/png;base64,/);assert.ok(!result.html.includes('/engine/assets/'));
 assert.equal(result.artifact_sha256,artifactSha256);assert.equal(result.presentation_sha256,await hash(result.html));assert.notEqual(result.presentation_sha256,artifactSha256);
 await assert.rejects(privatePreviewPresentation({...input,modifier:{readPreviewAsset:async()=>({...await modifier.readPreviewAsset({}),bytes:Uint8Array.of(1)})}}),/PREVIEW_ASSET_UNVERIFIED/);
 await assert.rejects(privatePreviewPresentation({...input,modifier:null}),/PREVIEW_ASSET_READER_REQUIRED/);
 const foreign=html.replace('project_preview01','project_foreign01');
 await assert.rejects(privatePreviewPresentation({...input,html:foreign,artifactSha256:await hash(foreign),modifier}),/SITE_ASSET_SCOPE/);
});
test('text-only previews preserve their exact original bytes and hash',async()=>{
 const html='<p>Ouverture : 08:30</p>',artifactSha256=await hash(html);
 const result=await privatePreviewPresentation({html,artifactSha256,projectRef:'project_preview01'});
 assert.equal(result.html,html);assert.equal(result.artifact_sha256,result.presentation_sha256);assert.equal(result.embedded_assets,0);
});
