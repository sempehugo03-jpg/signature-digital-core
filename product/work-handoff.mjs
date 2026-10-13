// Preparation only: not imported by any deployed Worker. No AI or network calls.
export const WORK_EVENT = Object.freeze({
  name: 'fabrya.demo.requested',
  description: 'A persisted FABRYA demo request awaits direct Work creation.',
  delivery: ['webhook'],
  inputSchema: {type:'object',properties:{queue_id:{type:'string'}},required:['queue_id'],additionalProperties:false},
  payloadSchema: {type:'object',properties:{request_id:{type:'string'},attempt:{type:'integer',minimum:1}},required:['request_id','attempt'],additionalProperties:false},
});
const bad = code => { throw new Error(code); };
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,180}$/.test(value);
const opaque = value => typeof value === 'string' && value.length > 0 && value.length <= 300 && !/[\s\x00-\x1f]/.test(value);
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const stable = value => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]))
  : Array.isArray(value) ? value.map(stable) : value;
export async function hash(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(stable(value)));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
}

// principal, project, job and ledger must come from authenticated server storage.
// No owner or budget may be taken from browser input or event payloads.
export async function prepareWorkRequest({principal,project,job,ledger,method,created_at}) {
  if(!id(principal?.id)||project?.user_id!==principal.id||job?.project_id!==project?.id)bad('WORK_OWNER_MISMATCH');
  if(!id(project.id)||!id(job.id)||!id(job.version_id)||!Number.isInteger(job.attempt)||job.attempt<1)bad('WORK_JOB_INVALID');
  if(job.status!=='queued')bad('WORK_JOB_NOT_QUEUED');
  if(!Number.isSafeInteger(ledger?.cap_micro_eur)||ledger.cap_micro_eur!==55000000||!Number.isSafeInteger(ledger?.engaged_micro_eur)||ledger.engaged_micro_eur<0||ledger.engaged_micro_eur>ledger.cap_micro_eur)bad('WORK_BUDGET_INVALID');
  if(method?.name!=='fabrya-creation-work'||!sha(method.sha256))bad('WORK_METHOD_UNPINNED');
  if(!Number.isFinite(Date.parse(created_at)))bad('WORK_TIMESTAMP_INVALID');
  const brief=job.input_snapshot;
  if(!brief||typeof brief!=='object'||Array.isArray(brief))bad('WORK_BRIEF_INVALID');
  const request={schema:1,request_id:job.id,project_id:project.id,owner_id:principal.id,version_id:job.version_id,attempt:job.attempt,created_at,brief:structuredClone(brief),brief_sha256:await hash(brief),method:structuredClone(method),budget:structuredClone(ledger),target_seconds:600};
  request.idempotency_key=await hash({owner_id:request.owner_id,project_id:request.project_id,request_id:request.request_id,version_id:request.version_id,attempt:request.attempt,brief_sha256:request.brief_sha256,method_sha256:request.method.sha256});
  return request;
}

export function connectionGate(capabilities={}) {
  const required=['authenticated_fabrya_mcp','verified_work_subscription','durable_queue','owner_bound_completion','visual_browser','authoritative_budget','client_demo_access'];
  const missing=required.filter(k=>capabilities[k]!==true);
  return {connected:missing.length===0,missing};
}
export function requireWorkConnection(capabilities) {
  const gate=connectionGate(capabilities);
  if(!gate.connected)bad('WORK_NOT_CONNECTED:'+gate.missing.join(','));
}

// This validates the shape of a trusted receipt, not its authenticity or pixels.
// Future MCP auth + durable CAS writes must enforce those before using this function.
export function validateWorkReceipt(request,receipt) {
  for(const field of ['request_id','owner_id','project_id','version_id','attempt','brief_sha256'])if(receipt?.[field]!==request[field])bad('WORK_RECEIPT_MISMATCH:'+field);
  if(receipt.source!=='work'||receipt.mock!==false||!sha(receipt.artifact_sha256))bad('WORK_ARTIFACT_UNVERIFIED');
  if(!id(receipt.demo_project_id)||!opaque(receipt.saved_version_id))bad('WORK_DEMO_ID_INVALID');
  if(!Number.isFinite(Date.parse(receipt.started_at))||!Number.isFinite(Date.parse(receipt.completed_at))||Date.parse(receipt.completed_at)<Date.parse(receipt.started_at))bad('WORK_DURATION_INVALID');
  const target=new URL(receipt.demo_url);
  if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||!target.hostname.endsWith('.chatgpt.site'))bad('WORK_DEMO_URL_INVALID');
  for(const format of ['desktop','mobile']){
    const proof=receipt.qa?.[format];
    if(proof?.status!=='PASS'||proof.artifact_sha256!==receipt.artifact_sha256||!sha(proof.capture_sha256)||!id(proof.provenance_id))bad('WORK_PIXELS_UNVERIFIED:'+format);
  }
  if(receipt.commercial_signature?.verdict!=='VALIDATED'||!receipt.commercial_signature.objective||!receipt.commercial_signature.expected_action)bad('WORK_SIGNATURE_UNVERIFIED');
  if(receipt.client_access_verified!==true)bad('WORK_CLIENT_ACCESS_UNVERIFIED');
  return {ready:true,creation_seconds:(Date.parse(receipt.completed_at)-Date.parse(receipt.started_at))/1000};
}
