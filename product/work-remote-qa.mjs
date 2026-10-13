import {execFileSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
if(process.stdin.isTTY)execFileSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']});
console.log('Ready for private Work QA JSON on stdin (input hidden).');
let input='';for await(const c of process.stdin){input+=c;if(input.includes('\n'))break;}const config=JSON.parse(input);input='';
const origin='https://fabrya-product-qa.sempehugo03.chatgpt.site';const checkpoint=config.checkpoint;if(existsSync(checkpoint))throw Error('Existing QA checkpoint: resume it, do not create duplicate accounts.');
const records=[];const clients=[];const report={environment:origin,status:'running',started_at:new Date().toISOString(),accounts:[],checks:records};
function save(){writeFileSync(checkpoint,JSON.stringify(report,null,2));}
async function req(c,path,method='GET',body){const r=await fetch(origin+path,{method,headers:{'OAI-Sites-Authorization':'Bearer '+config.token,'User-Agent':'Mozilla/5.0',origin,'content-type':'application/json',...(c?.cookie?{cookie:c.cookie}:{})},body:method==='GET'?undefined:JSON.stringify(body||{}),signal:AbortSignal.timeout(20000)});const ck=r.headers.get('set-cookie')?.match(/fabrya_session=[^;,]+/);if(ck&&c)c.cookie=ck[0];let data;const raw=await r.text();try{data=JSON.parse(raw);}catch{data={text:raw.slice(0,180)};}return {status:r.status,data};}
function check(name,pass,details={}){records.push({name,pass,...details});save();console.log(JSON.stringify(records.at(-1)));}
try{
 for(const name of ['A','B']){
  const c={cookie:''};clients.push(c);const r=await req(c,'/api/product/auth/register','POST',{name:'Client fictif '+name,email:'qa-work-'+crypto.randomUUID()+'@example.test',password:'Qa-'+crypto.randomUUID()});assert.equal(r.status,201);c.user=r.data.user.id;check('account_'+name,true,{user_id:c.user});
  const created=await req(c,'/api/product/projects','POST',{request_key:crypto.randomUUID()});assert.equal(created.status,201);c.project=created.data.project.id;const p='/api/product/projects/'+c.project;
  assert.equal((await req(c,p,'PATCH',{draft_revision:0,step:3,company_input:{name:'Atelier test '+name,activity:'Garage automobile premium fictif à Tarbes',objective:'Donner confiance et préparer une visite',description:'Test client fictif '+name+'. Work seul ; réutiliser le visuel Équinoxe autorisé, sans image ou service payant. Véhicule révélé au fil des services puis invitation finale. Aucun envoi réel de formulaire.'}})).status,200);
  c.key=crypto.randomUUID();const j=await req(c,p+'/jobs','POST',{request_key:c.key});assert.equal(j.status,202);c.job=j.data.job_id;
  const read=await req(c,p);assert.equal(read.status,200);assert.equal(read.data.offer.amount,5900);assert.ok(['queued','creating','rendering'].includes(read.data.job.status));
  c.request=read.data.job.progress.request_id;assert.ok(c.request);report.accounts.push({name,user_id:c.user,project_id:c.project,job_id:c.job,request_id:c.request});save();
  const repeat=await req(c,p+'/jobs','POST',{request_key:c.key});assert.equal(repeat.data.job_id,c.job);check('same_command_'+name,true,{project_id:c.project,job_id:c.job,request_id:c.request,status:read.data.job.status});
 }
 for(const [self,other] of [[clients[0],clients[1]],[clients[1],clients[0]]]){const read=await req(self,'/api/product/projects/'+other.project);assert.equal(read.status,404);check('cross_account_read_refused',true,{http:read.status});
 const versions=await req(other,'/api/product/projects/'+other.project);const version=versions.data.versions[0].id;const preview=await req(self,'/api/product/projects/'+other.project+'/versions/'+version+'/preview');assert.equal(preview.status,404);check('cross_account_preview_refused',true,{http:preview.status});}
 for(const c of clients){const r=await req(c,'/api/product/projects/'+c.project);assert.equal(r.data.job.job_id,c.job);assert.equal(r.data.job.progress.request_id,c.request);check('refresh_retains_order',true,{request_id:c.request});
 const pay=await req(c,'/api/product/projects/'+c.project+'/checkout','POST',{});assert.equal(pay.status,409);assert.equal(pay.data.code,'NOT_APPROVED');check('no_checkout_before_real_delivery',true,{http:pay.status,code:pay.data.code});}
 const forged=await req(clients[1],'/mcp','POST',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'fabrya_work_request_complete',arguments:{request_id:clients[0].request,lease:'forged',proof:'{}'}}});assert.equal(forged.status,403);check('browser_forged_work_return_refused',true,{http:forged.status});
 report.status='PARTIAL_PASS';report.real_demo_return='BLOCKED: awaiting actual Work completion and pixels';report.stripe_test_purchase='BLOCKED: no approved real delivery and no QA TEST key';report.completed_at=new Date().toISOString();save();
}catch(e){report.status='FAIL';report.error=e.message;save();console.log(JSON.stringify({failure:e.message}));process.exitCode=1;}
