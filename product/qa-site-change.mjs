import {sha256} from '../engine/postpurchase/auth.mjs';
import {digest,fail} from './contract.mjs';
import {ORIGINAL_QA} from './qa-access-recovery.mjs';
import {qaCreditPolicy} from './qa-credit-policy.mjs';
// Server QA orchestration, using normal client login and exactly the UI routes.
// This is hosted HTTP evidence, never a claimed browser click or visual QA.
export async function qaSiteChange({db,env,tag,call,data,checks,photograph=false,service=false}) {
 if((service?tag!=='B':tag!=='A')||!qaCreditPolicy(env))fail('QA_POLICY_REQUIRED','Politique TEST isolée requise.',403);
 const t=ORIGINAL_QA[tag],other=ORIGINAL_QA[tag==='A'?'B':'A'],b='/api/product/projects/'+t.project,check=(name,pass,extra={})=>{checks.push({name,pass,...extra});if(!pass)fail('QA_SITE_CHANGE_FAILED',name,409);};
 const kind=service?'service':photograph?'photo':'hours';
 const key='qa_'+kind+'_recovery_20261013_v1',message=service?'Modifie prestation entretien par « Entretien expliqué avant chaque intervention. »':photograph?'Remplace photo atelier par cette photographie':'Modifie horaire ouverture par 08:30';
 let attachments=[];
 let existing=await db.prepare('SELECT * FROM fp_change_requests WHERE project_id=? AND request_key=?').bind(t.project,key).first();
 if(!existing){
 if(photograph){
 const originalPhoto=env.FABRYA_QA_ORIGINAL_A_PHOTO_BASE64;
 if(typeof originalPhoto!=='string'||!originalPhoto.trim())fail('QA_PHOTO_UNAVAILABLE','Photographie QA conservée indisponible.',503);
 const bytes=Uint8Array.from(atob(originalPhoto.trim()),c=>c.charCodeAt(0));

 check('retained_A_photo_hash',await sha256(bytes)==='a48a1ededc16800c7ce0d578aa50fffe6cc62dc703983b44b55c3ecc840d69ac');
 const upload=await data(b+'/change-files','POST',bytes);check('original_A_photo_uploaded_and_scanned',upload.status==='clean',{attachment_ref:upload.id,source_bytes:bytes.length});attachments=[upload.id];
 }
 await data(b+'/changes','POST',{request_key:key,message,attachments});existing=await db.prepare('SELECT * FROM fp_change_requests WHERE project_id=? AND request_key=?').bind(t.project,key).first();}
 check('retained_request',!!existing,{change_ref:existing?.id,status:existing?.status});
 if(['reserved','processing','awaiting_engine'].includes(existing.status)){await data(b+'/changes','POST',{request_key:key,message,attachments:JSON.parse(existing.attachment_ids_json)});existing=await db.prepare('SELECT * FROM fp_change_requests WHERE id=?').bind(existing.id).first();}
 check('candidate_ready',['preview_ready','approved','publishing','published','rolled_back'].includes(existing.status));
 {const preview=await call(b+'/changes/'+existing.id+'/preview'),html=await preview.text(),presentationSha=await digest(html);
 const artifactSha=preview.headers.get('x-fabrya-artifact-sha256')||presentationSha;
 const announcedPresentation=preview.headers.get('x-fabrya-preview-presentation-sha256')||presentationSha;
 check('real_private_preview',preview.status===200&&artifactSha===existing.candidate_hash&&announcedPresentation===presentationSha&&(service?html.includes('Entretien expliqué avant chaque intervention.'):photograph?html.includes('data:image/png;base64,'):html.includes('08:30')),{http:preview.status,artifact_sha256:artifactSha,presentation_sha256:presentationSha,historical:existing.status==='rolled_back'});}
 const before=await data(b+'/credits');
 if(existing.status!=='rolled_back'){
  const published=await data(b+'/changes/'+existing.id+'/acknowledge','POST',{version_id:existing.candidate_version_id});
  check('published_and_readback_verified',published.status==='published',published);
  const retry=await data(b+'/changes/'+existing.id+'/acknowledge','POST',{version_id:existing.candidate_version_id});check('publication_retry_no_double_debit',retry.status==='published'&&retry.charged===published.charged&&retry.duplicate===true);
  const restored=await data(b+'/changes/'+existing.id+'/restore','POST',{target_release_ref:existing.base_release_ref,request_key:'qa_restore_'+kind+'_20261013_v1'});
  check('original_release_restored',restored.status==='rolled_back'&&restored.release_ref===existing.base_release_ref,restored);
  const again=await data(b+'/changes/'+existing.id+'/restore','POST',{target_release_ref:existing.base_release_ref,request_key:'qa_restore_'+kind+'_20261013_v1'});check('restore_retry_no_new_charge',again.status==='rolled_back'&&again.duplicate===true);
 }
 const after=await data(b+'/credits'),saved=await db.prepare('SELECT * FROM fp_change_requests WHERE id=?').bind(existing.id).first();
 const settlement=await db.prepare("SELECT COUNT(*) n,SUM(charged) charged FROM fp_credit_holds WHERE request_id=? AND state='settled'").bind(saved.id).first();
 check('one_settlement',saved.status==='rolled_back'&&saved.credits_charged===1&&saved.credits_held===0&&settlement.n===1&&settlement.charged===1&&after.reserved===0,{available:after.monthly_available,charged:saved.credits_charged});

 // Authenticate B independently; do not manufacture its session or principal.
 const account=await db.prepare('SELECT email FROM sd_platform_users WHERE id=?').bind(other.user).first();let cookie='';
 const foreign=async(path,method='GET',body)=>{const r=await env.FABRYA_QA_PRODUCT_FETCH(new Request('https://fabrya-product-qa.sempehugo03.chatgpt.site'+path,{method,headers:{origin:'https://fabrya-product-qa.sempehugo03.chatgpt.site',cookie,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));const c=r.headers.get('set-cookie')?.match(/fabrya_session=[^;,]+/);if(c)cookie=c[0];return r;};
 try{
  const otherTag=tag==='A'?'B':'A';
  const login=await foreign('/api/product/auth/login','POST',{email:account.email,password:env['FABRYA_QA_ORIGINAL_'+otherTag+'_PASSWORD']});check('normal_'+otherTag+'_login',login.ok&&(await login.json()).user.id===other.user);
  for(const [suffix,method,body] of [['/preview','GET'],['/acknowledge','POST',{version_id:saved.candidate_version_id}],['/restore','POST',{target_release_ref:saved.base_release_ref,request_key:'foreign_restore_probe_v1'}]]){const r=await foreign(b+'/changes/'+saved.id+suffix,method,body);check(otherTag+'_foreign_'+suffix.slice(1)+'_refused',r.status===404,{http:r.status});}
  const r=await foreign(b+'/changes','POST',{request_key:'foreign_request_probe_v1',message,attachments:[]});check(otherTag+'_foreign_request_refused',r.status===404,{http:r.status});
 }finally{if(cookie)await foreign('/api/product/auth/logout','POST',{});}
 return {status:'PASS',scope:'original-A/B-hosted-routes',browser_observed:false,photograph,service,owner_tag:tag,photo_source:photograph?'A retained master PNG; format/asset replacement, same scene':null,change_ref:saved.id,preview_url:b+'/changes/'+saved.id+'/preview',candidate_sha256:saved.candidate_hash,restored_sha256:saved.base_sha256,checks,credits:after,policy_scope:'isolated-test',hosting_invoice_cost_known:false};
}
