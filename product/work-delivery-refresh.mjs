import {digest} from './contract.mjs';
import {initializeConversation} from './conversation.mjs';
export async function initializeWorkRevisions(db){await db.prepare(`CREATE TABLE IF NOT EXISTS fp_work_delivery_revisions(version_id TEXT PRIMARY KEY,request_id TEXT NOT NULL,previous_version_id TEXT NOT NULL,artifact_hash TEXT NOT NULL,site_version_id TEXT NOT NULL,receipt_json TEXT NOT NULL,created_at TEXT NOT NULL)`).run();}
// Product-owned append only import: same request, same job and owner, fresh version.
// Original artifacts, receipts and immutable delivery provenance are never rewritten.
export async function refreshWorkDelivery({db,row,args,proof,readback}){
 await initializeWorkRevisions(db);
 const link=await db.prepare(`SELECT l.*,p.status,p.user_id AS actual_user FROM fp_work_product_links l JOIN fp_projects p ON p.id=l.project_id WHERE l.request_id=?`).bind(row.id).first();
 const bound=await db.prepare('SELECT * FROM fp_work_site_bindings WHERE request_id=?').bind(row.id).first();
 if(!link||!bound||link.actual_user!==link.user_id||proof.product_user_id!==link.user_id||proof.product_project_id!==link.project_id||proof.request_id!==row.id||args.site_project_id!==bound.site_project_id||new URL(args.demo_url).href!==new URL(bound.demo_url).href)throw Error('REVISION_SCOPE_REFUSED');
 const original=JSON.parse(row.result),hash=await digest(proof.artifact_html||'');
 if(typeof proof.artifact_html!=='string'||!proof.artifact_html.startsWith('<!doctype html>')||hash!==proof.client_artifact_sha256||hash!==args.artifact_sha256||proof.delivery_mode!=='preview_only')throw Error('REVISION_ARTIFACT_INVALID');
 const id='ver_'+(await digest(row.id+':'+hash+':'+args.version_id)).slice(0,32);
 const repeated=await db.prepare('SELECT * FROM fp_work_delivery_revisions WHERE version_id=? AND request_id=?').bind(id,row.id).first();
 if(repeated)return {status:'completed',revision:true,already_imported:true,project_id:link.project_id,version_id:id,artifact_sha256:hash};
 const previous=await db.prepare('SELECT v.id,v.artifact_hash FROM fp_versions v WHERE v.project_id=? AND v.job_id=? AND v.state=\'ready\' ORDER BY v.number DESC LIMIT 1').bind(link.project_id,link.job_id).first();
 if(!previous||args.lease!==previous.artifact_hash)throw Error('REVISION_BASE_CHANGED');
 const locked=await db.prepare(`SELECT 1 AS locked WHERE EXISTS(SELECT 1 FROM fp_activations WHERE project_id=?) OR EXISTS(SELECT 1 FROM fp_subscriptions WHERE project_id=?) OR EXISTS(SELECT 1 FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing','paid'))`).bind(link.project_id,link.project_id,link.project_id).first();
 if(locked||link.status==='active')throw Error('POSTPURCHASE_ROUTE_REQUIRED');
 if(typeof readback!=='function')throw Error('WORK_READBACK_UNAVAILABLE');
 const evidence=await readback({site_project_id:bound.site_project_id,demo_url:bound.demo_url,html:proof.artifact_html,hash});
 if(evidence?.verified!==true||evidence.sha256!==hash)throw Error('WORK_READBACK_MISMATCH');
 const stamp=new Date().toISOString(),receipt={...original,version_id:args.version_id,artifact_sha256:hash,client_artifact_sha256:hash,delivery_qualification:'preview_only',proof:{...proof,artifact_html:undefined,publisher_readback:evidence},completed_at:stamp};
 const allowed=`NOT EXISTS(SELECT 1 FROM fp_activations WHERE project_id=?) AND NOT EXISTS(SELECT 1 FROM fp_subscriptions WHERE project_id=?) AND NOT EXISTS(SELECT 1 FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing','paid')) AND (SELECT artifact_hash FROM fp_versions WHERE project_id=? AND job_id=? AND state='ready' ORDER BY number DESC LIMIT 1)=?`;
 await db.batch([
 db.prepare(`INSERT OR IGNORE INTO fp_versions(id,project_id,number,job_id,source,state,modification,html,artifact_hash,created_at,updated_at) SELECT ?,?,COALESCE((SELECT MAX(number) FROM fp_versions WHERE project_id=?),0)+1,?,'work-mcp','ready','Révision artistique Work — même commande',?,?,?,? WHERE ${allowed}`).bind(id,link.project_id,link.project_id,link.job_id,proof.artifact_html,hash,stamp,stamp,link.project_id,link.project_id,link.project_id,link.project_id,link.job_id,previous.artifact_hash),
 db.prepare(`INSERT OR IGNORE INTO fp_version_delivery SELECT id,job_id,artifact_hash,'work-mcp','work-mcp',0,? FROM fp_versions WHERE id=? AND artifact_hash=?`).bind(stamp,id,hash),
 db.prepare(`INSERT OR IGNORE INTO fp_work_delivery_revisions SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM fp_versions WHERE id=? AND artifact_hash=?)`).bind(id,row.id,previous.id,hash,args.version_id,JSON.stringify(receipt),stamp,id,hash),
 db.prepare(`UPDATE fp_projects SET approved_version_id=NULL,status='review',updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_work_delivery_revisions WHERE version_id=?)`).bind(stamp,link.project_id,id)
 ]);
 const added=await db.prepare('SELECT 1 AS added FROM fp_work_delivery_revisions WHERE version_id=?').bind(id).first();if(!added)throw Error('REVISION_CONFLICT');
 await initializeConversation(db);
 await db.prepare('INSERT OR IGNORE INTO fp_conversation_messages VALUES(?,?,?,?,?,?,?,?,?)').bind('msg_'+id,link.project_id,link.user_id,'assistant','La version améliorée de votre site est livrée ici, avec ses nouvelles photographies. Vous pouvez l’ouvrir et continuer notre conversation. Le contrôle visuel desktop/mobile reste à vérifier.','workrevision:'+id,'confirmed_work',null,stamp).run();
 return {status:'completed',revision:true,project_id:link.project_id,version_id:id,artifact_sha256:hash,publisher_readback:evidence,original_request_preserved:true,original_job_preserved:true};
}
// Uses only server-configured service credentials for the already private Site.
export async function readWorkPreview(input,env){
 if(env.FABRYA_PRODUCT_QA!=='true'||env.FABRYA_STRIPE_MODE!=='test')throw Error('WORK_QA_ONLY');
 const url=new URL(input.demo_url);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!url.hostname.endsWith('.chatgpt.site'))throw Error('WORK_SITE_INVALID');
 const token=env['FABRYA_WORK_SITE_'+input.site_project_id+'_READ'];if(typeof token!=='string'||!token)throw Error('WORK_SITE_READ_NOT_CONFIGURED');
 const r=await fetch(url.href,{headers:{'OAI-Sites-Authorization':'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(30000)});if(r.status!==200)throw Error('WORK_SITE_READ_FAILED');
 const html=await r.text(),sha=await digest(html);if(sha!==input.hash||html!==input.html)throw Error('WORK_SITE_BYTES_MISMATCH');
 return {verified:true,http:r.status,site_project_id:input.site_project_id,sha256:sha,release_ref:r.headers.get('x-fabrya-release'),checked_at:new Date().toISOString()};
}
