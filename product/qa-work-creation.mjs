import {digest} from './contract.mjs';
const origin='https://fabrya-product-qa.sempehugo03.chatgpt.site';
// Existing authenticated Work operator exercises normal Product routes, never
// mints a client session or constructs a Work delivery/credit/provider result.
export async function qaWorkCreation({db,request,owner,env,input,key}){
 if(env.FABRYA_PRODUCT_QA!=='true'||env.FABRYA_STRIPE_MODE!=='test'||new URL(request.url).origin!==origin||!owner||request.headers.get('oai-authenticated-user-id')!==owner||request.headers.get('cookie')||request.headers.has('oai-sites-authorization')||typeof env.FABRYA_QA_PRODUCT_FETCH!=='function')throw Error('QA_ADMIN_REQUIRED');
 if(input.run!=='creative-parity-20261014'||!key||typeof input.company!=='object')throw Error('QA_CREATION_INVALID');
 const email='fabrya-creative-parity-20261014@example.test',password=env.FABRYA_QA_CREATION_PASSWORD;
 if(typeof password!=='string'||password.length<20)throw Error('QA_CREDENTIAL_UNAVAILABLE');
 let cookie='';const call=async(path,method='GET',body)=>{const r=await env.FABRYA_QA_PRODUCT_FETCH(new Request(origin+path,{method,headers:{origin,cookie,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));const ck=r.headers.get('set-cookie')?.match(/fabrya_session=[^;,]+/);if(ck)cookie=ck[0];return r;};
 const data=async(path,method='GET',body)=>{const r=await call(path,method,body);const d=await r.json();if(!r.ok)throw Error('QA_ROUTE_'+r.status+'_'+(d.code||'ERROR'));return d;};
 let r=await call('/api/product/auth/register','POST',{email,password,name:'Client fictif — création Work'});if(r.status!==201&&r.status!==409)throw Error('QA_SIGNUP_FAILED');
 const login=await data('/api/product/auth/login','POST',{email,password});
 if(input.action==='verify'){
  const projects=await data('/api/product/projects');const p=projects.projects.find(p=>p.id===input.project_id);if(!p)throw Error('QA_OWNER_INVALID');
  const project=await data('/api/product/projects/'+p.id),version=project.versions.find(v=>v.id===input.version_id);if(!version)throw Error('QA_VERSION_UNAVAILABLE');
  const preview=await call('/api/product/projects/'+p.id+'/versions/'+version.id+'/preview');const html=await preview.text(),hash=await digest(html);if(preview.status!==200||hash!==version.artifact_hash)throw Error('QA_PREVIEW_MISMATCH');
  const foreign='/api/product/projects/prj_384ab1e3fb586f2a9089667aff9cb120';const denied=await call(foreign);const deniedPreview=await call(foreign+'/versions/'+input.clair_version_id+'/preview');const deniedChange=await call(foreign+'/conversation','POST',{request_key:'foreign_creation_isolation_20261014',message:'Contrôle QA : accès croisé interdit.',action:'message'});if(denied.status!==404||deniedPreview.status!==404||deniedChange.status!==404)throw Error('QA_FOREIGN_ACCESS_NOT_REFUSED');
  await data('/api/product/auth/logout','POST',{});cookie='';await data('/api/product/auth/login','POST',{email,password});const resumed=await data('/api/product/projects/'+p.id);
  const counts=await db.prepare('SELECT count(*) n FROM fp_jobs WHERE project_id=?').bind(p.id).first();
  return {status:'verified',project_id:p.id,version_id:version.id,preview_http:preview.status,preview_sha256:hash,foreign_project_http:denied.status,foreign_preview_http:deniedPreview.status,foreign_change_http:deniedChange.status,same_version_after_relogin:resumed.versions[0]?.id===version.id,job_count:counts.n,browser:'NOT_VERIFIED',payment_performed:false};
 }
 const created=await data('/api/product/projects','POST',{request_key:'qa-create-'+key});const id=created.project.id,base='/api/product/projects/'+id;
 let current=await data(base);if(current.project.status==='draft'&&current.project.draft_revision===0)await data(base,'PATCH',{draft_revision:0,step:0,company_input:input.company});
 await data(base+'/conversation','POST',{request_key:'qa-message-'+key,message:input.company.description,action:'start'});
 current=await data(base);const link=await db.prepare('SELECT * FROM fp_work_product_links WHERE project_id=? AND user_id=?').bind(id,login.user.id).first();if(!link)throw Error('QA_WORK_NOT_BOUND');
 const work=await db.prepare('SELECT created_at,method_hash,status FROM fp_work_mcp_requests WHERE id=?').bind(link.request_id).first();
 const events=await db.prepare('SELECT status,attempts FROM fp_work_mcp_deliveries WHERE request_id=?').bind(link.request_id).all();
 return {status:'queued',request_id:link.request_id,user_id:login.user.id,project_id:id,job_id:link.job_id,version_id:link.version_id,created_at:work.created_at,method_sha256:work.method_hash,events:events.results,normal_product_auth:true,normal_conversation_request:true,payment_performed:false,browser:'NOT_VERIFIED'};
}
