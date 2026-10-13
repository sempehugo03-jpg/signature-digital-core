import {ORIGINAL_QA} from './qa-access-recovery.mjs';
import {digest,fail} from './contract.mjs';
const origin='https://fabrya-product-qa.sempehugo03.chatgpt.site';
// QA orchestration calls the retained Product routes. It never creates a
// session, provider receipt, credit grant or subscription by itself.
export async function qaPayment({db,request,owner,env,tag,password,action,productFetch}) {
 const url=new URL(request.url),target=ORIGINAL_QA[tag];
 if(!target||env.FABRYA_PRODUCT_QA!=='true'||env.FABRYA_STRIPE_MODE!=='test'||url.origin!==origin||url.pathname!=='/mcp'||request.method!=='POST'||!owner||request.headers.get('oai-authenticated-user-id')!==owner||request.headers.get('cookie')||request.headers.has('oai-sites-authorization'))fail('QA_ADMIN_REQUIRED','Administrateur privé TEST requis.',403);
 if(!['prepare','verify'].includes(action)||typeof password!=='string'||password.length<16||password.length>128||typeof productFetch!=='function')fail('INVALID_REQUEST','Vérification de paiement invalide.');
 const account=await db.prepare(`SELECT u.id,u.email FROM sd_platform_users u JOIN fp_projects p ON p.user_id=u.id JOIN fp_work_product_links l ON l.project_id=p.id AND l.user_id=u.id JOIN fp_work_mcp_requests r ON r.id=l.request_id JOIN fp_work_site_bindings b ON b.request_id=r.id AND b.project_id=p.id AND b.user_id=u.id WHERE u.id=? AND p.id=? AND r.id=? AND r.owner=? AND r.status='completed' AND u.status='active' AND u.provider='password' AND u.email LIKE '%@example.test'`).bind(target.user,target.project,target.request,owner).first();
 if(!account)fail('QA_ADMIN_NOT_AUTHORIZED','Compte original ou administrateur non vérifié.',403);
 let cookie='';const checks=[];
 const call=async(path,method='GET',body)=>{const res=await productFetch(new Request(origin+path,{method,headers:{origin,cookie,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));const ck=res.headers.get('set-cookie')?.match(/fabrya_session=[^;,]+/);if(ck)cookie=ck[0];return res;};
 const check=(name,pass,details={})=>{checks.push({name,pass,...details});if(!pass)fail('QA_PAYMENT_FAILED',name,409);};
 const data=async(path,method='GET',body)=>{const r=await call(path,method,body);const p=await r.json();if(!r.ok)fail(p.code||'QA_PAYMENT_ROUTE_FAILED',p.message||'Route Produit indisponible.',r.status);return p;};
 const base='/api/product/projects/'+target.project;
 try {
  const login=await data('/api/product/auth/login','POST',{email:account.email,password});check('normal_original_login',login.user?.id===target.user);
  const p=await data(base),v=p.versions.find(x=>x.source==='work-mcp');check('original_work_delivery',p.job?.status==='ready'&&!!v);
  const foreign=ORIGINAL_QA[tag==='A'?'B':'A'];let r=await call('/api/product/projects/'+foreign.project+'/checkout','POST',{});check('foreign_checkout_refused',r.status===404,{http:r.status});
  if(action==='prepare'){
   check('no_subscription_before_checkout',!p.subscription);
   r=await call(base+'/versions/'+v.id+'/preview');check('own_real_preview',r.status===200&&await digest(await r.text())===v.artifact_hash);
   if(p.project.approved_version_id!==v.id)await data(base+'/approve','POST',{version_id:v.id});
   const checkout=await data(base+'/checkout','POST',{});check('test_checkout_created',/^cs_test_/.test(checkout.session_id)&&new URL(checkout.url).hostname==='checkout.stripe.com');
   await data('/api/product/auth/logout','POST',{});cookie='';
   const resumed=await data('/api/product/auth/login','POST',{email:account.email,password});check('normal_relogin',resumed.user?.id===target.user);
   const retry=await data(base+'/checkout','POST',{});check('same_checkout_after_interruption',retry.session_id===checkout.session_id&&retry.url===checkout.url);
   const count=await db.prepare("SELECT count(*) AS n FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing')").bind(target.project).first();check('one_open_checkout',count.n===1,{count:count.n});
   return {action,mode:'TEST',user_id:target.user,project_id:target.project,version_id:v.id,...checkout,checks,payment_performed:false,method:'Hosted normal password and Product routes, actual Stripe Checkout. No browser observation.'};
  }
  check('paid_project_active',p.project.status==='active'&&p.subscription?.state==='active'&&p.subscription?.amount===5900&&p.subscription?.currency==='eur');
  check('right_version_activated',p.activation?.version_id===v.id&&p.activation?.artifact_hash===v.artifact_hash);
  const credits=await data(base+'/credits');check('monthly_100_credits',credits.monthly_max===100&&credits.monthly_available===100);
  const wallets=await db.prepare("SELECT source_ref,allowance,valid_from FROM fp_credit_wallets WHERE project_id=? AND source='monthly_invoice'").bind(target.project).all();check('one_monthly_grant',wallets.results.length===1&&wallets.results[0].allowance===100);
  const activations=await db.prepare('SELECT count(*) AS n FROM fp_activations WHERE project_id=?').bind(target.project).first();check('one_activation',activations.n===1);
  r=await call('/api/product/projects/'+foreign.project+'/credits');check('foreign_credits_refused',r.status===404,{http:r.status});
  return {action,status:'PASS',mode:'TEST',user_id:target.user,project_id:target.project,checks,invoice_id:wallets.results[0].source_ref,activation:p.activation,credits,method:'Hosted Product routes and existing provider-confirmed DB rows. No payment or receipt fabricated.'};
 }finally{if(cookie)await call('/api/product/auth/logout','POST',{});}
}
