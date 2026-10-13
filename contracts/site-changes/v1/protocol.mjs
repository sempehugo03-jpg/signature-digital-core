/**
 * FABRYA site modification, cross-repository contract.
 * NO implementation-side imports. Product and Engine carry exactly these bytes.
 * Protocol version is deliberately strict: no implicit widening of trust.
 */
export const SITE_CHANGE_PROTOCOL = 'fabrya.site-change.v1.0.0';
export const SITE_CHANGE_STATES = Object.freeze([
  'QUEUED','RUNNING','PREVIEW_READY','AWAITING_CLIENT_APPROVAL',
  'APPROVED','PUBLISHING','PUBLISHED','ROLLING_BACK','ROLLED_BACK',
  'FAILED','CANCELED','RECONCILIATION_REQUIRED','AWAITING_WORK'
]);
export const SITE_CHANGE_METHODS = Object.freeze([
  'quote','submitTask','findTask','getTask','validatePreview','publish',
  'getCurrentRelease','restore','validateRelease'
]);
const ID=/^[A-Za-z0-9_-]{8,160}$/;
const SHA=/^[a-f0-9]{64}$/;
export class ContractError extends Error {
  constructor(code){super(code);this.name='ContractError';this.code=code;}
}
const ensure=(ok,code)=>{if(!ok)throw new ContractError(code);};
export const isOpaqueId=s=>typeof s==='string'&&ID.test(s);
export const isSha=s=>typeof s==='string'&&SHA.test(s);
const safeInt=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const sameKeys=(x,allow)=>Object.keys(x).every(k=>allow.includes(k));
export function validateChangeEnvelope(e) {
  ensure(e&&typeof e==='object'&&!Array.isArray(e),'CHANGE_ENVELOPE_INVALID');
  ensure(e.protocol===SITE_CHANGE_PROTOCOL,'CHANGE_PROTOCOL_INCOMPATIBLE');
  for(const field of ['customer_ref','project_ref','site_ref','change_ref','base_version_ref','base_release_ref','idempotency_key'])
    ensure(isOpaqueId(e[field]),`CHANGE_${field.toUpperCase()}_INVALID`);
  ensure(isSha(e.base_sha256),'CHANGE_BASE_HASH_INVALID');
  ensure(typeof e.message==='string'&&e.message.trim().length>=2&&e.message.length<=2000,'CHANGE_MESSAGE_INVALID');
  ensure(Array.isArray(e.attachments)&&e.attachments.length<=5,'CHANGE_ATTACHMENTS_INVALID');
  for(const a of e.attachments){
    ensure(a&&typeof a==='object'&&sameKeys(a,['file_ref','sha256','mime','byte_size']),'CHANGE_ATTACHMENT_FIELDS');
    ensure(isOpaqueId(a.file_ref)&&isSha(a.sha256),'CHANGE_ATTACHMENT_IDENTITY');
    ensure(typeof a.mime==='string'&&a.mime.length<=120&&safeInt(a.byte_size,1,8*1024*1024),'CHANGE_ATTACHMENT_METADATA');
    // Never transmit private URLs, raw file content, bearer tokens or customer email.
  }
  ensure(sameKeys(e,['protocol','customer_ref','project_ref','site_ref','change_ref','base_version_ref','base_release_ref','base_sha256','idempotency_key','message','attachments','requested_at']), 'CHANGE_UNEXPECTED_FIELDS');
  ensure(typeof e.requested_at==='string'&&Number.isFinite(Date.parse(e.requested_at)),'CHANGE_REQUEST_TIME');
  return e;
}
export function validateQuote(q,e) {
  validateChangeEnvelope(e);
  ensure(q?.protocol===SITE_CHANGE_PROTOCOL&&q.change_ref===e.change_ref,'QUOTE_CONTEXT');
  ensure(q.site_ref===e.site_ref&&q.base_version_ref===e.base_version_ref&&q.base_sha256===e.base_sha256,'QUOTE_BASE_MISMATCH');
  ensure(safeInt(q.estimated_cost_microeur,0,1000000000)&&safeInt(q.max_cost_microeur,q.estimated_cost_microeur,1000000000),'QUOTE_COST');
  ensure(typeof q.cost_basis==='string'&&q.cost_basis.length>5&&q.cost_basis.length<=250,'QUOTE_PROVENANCE');
  return q;
}
export function validateEngineTask(task,e) {
  validateChangeEnvelope(e);
  ensure(task?.protocol===SITE_CHANGE_PROTOCOL&&task.change_ref===e.change_ref&&task.site_ref===e.site_ref,'TASK_CONTEXT');
  ensure(isOpaqueId(task.engine_task_ref)&&SITE_CHANGE_STATES.includes(task.state),'TASK_STATUS');
  return task;
}
export function validatePreviewReceipt(receipt,e) {
  validateChangeEnvelope(e);
  ensure(receipt?.protocol===SITE_CHANGE_PROTOCOL&&receipt.change_ref===e.change_ref&&receipt.site_ref===e.site_ref,'PREVIEW_CONTEXT');
  ensure(receipt.base_version_ref===e.base_version_ref&&receipt.base_sha256===e.base_sha256,'PREVIEW_BASE');
  ensure(isOpaqueId(receipt.version_ref)&&isSha(receipt.artifact_sha256),'PREVIEW_VERSION');
  ensure(receipt.state==='PREVIEW_READY'&&receipt.published===false,'PREVIEW_NOT_A_PUBLICATION');
  ensure(typeof receipt.preview_locator==='string'&&receipt.preview_locator.length<500,'PREVIEW_LOCATOR');
  return receipt;
}
export function validatePublicationReceipt(receipt,e,preview) {
  validatePreviewReceipt(preview,e);
  ensure(receipt?.protocol===SITE_CHANGE_PROTOCOL&&receipt.change_ref===e.change_ref&&receipt.site_ref===e.site_ref,'PUBLISH_CONTEXT');
  ensure(receipt.state==='PUBLISHED'&&isOpaqueId(receipt.release_ref),'PUBLISH_STATE');
  ensure(receipt.version_ref===preview.version_ref&&receipt.artifact_sha256===preview.artifact_sha256,'PUBLISH_VERSION');
  ensure(receipt.previous_release_ref===e.base_release_ref,'PUBLISH_PREVIOUS_RELEASE');
  ensure(typeof receipt.verified_public_url==='string'&&receipt.verified_public_url.length<500,'PUBLISH_URL');
  // Receipt shape != proof. The Product must independently query Engine release truth.
  return receipt;
}
export function validateRollbackReceipt(receipt,e,publication) {
  ensure(receipt?.protocol===SITE_CHANGE_PROTOCOL&&receipt.change_ref===e.change_ref,'ROLLBACK_CONTEXT');
  ensure(receipt.state==='ROLLED_BACK'&&receipt.release_ref===e.base_release_ref,'ROLLBACK_TARGET');
  ensure(receipt.from_release_ref===publication.release_ref,'ROLLBACK_PREVIOUS');
  return receipt;
}
export function validateModifierAdapter(adapter) {
  ensure(adapter?.kind==='authenticated-site-modifier','ADAPTER_AUTH_REQUIRED');
  for(const method of SITE_CHANGE_METHODS)ensure(typeof adapter[method]==='function','ADAPTER_MISSING_'+method);
  return adapter;
}