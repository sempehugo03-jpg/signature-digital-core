// A real owner-private draft may be delivered for the customer's examination.
// It never certifies visual QA or authorizes Checkout.
export function workDeliveryQualification(proof,artifactHash){
 if(proof?.artifact_sha256!==artifactHash)throw Error('REAL_QA_REQUIRED');
 if(proof.delivery_mode==='preview_only'){
  if(!['PASS','NOT_VERIFIED'].includes(proof.desktop?.status)||!['PASS','NOT_VERIFIED'].includes(proof.mobile?.status))throw Error('PREVIEW_QUALIFICATION_INVALID');
  return 'preview_only';
 }
 if(proof.desktop?.status!=='PASS'||proof.mobile?.status!=='PASS')throw Error('REAL_QA_REQUIRED');
 return 'verified';
}
