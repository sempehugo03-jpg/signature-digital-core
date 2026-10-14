import {createModifier} from './engine.mjs';
import {renderContent} from './html-content.mjs';
import {sha256} from './auth.mjs';
const hash=s=>sha256(new TextEncoder().encode(s));
const check=(value,code)=>{if(!value)throw Error(code);};
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function runPrivateProbe(db,{siteA,siteB,readSite}){
 const {adapter,store}=createModifier({db});await store.migrate();
 const run='qa_'+crypto.randomUUID().replaceAll('-',''),now=Date.now(),proof={run_ref:run,environment:'HOSTED_PRIVATE_D1',product_approval_connected:false,deployer_connected:false,provider_calls:0,checks:[]};
 const originals={};
 async function register(label,site){
  const html=await readSite(site,'/index.html');check(html.includes('DÉMONSTRATION FICTIVE')&&html.includes('service-body'),'QA_EXISTING_SITE_REQUIRED');
  const digest=await hash(html),principal={customer_ref:run+'_customer_'+label,project_ref:run+'_project_'+label},site_ref=run+'_site_'+label;
  const paragraph=html.match(/<div class="service-body"><p>([^<]+)<\/p>/)?.[1];check(paragraph,'QA_SERVICE_SLOT_REQUIRED');
  const template=html.replace('Tarbes. Le goût du travail juste.','Tarbes. Le goût du travail juste.{{FABRYA:friday.close}}').replace(paragraph,'{{FABRYA:service.description}}');
  const manifest={schema:'fabrya.mutable-content.v1',fields:[{id:'friday.close',pointer:'/hours/friday/close',type:'time',aliases:['vendredi'],prefix:' · Vendredi : fermeture à ',suffix:'.'},{id:'service.description',pointer:'/services/diagnostic/description',type:'text',max_length:1000,aliases:['prestation','diagnostic']}]};
  const data={hours:{friday:{close:''}},services:{diagnostic:{description:paragraph}}};check(renderContent(template,manifest,data)===html,'QA_BASELINE_BYTES_CHANGED');
  const version_ref=run+'_initial_'+label,release_ref=run+'_release_'+label,config={manifest,template,origin:site.origin,site_project_id:site.id,source_kind:'existing-private-sites-html',real_initial_sha256:digest};
  await store.batch([
   ['INSERT INTO fm_sites(site_ref,customer_ref,project_ref,config_json,current_release) VALUES(?,?,?,?,?)',site_ref,principal.customer_ref,principal.project_ref,JSON.stringify(config),release_ref],
   ['INSERT INTO fm_artifacts(version_ref,site_ref,html,content_json,sha256,created_at) VALUES(?,?,?,?,?,?)',version_ref,site_ref,html,JSON.stringify(data),digest,now],
   ['INSERT INTO fm_releases(release_ref,site_ref,version_ref,sha256,receipt_json,created_at) VALUES(?,?,?,?,?,?)',release_ref,site_ref,version_ref,digest,JSON.stringify({release_ref,kind:'QA_REFERENCE_TO_EXISTING_NATIVE_SITE',site_project_id:site.id}),now]
  ]);
  originals[label]=html;return {principal,site_ref,version_ref,release_ref,sha256:digest};
 }
 const a=await register('A',siteA),b=await register('B',siteB);
 const envelope=(message,suffix)=>({protocol:'fabrya.site-change.v1.0.0',...a.principal,site_ref:a.site_ref,change_ref:run+'_change_'+suffix,base_version_ref:a.version_ref,base_release_ref:a.release_ref,base_sha256:a.sha256,idempotency_key:run+'_key_'+suffix,message,attachments:[],requested_at:new Date(now).toISOString()});
 const e=envelope('FABRYA, je ferme désormais à 19 h le vendredi.','hours');
 const result=await adapter.submitTask(a.principal,e),preview=await adapter.validatePreview(a.principal,{change_ref:e.change_ref,site_ref:a.site_ref}),html=await adapter.readPreview(a.principal,{change_ref:e.change_ref});
 check(html!==originals.A&&html.includes('Vendredi : fermeture à 19:00'),'HOSTED_MUTATION_FAILED');
 proof.checks.push({name:'real_existing_html_modified_in_hosted_D1',pass:true,before_sha256:a.sha256,after_sha256:preview.artifact_sha256});
 check((await adapter.submitTask(a.principal,e)).version_ref===result.version_ref,'HOSTED_DUPLICATE_VERSION');proof.checks.push({name:'duplicate_same_version',pass:true});
 const {adapter:restarted}=createModifier({db});check((await restarted.readPreview(a.principal,{change_ref:e.change_ref}))===html,'HOSTED_RESTART_LOST_VERSION');proof.checks.push({name:'persisted_after_new_engine_instance',pass:true});
 for(const [name,fn] of [['B_read_A_preview',()=>adapter.readPreview(b.principal,{change_ref:e.change_ref})],['B_get_A_release',()=>adapter.getCurrentRelease(b.principal,{site_ref:a.site_ref})],['B_modify_A',()=>adapter.submitTask(b.principal,{...e,customer_ref:b.principal.customer_ref,project_ref:b.principal.project_ref,change_ref:run+'_attack001',idempotency_key:run+'_attack_key'})]]){let rejected=false;try{await fn();}catch(error){rejected=/ENGINE_NOT_FOUND|ENGINE_SITE_SCOPE/.test(error.message);}check(rejected,'HOSTED_ISOLATION_FAILED');proof.checks.push({name,pass:true});}
 const publishArgs={change_ref:e.change_ref,site_ref:a.site_ref,version_ref:preview.version_ref,artifact_sha256:preview.artifact_sha256,expected_release_ref:a.release_ref,approval_ref:run+'_invented_approval',idempotency_key:e.idempotency_key};let publicationError;try{await adapter.publish(a.principal,publishArgs);}catch(error){publicationError=error.message;}check(publicationError==='ENGINE_PRODUCT_APPROVAL_NOT_CONNECTED','UNVERIFIED_PUBLICATION_ALLOWED');
 proof.checks.push({name:'publication_without_Product_refused',pass:true,error:publicationError});
 // Release the unpublished hours task for an independent service probe, keeping history.
 await store.batch([['UPDATE fm_tasks SET state=\'CANCELED\',updated_at=? WHERE change_ref=? AND state=\'PREVIEW_READY\'',Date.now(),e.change_ref],['UPDATE fm_sites SET busy_change=NULL WHERE site_ref=? AND busy_change=?',a.site_ref,e.change_ref]]);
 const service=envelope('Remplace la prestation diagnostic par « Diagnostic électronique et contrôle des défauts. »','service');const sr=await adapter.submitTask(a.principal,service),sh=await adapter.readPreview(a.principal,{change_ref:service.change_ref});check(sh.includes('Diagnostic électronique et contrôle des défauts.')&&sh!==originals.A,'HOSTED_SERVICE_FAILED');proof.checks.push({name:'existing_service_description_modified',pass:true,version_ref:sr.version_ref});
 await store.batch([['UPDATE fm_tasks SET state=\'CANCELED\',updated_at=? WHERE change_ref=? AND state=\'PREVIEW_READY\'',Date.now(),service.change_ref],['UPDATE fm_sites SET busy_change=NULL WHERE site_ref=? AND busy_change=?',a.site_ref,service.change_ref]]);
 const complex=await adapter.submitTask(a.principal,envelope('Crée une nouvelle page','complex'));check(complex.business_code==='COMPLEX_MODIFICATION_REQUIRED'&&complex.dispatch_performed===false,'HOSTED_COMPLEX_FAILED');proof.checks.push({name:'complex_dossier_retained_without_Work_dispatch',pass:true});
 check(await readSite(siteA,'/index.html')===originals.A,'PRIVATE_SITE_CHANGED_WITHOUT_APPROVAL');check(await readSite(siteB,'/index.html')===originals.B,'B_NATIVE_SITE_CHANGED');proof.checks.push({name:'native_A_B_unchanged_without_Product_approval',pass:true});
 proof.preview={change_ref:e.change_ref,scope:a.principal,site_ref:a.site_ref,version_ref:preview.version_ref,sha256:preview.artifact_sha256};proof.metrics={hours_elapsed_ms:(await store.task(a.principal,e.change_ref)).elapsed_ms,total_cost_microeur:null,provider_cost_microeur:0};
 await store.event(run,{type:'PRIVATE_HOSTED_PROOF',proof},Date.now());return proof;
}
// A diagnostic view only; no client chat/admin/payments interface is created.
export function diagnosticPage(){return '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Moteur FABRYA — contrôle privé</title><h1>Contrôle technique du moteur</h1><p>Préparation hébergée uniquement. Validation Produit et déploiement post-achat non raccordés.</p><form method="post" action="/engine/qa/run"><button>Exécuter le contrôle hébergé A/B</button></form></html>';}
export function proofPage(proof){return '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Preuves du moteur</title><h1>Preuves hébergées</h1><pre id="proof">'+escape(JSON.stringify(proof,null,2))+'</pre><p>Aperçu : '+escape(proof.preview?.change_ref||'')+'</p><p>Publication et retour arrière : BLOQUÉS.</p></html>';}
