// Read-only verifier of decisions made by the existing Product. No invented
// approval, no credit writes, no payment lookup and no pre-purchase fp_approvals.
export function productApprovalVerifier(db){return {async verify(input){
 if(input.action==='restore'){
  let row;try{row=await db.prepare('SELECT s.*,r.status AS request_status,r.user_id AS request_owner,r.engine_site_ref,r.base_release_ref,r.base_sha256,r.engine_release_id,p.user_id AS project_owner FROM fp_change_restore_consents s JOIN fp_change_requests r ON r.id=s.request_id AND r.project_id=s.project_id JOIN fp_projects p ON p.id=s.project_id WHERE s.request_id=? AND s.approval_ref=?').bind(input.change_ref,input.approval_ref).first();}catch(error){if(/no such table.*fp_change_restore_consents/i.test(error.message))return {approved:false,reason:'PRODUCT_DURABLE_RESTORE_CONSENT_REQUIRED'};throw error;}
  return {approved:!!row&&row.user_id===row.request_owner&&row.user_id===row.project_owner&&input.principal.customer_ref==='customer_'+row.user_id&&input.principal.project_ref===row.project_id&&row.site_ref===input.site_ref&&row.engine_site_ref===input.site_ref&&['published','rolled_back'].includes(row.request_status)&&['pending','restoring','restored'].includes(row.state)&&row.target_release_ref===input.release_ref&&row.target_release_ref===row.base_release_ref&&row.target_sha256===input.artifact_sha256&&row.target_sha256===row.base_sha256&&row.expected_release_ref===input.expected_release_ref&&row.expected_release_ref===row.engine_release_id&&row.idempotency_key===input.idempotency_key};
 }
 const row=await db.prepare('SELECT r.*,p.user_id AS project_owner FROM fp_change_requests r JOIN fp_projects p ON p.id=r.project_id WHERE r.id=? AND r.approval_ref=?').bind(input.change_ref,input.approval_ref).first();
 if(!row||row.user_id!==row.project_owner||input.principal.customer_ref!=='customer_'+row.user_id||input.principal.project_ref!==row.project_id||row.engine_site_ref!==input.site_ref)return {approved:false};
 if(input.action==='publish')return {approved:['approved','publishing','published'].includes(row.status)&&row.candidate_version_id===input.version_ref&&row.candidate_hash===input.artifact_sha256&&row.base_release_ref===input.base_release_ref&&row.base_sha256===input.base_sha256&&!!row.preview_receipt_json};
 return {approved:false};
}};}
