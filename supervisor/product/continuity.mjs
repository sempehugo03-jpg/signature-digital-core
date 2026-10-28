// One bounded, read-only continuity task on the existing supervisor and state.
// No model/API generation, cross-repository credentials, deployment or customer effects.
export function prepareContinuityProbe(state, requestId) {
 if(!/^[a-z0-9-]{1,80}$/.test(requestId))throw new Error('CONTINUITY_REQUEST_INVALID');
 if(state.proof.request_id===requestId || state.current_action)return false;
 const previous=state.proof;
 if(!['PASS','PENDING'].includes(previous.status))return false;
 const {history=[],...receipt}=previous;
 state.proof={status:'PENDING',action:'READ_ONLY_REPOSITORY_PROBE',request_id:requestId,effect_count:0,recovery_count:0,history:[...history,receipt]};
 return true;
}
export async function integrationConnection(request,token) {
 // Probe exactly the canonical registry endpoint. Do not parse or publish its private body.
 // No arbitrary URL, redirect, write, new credential or cross-repository mutation is allowed.
 const result={status:'BLOCKED_PRIVATE_REGISTRY_IDENTITY',http_status:0,consumer:'EXISTING_PRODUCT_SUPERVISOR',additional_spend_eur:0,automatic_publication:false,source_read:false,private_receipt_sink_required:true};
 if(!token)return result;
 try{
  const response=await request('https://api.github.com/repos/sempehugo03-jpg/fabrya-engine/contents/docs/agent-governance/factory/registry.json?ref=infra%2Ffactory-20261016',{
   method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
  });
  result.http_status=response.status;
  if(response.body)await response.body.cancel();
  if(response.status===200)result.status='BLOCKED_PRIVATE_RECEIPT_SINK_REQUIRED';
  else if(![401,403,404].includes(response.status))result.status='BLOCKED_INTEGRATION_TRANSPORT';
 }catch{result.status='BLOCKED_INTEGRATION_TRANSPORT';}
 return result;
}
