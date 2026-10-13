import {migrateImages,privateImageStorage,photographScanner,readSafePhotograph} from './images.mjs';
import {sha256} from './auth.mjs';
const check=(ok,code)=>{if(!ok)throw Error(code);};
// Hosted storage/decoder probe with real source photograph bytes. No Product
// identity, subscription, request, approval or credit row is created here.
export async function privateImageProbe(db,photoBytes){
 await migrateImages(db);const run='photo_'+crypto.randomUUID().replaceAll('-',''),A={project_ref:run+'_project_A',user_ref:run+'_user_A'},B={project_ref:run+'_project_B',user_ref:run+'_user_B'},key='client-change-quarantine/'+A.project_ref+'/file_'+run;
 const a=privateImageStorage({db,...A}),b=privateImageStorage({db,...B}),scanner=photographScanner(db),raw=new Uint8Array(photoBytes),sha=await sha256(raw),started=performance.now();
 await a.put(key,raw);const reloaded=new Uint8Array(await (await a.get(key)).arrayBuffer());check(await sha256(reloaded)===sha,'HOSTED_IMAGE_STORAGE_HASH');
 check(await scanner.verifySafe({bytes:reloaded,mime:'image/png',sha256:sha}),'HOSTED_IMAGE_SCAN_FAILED');const row=await db.prepare('SELECT * FROM fm_image_checks WHERE sha256=? AND mime=?').bind(sha,'image/png').first(),safe=await readSafePhotograph(db,{...A,sha256:row.safe_sha256});
 check(await sha256(safe.bytes)===row.safe_sha256,'HOSTED_SAFE_IMAGE_HASH');let foreign=false;try{await b.get(key);}catch(error){foreign=error.message==='ENGINE_IMAGE_SCOPE';}check(foreign,'HOSTED_IMAGE_OWNER_FAILURE');let foreignSafe=false;try{await readSafePhotograph(db,{...B,sha256:row.safe_sha256});}catch(error){foreignSafe=error.message==='ENGINE_IMAGE_NOT_FOUND';}check(foreignSafe,'HOSTED_SAFE_IMAGE_OWNER_FAILURE');
 check(!await scanner.verifySafe({bytes:raw.slice(0,120),mime:'image/png'}),'HOSTED_TRUNCATED_IMAGE_ACCEPTED');check(!await scanner.verifySafe({bytes:raw,mime:'image/svg+xml'}),'HOSTED_ACTIVE_TYPE_ACCEPTED');check(!await scanner.verifySafe({bytes:raw,mime:'image/png',sha256:'0'.repeat(64)}),'HOSTED_IMAGE_WRONG_HASH_ACCEPTED');
 const proof={run_ref:run,environment:'HOSTED_PRIVATE_D1_PHOTOGRAPH',storage:'existing-private-D1-chunked',source_sha256:sha,safe_sha256:row.safe_sha256,source_bytes:raw.length,safe_bytes:safe.bytes.length,width:safe.proof.width,height:safe.proof.height,scan_method:safe.proof.scan_method,checks:{source_bytes_stored_and_reloaded:true,raster_decoded_and_reencoded:true,safe_hash_reread:true,B_source_read_refused:foreign,B_safe_image_read_refused:foreignSafe,truncated_image_refused:true,active_type_refused:true,incorrect_hash_refused:true},elapsed_ms:performance.now()-started,provider_calls:0,Product_upload_journey_verified:false,publication_verified:false,scope:A};
 await db.prepare('INSERT INTO fm_events(change_ref,event,created_at) VALUES(?,?,?)').bind(run,JSON.stringify({type:'PRIVATE_PHOTO_PROOF',proof}),Date.now()).run();return proof;
}
