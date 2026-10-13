// TEST-ONLY reference Engine for cross-repository conformance.
// Writes and serves actual static HTML on localhost, never accesses real customer hosting.
import {mkdtemp,readFile,writeFile,rename,rm,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {SITE_CHANGE_PROTOCOL,validateChangeEnvelope,validateQuote} from '../../contracts/site-changes/v1/protocol.mjs';
export const hash=s=>createHash('sha256').update(s).digest('hex');
const gate=(x,msg)=>{if(!x)throw Error(msg)};
const readBytes=path=>readFile(path);
export async function createReferenceEngine(){
 const root=await mkdtemp(join(tmpdir(),'fabrya-change-v1-'));
 const site=join(root,'site');const previews=join(root,'previews');await mkdir(site);await mkdir(previews);
 const published=join(site,'index.html');
 const baseline='<!doctype html><html lang="fr"><meta charset="utf-8"><title>Atelier du Pic</title><h1>Bienvenue dans notre atelier.</h1><p>Travaux de menuiserie.</p></html>';
 await writeFile(published,baseline);
 const site_ref='site_atelier_pic',base_version_ref='version_initial01',base_release_ref='release_initial01';
 let current={site_ref,version_ref:base_version_ref,release_ref:base_release_ref,sha256:hash(baseline),change_ref:null};
 const history=new Map([[base_release_ref,{...current,html:baseline}]]);
 const tasks=new Map();
 const server=createServer(async(req,res)=>{
  if(req.url==='/'||req.url==='/index.html'){
   res.setHeader('content-type','text/html; charset=utf-8');res.setHeader('cache-control','no-store');res.end(await readFile(published));return;
  }
  if(/^\/private-preview\/chg_[a-f0-9]{32}$/.test(req.url||'')){
   // Fixture-only owner-private token is an exact static value; no production auth assertion.
   if(req.headers['x-reference-owner']!=='fixture-owner'){res.statusCode=401;res.end('Unauthorized');return;}
   const id=req.url.split('/').at(-1),t=tasks.get(id);
   if(!t){res.statusCode=404;res.end();return;}
   res.setHeader('content-type','text/html; charset=utf-8');res.end(await readFile(t.preview_path));return;
  }
  res.statusCode=404;res.end('Not found');
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const address=server.address(); const origin=`http://127.0.0.1:${address.port}`;
 const adapter={
  kind:'authenticated-site-modifier',
  async getCurrentRelease({site_ref:given}={}){
   if(given&&given!==site_ref)throw Error('ENGINE_SITE_SCOPE');
   const bytes=await readBytes(published);gate(hash(bytes)===current.sha256,'ENGINE_LIVE_HASH_MISMATCH');
   return {...current};
  },
  async quote(envelope){
   validateChangeEnvelope(envelope);
   gate(envelope.site_ref===site_ref&&envelope.base_version_ref===current.version_ref&&envelope.base_sha256===current.sha256,'QUOTE_SITE_BASE');
   const q={protocol:SITE_CHANGE_PROTOCOL,change_ref:envelope.change_ref,site_ref,base_version_ref:current.version_ref,base_sha256:current.sha256,
     estimated_cost_microeur:850000,max_cost_microeur:1500000,cost_basis:'fixture-static-html-code-review-and-local-render'};
   return validateQuote(q,envelope);
  },
  async findTask({change_ref}={}){let t=tasks.get(change_ref);return t?{change_ref,engine_task_ref:t.task_ref,state:t.state}:null},
  async submitTask({change_ref,site_ref:given,base_version_ref,base_release_ref:expected,base_sha256,message,idempotency_key,...rest}){
   validateChangeEnvelope({change_ref,site_ref:given,base_version_ref,base_release_ref:expected,base_sha256,message,idempotency_key,...rest});
   gate(given===site_ref&&current.release_ref===expected&&current.version_ref===base_version_ref&&current.sha256===base_sha256,'EDIT_VERSION_CONFLICT');
   const existing=tasks.get(change_ref);if(existing){gate(existing.key===idempotency_key,'EDIT_IDEMPOTENCY_CONFLICT');return {change_ref,engine_task_ref:existing.task_ref,state:existing.state}};
   // Intentionally constrained reference operation: one exact test phrase changes a real HTML H1.
   gate(message==='Remplacer le titre par Atelier du Pic — ébénisterie sur mesure.','ENGINE_REFERENCE_UNSUPPORTED_CHANGE');
   const before=(await readFile(published,'utf8'));
   gate(before.includes('<h1>Bienvenue dans notre atelier.</h1>'),'ENGINE_EXPECTED_FRAGMENT_MISSING');
   const after=before.replace('<h1>Bienvenue dans notre atelier.</h1>','<h1>Atelier du Pic — ébénisterie sur mesure.</h1>');
   gate(after!==before,'ENGINE_EMPTY_MODIFICATION');
   const version_ref='version_'+hash(after).slice(0,18);
   const preview_path=join(previews,change_ref+'.html');await writeFile(preview_path,after);
   const t={task_ref:'task_'+hash(change_ref).slice(0,18),key:idempotency_key,change_ref,site_ref,state:'PREVIEW_READY',before,after,preview_path,
      base_version_ref,base_release_ref:expected,base_sha256,version_ref,sha256:hash(after),release_ref:null};
   tasks.set(change_ref,t);
   return {change_ref,engine_task_ref:t.task_ref,state:t.state};
  },
  async getTask({change_ref}){let t=tasks.get(change_ref);return t?{change_ref,state:t.state,version_ref:t.version_ref,engine_task_ref:t.task_ref}:null},
  async validatePreview({request_id,site_ref:given,receipt}){
   const t=tasks.get(request_id);gate(t&&given===site_ref,'ENGINE_PREVIEW_NOT_FOUND');
   const raw=await readFile(t.preview_path);
   gate(hash(raw)===t.sha256,'ENGINE_PREVIEW_BYTES_CHANGED');
   const data={protocol:SITE_CHANGE_PROTOCOL,site_ref,change_ref:request_id,base_version_ref:t.base_version_ref,base_sha256:t.base_sha256,
     version_ref:t.version_ref,artifact_sha256:t.sha256,state:'PREVIEW_READY',published:false,preview_locator:`/private-preview/${request_id}`};
   if(receipt){gate(receipt.version_ref===data.version_ref&&receipt.artifact_sha256===data.artifact_sha256,'ENGINE_PREVIEW_RECEIPT_CHANGED');}
   return data;
  },
  async publish({change_ref,site_ref:given,version_ref,artifact_sha256,expected_release_ref,approval_ref,idempotency_key}){
   const t=tasks.get(change_ref);gate(t&&given===site_ref&&t.version_ref===version_ref&&t.sha256===artifact_sha256,'ENGINE_PUBLISH_CONTEXT');
   gate(approval_ref==='approval_'+change_ref&&idempotency_key===t.key,'ENGINE_CLIENT_APPROVAL_REQUIRED');
   if(t.state==='PUBLISHED')return adapter.validateRelease({change_ref,release_ref:t.release_ref});
   gate(current.release_ref===expected_release_ref&&expected_release_ref===t.base_release_ref,'ENGINE_CONCURRENT_DEPLOY');
   const tmp=join(site,'.next-'+t.version_ref+'.html');await writeFile(tmp,t.after);await rename(tmp,published);
   const release_ref='release_'+t.sha256.slice(0,18);
   current={site_ref,release_ref,version_ref:t.version_ref,sha256:t.sha256,change_ref};
   history.set(release_ref,{...current,html:t.after});t.release_ref=release_ref;t.state='PUBLISHED';
   return adapter.validateRelease({change_ref,release_ref});
  },
  async validateRelease({change_ref,release_ref}){
   const record=history.get(release_ref);gate(record,'ENGINE_RELEASE_NOT_FOUND');
   const publishedHtml=await fetch(origin+'/index.html',{cache:'no-store'}).then(r=>r.text());
   gate(hash(publishedHtml)===record.sha256&&current.release_ref===release_ref,'ENGINE_HTTP_PUBLICATION_NOT_VERIFIED');
   return {protocol:SITE_CHANGE_PROTOCOL,site_ref,change_ref,state:'PUBLISHED',release_ref,version_ref:record.version_ref,
    artifact_sha256:record.sha256,previous_release_ref:base_release_ref,verified_public_url:origin+'/index.html',actual_cost_microeur:1500000,verified:true};
  },
  async restore({change_ref,site_ref:given,target_release_ref,expected_release_ref,approval_ref,idempotency_key}){
   gate(given===site_ref&&target_release_ref===base_release_ref,'ENGINE_RESTORE_TARGET');
   gate(typeof approval_ref==='string'&&approval_ref.length>=8&&idempotency_key==='rollback_'+change_ref,'ENGINE_RESTORE_APPROVAL');
   if(current.release_ref===base_release_ref)return {protocol:SITE_CHANGE_PROTOCOL,site_ref,change_ref,state:'ROLLED_BACK',
     release_ref:base_release_ref,from_release_ref:expected_release_ref,verified:true};
   gate(current.release_ref===expected_release_ref,'ENGINE_RESTORE_CONFLICT');
   const original=history.get(base_release_ref);const tmp=join(site,'.restore-index.html');await writeFile(tmp,original.html);await rename(tmp,published);
   current={site_ref,version_ref:original.version_ref,release_ref:base_release_ref,sha256:original.sha256,change_ref:null};
   gate(hash(await readFile(published))===original.sha256,'ENGINE_RESTORE_HASH');
   return {protocol:SITE_CHANGE_PROTOCOL,site_ref,change_ref,state:'ROLLED_BACK',release_ref:base_release_ref,from_release_ref:expected_release_ref,verified:true};
  }
 };
 return {adapter,root,origin,published,site_ref,close:async()=>{await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true})}};
}