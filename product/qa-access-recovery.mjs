import {digest,fail} from './contract.mjs';
const origin='https://fabrya-product-qa.sempehugo03.chatgpt.site';
export const ORIGINAL_QA={A:{user:'b8a064c2-3f70-4e36-b2cf-371ebbb395af',project:'prj_4325cb35e05efb496e82149304022e20',request:'wrk_c82d60fde8e19a64fcd36260b8d6db6338394751'},B:{user:'a5492add-0f1d-44eb-88d2-e7785a41109d',project:'prj_00a9417b403eb38ad7902bf505870ed5',request:'wrk_61d4af8c68a356148fa34e6bd51cc4b6d9996863'}};
export async function qaRecovery({db,request,owner,qa,clock=()=>Date.now()}) {
 const url=new URL(request.url);
 if(!qa||url.origin!==origin||url.pathname!=='/mcp'||request.method!=='POST'||!owner||request.headers.get('oai-authenticated-user-id')!==owner||request.headers.get('cookie')||request.headers.has('oai-sites-authorization'))fail('QA_ADMIN_REQUIRED','Administrateur QA authentifié requis.',403);
 await db.exec(`CREATE TABLE IF NOT EXISTS fp_qa_access_recoveries(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,project_id TEXT NOT NULL,admin_id TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,expires_at INTEGER NOT NULL,state TEXT NOT NULL,created_at TEXT NOT NULL,consumed_at TEXT,password_hash TEXT,password_salt TEXT); CREATE TABLE IF NOT EXISTS fp_qa_access_audit(id TEXT PRIMARY KEY,recovery_id TEXT NOT NULL,user_id TEXT NOT NULL,admin_id TEXT NOT NULL,action TEXT NOT NULL,created_at TEXT NOT NULL);`);
 const iso=()=>new Date(clock()).toISOString();
 async function account(tag){const target=ORIGINAL_QA[tag];if(!target)fail('QA_ACCOUNT_NOT_ALLOWED','Compte QA interdit.',403);
  const row=await db.prepare(`SELECT u.email,u.id,p.id AS project_id FROM sd_platform_users u JOIN fp_projects p ON p.user_id=u.id JOIN fp_work_product_links l ON l.project_id=p.id AND l.user_id=u.id JOIN fp_work_mcp_requests r ON r.id=l.request_id JOIN fp_work_site_bindings b ON b.request_id=r.id AND b.user_id=u.id AND b.project_id=p.id WHERE u.id=? AND p.id=? AND r.id=? AND r.owner=? AND r.status='completed' AND u.status='active' AND u.provider='password' AND u.email LIKE '%@example.test' AND NOT EXISTS(SELECT 1 FROM fp_subscriptions s WHERE s.project_id=p.id)`).bind(target.user,target.project,target.request,owner).first();
  if(!row)fail('QA_ADMIN_NOT_AUTHORIZED','Compte original ou autorité administrateur non vérifiés.',403);return row;
 }
 async function issue(tag,key){const a=await account(tag);if(!/^[A-Za-z0-9_-]{16,100}$/.test(key||''))fail('INVALID_REQUEST','Clé de récupération requise.');
  const id='qar_'+(await digest(owner+':'+a.id+':'+key));
  const recent=await db.prepare('SELECT count(*) AS n FROM fp_qa_access_recoveries WHERE user_id=? AND created_at>?').bind(a.id,new Date(clock()-86400000).toISOString()).first();if(recent.n>=4)fail('QA_RECOVERY_LIMIT','Limite de récupération atteinte.',429);
  const previous=await db.prepare('SELECT state FROM fp_qa_access_recoveries WHERE id=?').bind(id).first();if(previous)return {recovery_id:id,state:previous.state,token_reissued:false};
  const token=crypto.randomUUID()+crypto.randomUUID(),h=await digest(token),expires=clock()+5*60000;
  await db.batch([db.prepare("INSERT INTO fp_qa_access_recoveries(id,user_id,project_id,admin_id,token_hash,expires_at,state,created_at) VALUES(?,?,?,?,?,?,'issued',?)").bind(id,a.id,a.project_id,owner,h,expires,iso()),db.prepare('INSERT INTO fp_qa_access_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,a.id,owner,'issued',iso())]);
  return {recovery_id:id,token,expires_at:new Date(expires).toISOString(),user_id:a.id,project_id:a.project_id};
 }
 async function redeem(tag,token,password){const a=await account(tag);if(typeof token!=='string'||token.length>100||typeof password!=='string'||password.length<16||password.length>128)fail('INVALID_REQUEST','Récupération invalide.');
  const h=await digest(token),r=await db.prepare("SELECT * FROM fp_qa_access_recoveries WHERE token_hash=? AND user_id=? AND project_id=? AND admin_id=? AND state='issued' AND expires_at>?").bind(h,a.id,a.project_id,owner,clock()).first();if(!r)fail('QA_RECOVERY_EXPIRED_OR_USED','Récupération expirée ou déjà utilisée.',409);
  const salt=crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bytes=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256));const enc=b=>btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  const ph='pbkdf2$100000$'+enc(bytes),ps=enc(salt),at=iso();
  const results=await db.batch([
   db.prepare("UPDATE fp_qa_access_recoveries SET state='consumed',consumed_at=?,password_hash=?,password_salt=? WHERE id=? AND state='issued' AND expires_at>?").bind(at,ph,ps,r.id,clock()),
   db.prepare("UPDATE sd_platform_users SET password_hash=?,password_salt=?,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_qa_access_recoveries WHERE id=? AND consumed_at=? AND password_hash=? AND password_salt=?)").bind(ph,ps,at,a.id,r.id,at,ph,ps),
   db.prepare("DELETE FROM sd_platform_sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM fp_qa_access_recoveries WHERE id=? AND consumed_at=? AND password_hash=? AND password_salt=?)").bind(a.id,r.id,at,ph,ps),
   db.prepare("INSERT INTO fp_qa_access_audit SELECT ?,id,user_id,admin_id,'consumed',? FROM fp_qa_access_recoveries WHERE id=? AND consumed_at=? AND password_hash=? AND password_salt=?").bind(crypto.randomUUID(),at,r.id,at,ph,ps)]);
  if(results[0].meta.changes!==1||results[1].meta.changes!==1)fail('QA_RECOVERY_CONFLICT','Récupération déjà consommée.',409);
  return {user_id:a.id,project_id:a.project_id,email:a.email,state:'consumed',session_created:false,normal_login_required:true};
 }
 async function verify(tag,password,productFetch){const a=await account(tag);if(typeof productFetch!=='function')fail('QA_TRANSPORT_UNAVAILABLE','Transport Produit non raccordé.',503);
  let cookie='';const checks=[];const call=async(path,method='GET',body)=>{const res=await productFetch(new Request(origin+path,{method,headers:{origin,cookie,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));const ck=res.headers.get('set-cookie')?.match(/fabrya_session=[^;,]+/);if(ck)cookie=ck[0];return res;};
  const check=(name,pass,details={})=>{checks.push({name,pass,...details});if(!pass)fail('QA_DELIVERY_FAILED',name,409);};
  try{
   let res=await call('/api/product/auth/login','POST',{email:a.email,password});check('normal_password_login',res.status===200,{http:res.status,user_id:a.id});check('original_user', (await res.json()).user.id===a.id);
   const base='/api/product/projects/'+a.project_id;res=await call(base);check('owned_project',res.status===200);const p=await res.json();const v=p.versions.find(x=>x.source==='work-mcp');check('work_receipt_consumed',p.job?.status==='ready'&&!!v,{job_id:p.job?.job_id,version_id:v?.id});
   const preview=base+'/versions/'+v.id+'/preview';res=await call(preview);check('owned_preview_opened',res.status===200);const hash=await digest(await res.text());check('preview_hash',hash===v.artifact_hash,{sha256:hash});
   const foreign=ORIGINAL_QA[tag==='A'?'B':'A'];res=await call('/api/product/projects/'+foreign.project);check('foreign_project_refused',res.status===404,{http:res.status});const bind=await db.prepare('SELECT version_id FROM fp_work_site_bindings WHERE project_id=?').bind(foreign.project).first();res=await call('/api/product/projects/'+foreign.project+'/versions/'+bind.version_id+'/preview');check('foreign_preview_refused',res.status===404,{http:res.status});
   await call('/api/product/auth/logout','POST',{});cookie='';res=await call(preview);check('logout_refused',res.status===401,{http:res.status});
   res=await call('/api/product/auth/login','POST',{email:a.email,password});check('normal_relogin',res.status===200);res=await call(base);const resumed=await res.json();check('same_delivery_after_interruption',resumed.job?.job_id===p.job.job_id&&resumed.versions.length===p.versions.length);res=await call(preview);check('same_preview_after_interruption',res.status===200&&await digest(await res.text())===hash);
   const count=await db.prepare('SELECT count(*) AS n FROM fp_work_client_previews WHERE project_id=?').bind(a.project_id).first();check('preview_recorded_once',count.n===1,{count:count.n});
   return {user_id:a.id,project_id:a.project_id,checks,status:'PASS',method:'Hosted normal Product routes, D1 and real artifact bytes. Not a browser/pixel test.'};
  }finally{if(cookie)await call('/api/product/auth/logout','POST',{});}
 }
 return {issue,redeem,verify};
}
