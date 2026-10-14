// Transport adapter to the existing MCP Events queue; never a generator.
import { initializeWork, enqueueWorkRequest } from './work-mcp.mjs';
import { digest, fail } from './contract.mjs';
import {productService} from './service.mjs';
import {workCreativePolicy} from './work-creative-policy.mjs';
// Trusted completion callback only: reconcile the already bound original job
// through Product's existing importer. No password session or approval is made.
export async function reconcileProductWorkDelivery(db,request_id){
 const link=await db.prepare(`SELECT l.project_id,l.user_id FROM fp_work_product_links l JOIN fp_work_mcp_requests w ON w.id=l.request_id
  WHERE l.request_id=? AND w.status='completed'`).bind(request_id).first();
 if(!link)throw Error('WORK_BINDING_INVALID');
 const service=productService({db,kevin:workProductAdapter({db}),qa:true,deliveryVerifier:workDeliveryVerifier(db)});
 const result=await service.read({id:link.user_id},link.project_id);
 return {project_id:link.project_id,job_id:result.job?.job_id,version_id:result.job?.version,status:result.job?.status};
}
export function workProductAdapter({db, clock=()=>Date.now()}) {
  const first=(s,...v)=>db.prepare(s).bind(...v).first();
  return {
    kind:'work-mcp',
    async createDemo(input) {
      await initializeWork(db);
      const job=await first('SELECT j.id,j.project_id,j.version_id,p.user_id FROM fp_jobs j JOIN fp_projects p ON p.id=j.project_id WHERE j.id=?',input.job_id);
      if(!job) fail('WORK_JOB_MISSING','Commande enregistrée introuvable.',503);
      let link=await first('SELECT * FROM fp_work_product_links WHERE job_id=?',job.id);
      if(!link) {
        const operators=await db.prepare('SELECT DISTINCT owner FROM fp_work_mcp_subscriptions WHERE expires>?').bind(clock()).all();
        if(operators.results.length!==1) fail('WORK_OPERATOR_UNAVAILABLE','La connexion Work nécessite une vérification. Votre commande est conservée.',503);
        const brief=JSON.stringify({fictional_qa:true,creative:workCreativePolicy,company:input.company_input,revision:input.revision||'',delivery:'Rendre un artefact HTML autonome dans proof.artifact_html, avec proof.client_artifact_sha256 ; aucune API payante externe ni nouvelle dépense. Utiliser les outils natifs autorisés réellement disponibles, selon creative. Vérifier les vrais pixels et les accès avant le reçu.',commercial_goal:input.company_input?.objective,
          postpurchase:{protocol:'site-change/v1.0.0',instructions:'Conserver le même Site et le même writer Sites data existant. Fournir proof.site_change_baseline={schema:"fabrya.work-baseline.v1",slots,manifest,content}; slots=[{id,start,end}] contient les indices UTF-16 dans proof.artifact_html, un champ par plage sans chevauchement. Pour une image inline, omettre sa valeur dans content : le Produit la reprend dans la plage déclarée sans dupliquer ses octets dans le reçu. Un template explicite peut remplacer slots pour les petits HTML. Le rendu des champs doit reproduire exactement proof.artifact_html. Déclarer des champs time et image avec leurs aliases métier. Compiler createSitesDataWorker dans ce Site avec le binding exact claim.delivery et baseline_release_ref="work_release_"+claim.delivery.version_id, et appliquer ses migrations D1 via Sites. Configurer FABRYA_SITE_WRITER_SECRET sur le Site et les secrets serveur FABRYA_ENGINE_SITE_<site_project_id>_WRITE_SECRET et FABRYA_ENGINE_SITE_<site_project_id>_READ sur le Produit QA, via les opérations Sites autorisées. Aucun secret dans le reçu ou le code. Vérifier les octets servis sur le même Site avant completion. Le Produit associe et initialise automatiquement le Moteur après activation TEST vérifiée. Garder NOT_VERIFIED sans navigateur autorisé; ne pas fabriquer une livraison prête.'}});
        const request=await enqueueWorkRequest(db,operators.results[0].owner,brief,'product:'+input.idempotency_key,{...job});
        link={request_id:request.id};
      }
      return {job_id:job.id,handle:JSON.stringify({request_id:link.request_id,job_id:job.id})};
    },
    async getJob({job_id,handle}) {
      await initializeWork(db);
      let h;try{h=JSON.parse(handle);}catch{fail('WORK_HANDLE_INVALID','Commande Work invalide.',503);}
      const row=await first('SELECT r.*,l.project_id,l.user_id,l.version_id FROM fp_work_product_links l JOIN fp_work_mcp_requests r ON r.id=l.request_id JOIN fp_projects p ON p.id=l.project_id AND p.user_id=l.user_id JOIN fp_jobs j ON j.id=l.job_id AND j.project_id=l.project_id AND j.version_id=l.version_id WHERE l.job_id=? AND l.request_id=?',job_id,h.request_id);
      if(!row||h.job_id!==job_id) fail('WORK_BINDING_INVALID','Retour Work non associé à cette commande.',503);
      if(row.status!=='completed') {
        let checkpoint={};try{checkpoint=JSON.parse(row.checkpoint||'{}');}catch{}
        const phase=checkpoint.phase,confirmed={understanding:'J’ai commencé à travailler à partir de votre activité et de votre objectif.',planning:'Je prépare la direction visuelle de votre site.',creating:'La création de votre démo a commencé.',rendering:'Je prépare son aperçu.',BLOCKED:'Votre demande et le travail déjà réalisé sont conservés. Une vérification empêche encore de terminer la livraison.'};
        const text=typeof checkpoint.message==='string'?checkpoint.message.slice(0,2000):confirmed[phase];
        return {status:row.status==='claimed'?'creating':'queued',progress:{stage:'work',label:phase==='BLOCKED'?'Livraison en attente de vérification':'Demande conservée',request_id:row.id,...(text?{confirmed_phase:phase,confirmed_message:text}:{})},recoverable:false};
      }
      const artifact=await first('SELECT * FROM fp_work_mcp_artifacts WHERE request_id=?',row.id);
      const receipt=JSON.parse(row.result);
      if(!artifact||await digest(artifact.html)!==artifact.hash||receipt.client_artifact_sha256!==artifact.hash) return {status:'rendering',progress:{stage:'return',label:'Démo publiée · retour de l’artefact client en attente'},recoverable:false};
      return {status:'ready',progress:{stage:'ready',label:receipt.delivery_qualification==='preview_only'?'Votre démo est disponible pour examen':'Votre démo est prête'},result:{html:artifact.html,hash:artifact.hash,source:'work-mcp',mock:false}};
    },
    async cancel(){fail('WORK_CANCEL_UNAVAILABLE','Une mission Work engagée reste conservée ; aucune nouvelle création n’est lancée.',409);}
  };
}
export function workDeliveryVerifier(db) {
  return {async verify(input) {
    const row=await db.prepare("SELECT r.id,r.result,a.hash FROM fp_work_product_links l JOIN fp_work_mcp_requests r ON r.id=l.request_id JOIN fp_work_mcp_artifacts a ON a.request_id=r.id JOIN fp_projects p ON p.id=l.project_id AND p.user_id=l.user_id WHERE l.project_id=? AND l.version_id=? AND l.job_id=? AND r.status='completed'").bind(input.project_id,input.version_id,input.job_id).first();
    if(!row||row.hash!==input.artifact_hash||input.adapter_kind!=='work-mcp'||input.result_source!=='work-mcp')return {verified:false};
    const receipt=JSON.parse(row.result);if(receipt.delivery_qualification==='preview_only')return {verified:false,reason:'VISUAL_QA_PENDING'};const access=await db.prepare('SELECT 1 AS verified FROM fp_work_client_previews WHERE request_id=? AND project_id=? AND version_id=? AND artifact_hash=?').bind(row.id,input.project_id,input.version_id,row.hash).first();
    if(receipt.client_artifact_sha256!==row.hash||!access)return {verified:false};
    return {...input,receipt_id:row.id,verified:true};
  }};
}

export {recordWorkClientPreview} from './work-client-preview.mjs';
