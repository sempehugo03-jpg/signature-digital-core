// Server-only verifier to inject into the Engine's productApproval dependency.
// No client route; the transport must authenticate the Engine before invoking it.
export function productApprovalReader(db) {
  return {async verify({principal,change_ref,approval_ref,version_ref,artifact_sha256,action}) {
    if(action!=='publish'||!principal?.customer_ref||!principal?.project_ref) return {approved:false};
    const c=await db.prepare(`SELECT c.* FROM fp_change_requests c JOIN fp_projects p ON p.id=c.project_id
      JOIN fp_subscriptions s ON s.project_id=p.id JOIN fp_activations a ON a.project_id=p.id
      WHERE c.id=? AND c.project_id=? AND c.user_id=p.user_id AND s.state='active'
      AND s.amount=5900 AND s.currency='eur' AND p.status='active'`).bind(change_ref,principal.project_ref).first();
    let preview;try{preview=JSON.parse(c?.preview_receipt_json||'null')}catch{}
    const verifiedPreview=preview?.state==='PREVIEW_READY'&&preview?.published===false&&preview?.change_ref===change_ref&&preview?.version_ref===version_ref&&preview?.artifact_sha256===artifact_sha256;
    const approved=verifiedPreview&&!!c&&principal.customer_ref==='customer_'+c.user_id&&c.approval_ref===approval_ref&&
      !!approval_ref&&c.candidate_version_id===version_ref&&c.candidate_hash===artifact_sha256&&
      !!c.preview_receipt_json&&['approved','publishing'].includes(c.status);
    return {approved};
  }};
}
