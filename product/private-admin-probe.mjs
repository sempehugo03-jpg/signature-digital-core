import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
if(process.stdin.isTTY)(await import('node:child_process')).execFileSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']});
console.log('Ready for private admin QA JSON on stdin (input hidden).');
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.includes('\n'))break;}
const input=JSON.parse(raw);raw='';const origin=input.origin;
const access=input.token;delete input.token;
const checks=[];let cookie='';
async function call(path,method='GET',body,custom={}){
 const res=await fetch(origin+path,{method,headers:{'OAI-Sites-Authorization':'Bearer '+access,origin,cookie,...(body?{'content-type':'application/json'}:{}),...custom},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const set=res.headers.get('set-cookie');if(set?.includes('fabrya_session='))cookie=set.match(/fabrya_session=[^;,]*/)[0];
 const text=await res.text();let data;try{data=JSON.parse(text)}catch{data=text}
 return {status:res.status,data};
}
const record=(name,pass,details={})=>{checks.push({name,pass,...details});console.log(JSON.stringify(checks.at(-1)));assert.ok(pass,name)};
try{
 const config=await call('/product-assets/config.json');record('private_test_only_config',config.status===200&&config.data.qa===true&&config.data.payment_mode==='test');
 const accounts=[];
 for(const [tag,name,activity] of [['a','Client A — Charpentier','Charpentier'],['b','Client B — Kinésithérapeute','Kinésithérapeute']]){
  cookie='';const email='fabrya-admin-'+tag+'-'+crypto.randomUUID()+'@example.test';const password='Qa-'+crypto.randomUUID();
  const reg=await call('/api/product/auth/register','POST',{name,email,password});record('register_'+tag,reg.status===201);
  const p=await call('/api/product/projects','POST',{request_key:crypto.randomUUID()});record('create_project_'+tag,p.status===201);
  const id=p.data.project.id;
  const saved=await call('/api/product/projects/'+id,'PATCH',{draft_revision:0,step:1,company_input:{name,activity,objective:'Recevoir des demandes',description:'Entreprise fictive pour contrôle privé FABRYA.'}});record('save_company_'+tag,saved.status===200);
  const session=cookie;await call('/api/product/auth/logout','POST',{});record('logout_protected_'+tag,(await call('/api/product/projects/'+id)).status===401);
  const login=await call('/api/product/auth/login','POST',{email,password});record('login_'+tag,login.status===200);
  record('persistent_company_'+tag,(await call('/api/product/projects/'+id)).data.project.company_input.name===name);
  const wallet=await call('/api/product/projects/'+id+'/credits');record('own_wallet_no_invented_credit_'+tag,wallet.status===200&&wallet.data.monthly_available===0&&wallet.data.changes.length===0);
  const request=await call('/api/product/projects/'+id+'/changes','POST',{request_key:crypto.randomUUID(),message:'Mettre les horaires à jour'});record('unpaid_request_refused_'+tag,request.status===403&&request.data.code==='CREDIT_SUBSCRIPTION_REQUIRED');
  accounts.push({tag,id,cookie});
 }
 for(const [owner,foreign] of [[accounts[0],accounts[1]],[accounts[1],accounts[0]]]){
  cookie=owner.cookie;const base='/api/product/projects/'+foreign.id;
  const list=await call('/api/product/projects');record('list_only_owner_'+owner.tag,list.status===200&&list.data.projects.every(p=>p.id!==foreign.id));
  for(const route of ['', '/credits','/versions/version_foreign123/preview','/changes/change_foreign123/preview','/change-files/file_foreign123'])record('cross_access_'+owner.tag+'_'+(route||'project'),(await call(base+route)).status===404);
  for(const route of ['/changes','/changes/change_foreign123/acknowledge','/changes/change_foreign123/reject'])record('cross_write_'+owner.tag+'_'+route,(await call(base+route,'POST',{request_key:crypto.randomUUID(),message:'Changer le site',version_id:'version_foreign123'})).status===404);
 }
 cookie=accounts[0].cookie;
 const base='/api/product/projects/'+accounts[0].id;
 record('browser_cannot_grant',(await call(base+'/credits/grant','POST',{credits:100})).status===404);
 record('browser_cannot_publish',(await call(base+'/changes/change_foreign123/publish','POST',{})).status===404);
 record('csrf_rejected',(await call(base+'/changes','POST',{message:'Mauvais origin'}, {origin:'https://evil.test'})).status===403);
 record('no_stripe_key_no_activation',(await call(base+'?success=true')).data.activation===null);
 const page=await call('/modifications?project='+accounts[0].id);record('change_center_served',page.status===200&&page.data.includes('change-center'));
 const asset=await call('/product-assets/change-center.mjs');record('change_assets_served',asset.status===200&&asset.data.includes('Votre réserve mensuelle'));
 record('files_unavailable_honestly',(await call(base+'/credits')).data.file_upload_available===false);
 record('engine_unavailable_honestly',(await call(base+'/credits')).data.engine_available===false);
 const proof={origin,checked_at:new Date().toISOString(),checks,projects:accounts.map(({tag,id})=>({tag,id})),limits:['No paid TEST invoice: no postpurchase activation, 100-credit allocation or active site proved.','Cross-file and preview routes tested with foreign refs; no real uploaded file or modified site present.','No browser viewport QA.']};
 writeFileSync(input.report,JSON.stringify(proof,null,2));console.log(JSON.stringify({passed:checks.length,report:input.report}));
}catch(error){writeFileSync(input.report,JSON.stringify({origin,checks,error:error.message},null,2));console.error(error.message);process.exitCode=1;}
