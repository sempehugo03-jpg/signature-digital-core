// Read-only Product decision port, called only by the scope-bound Engine bridge.
export function productApprovalReader(db) {
 return {async verify(input) {
  const {principal,change_ref,approval_ref,action}=input;
  if(!principal?.customer_ref||!principal?.project_ref||!['publish','restore'].includes(action))return {approved:false};
  const c=await db.prepare(`SELECT c.* FROM fp_change_requests c JOIN fp_projects p ON p.id=c.project_id
    JOIN fp_subscriptions s ON s.project_id=p.id JOIN fp_activations a ON a.project_id=p.id
    WHERE c.id=? AND c.project_id=? AND c.user_id=p.user_id AND s.state='active'
    AND s.amount=5900 AND s.currency='eur' AND p.status='active'`).bind(change_ref,principal.project_ref).first();
  if(!c||principal.customer_ref!=='customer_'+c.user_id||c.engine_site_ref!==input.site_ref)return {approved:false};
  if(action==='restore'){
   const s=await db.prepare('SELECT * FROM fp_change_restore_consents WHERE request_id=? AND approval_ref=?').bind(change_ref,approval_ref).first();
   return {approved:!!s&&s.user_id===c.user_id&&s.project_id===c.project_id&&s.site_ref===input.site_ref&&['published','rolled_back'].includes(c.status)&&['pending','restoring','restored'].includes(s.state)&&s.target_release_ref===input.release_ref&&s.target_release_ref===c.base_release_ref&&s.target_sha256===input.artifact_sha256&&s.target_sha256===c.base_sha256&&s.expected_release_ref===input.expected_release_ref&&s.expected_release_ref===c.engine_release_id&&s.idempotency_key===input.idempotency_key};
  }
  let preview;try{preview=JSON.parse(c.preview_receipt_json||'null')}catch{}
  const verifiedPreview=preview?.state==='PREVIEW_READY'&&preview?.published===false&&preview?.change_ref===change_ref&&preview?.version_ref===input.version_ref&&preview?.artifact_sha256===input.artifact_sha256&&preview?.site_ref===input.site_ref&&preview?.base_sha256===input.base_sha256;
  return {approved:verifiedPreview&&!!approval_ref&&c.approval_ref===approval_ref&&c.candidate_version_id===input.version_ref&&c.candidate_hash===input.artifact_sha256&&c.base_release_ref===input.base_release_ref&&c.base_sha256===input.base_sha256&&['approved','publishing','published'].includes(c.status)};
 }};
}
