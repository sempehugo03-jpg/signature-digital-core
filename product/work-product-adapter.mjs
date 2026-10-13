// Transport adapter to the existing MCP Events queue; never a generator.
import { initializeWork, enqueueWorkRequest } from './work-mcp.mjs';
import { digest, fail } from './contract.mjs';
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
        const brief=JSON.stringify({fictional_qa:true,company:input.company_input,revision:input.revision||'',delivery:'Rendre un artefact HTML autonome dans proof.artifact_html, avec proof.client_artifact_sha256 ; aucun provider payant. Vérifier les vrais pixels et les accès avant le reçu.',commercial_goal:input.company_input?.objective});
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
        return {status:row.status==='claimed'?'creating':'queued',progress:{stage:'work',label:checkpoint.phase==='BLOCKED'?'Démo conservée · vérifications Work en attente':'Création confiée à Work',request_id:row.id},recoverable:false};
      }
      const artifact=await first('SELECT * FROM fp_work_mcp_artifacts WHERE request_id=?',row.id);
      const receipt=JSON.parse(row.result);
      if(!artifact||await digest(artifact.html)!==artifact.hash||receipt.client_artifact_sha256!==artifact.hash) return {status:'rendering',progress:{stage:'return',label:'Démo publiée · retour de l’artefact client en attente'},recoverable:false};
      return {status:'ready',progress:{stage:'ready',label:'Votre démo Work est prête'},result:{html:artifact.html,hash:artifact.hash,source:'work-mcp',mock:false}};
    },
    async cancel(){fail('WORK_CANCEL_UNAVAILABLE','Une mission Work engagée reste conservée ; aucune nouvelle création n’est lancée.',409);}
  };
}
export function workDeliveryVerifier(db) {
  return {async verify(input) {
    const row=await db.prepare("SELECT r.id,r.result,a.hash FROM fp_work_product_links l JOIN fp_work_mcp_requests r ON r.id=l.request_id JOIN fp_work_mcp_artifacts a ON a.request_id=r.id JOIN fp_projects p ON p.id=l.project_id AND p.user_id=l.user_id WHERE l.project_id=? AND l.version_id=? AND l.job_id=? AND r.status='completed'").bind(input.project_id,input.version_id,input.job_id).first();
    if(!row||row.hash!==input.artifact_hash||input.adapter_kind!=='work-mcp'||input.result_source!=='work-mcp')return {verified:false};
    const receipt=JSON.parse(row.result);const access=await db.prepare('SELECT 1 AS verified FROM fp_work_client_previews WHERE request_id=? AND project_id=? AND version_id=? AND artifact_hash=?').bind(row.id,input.project_id,input.version_id,row.hash).first();
    if(receipt.client_artifact_sha256!==row.hash||!access)return {verified:false};
    return {...input,receipt_id:row.id,verified:true};
  }};
}

export {recordWorkClientPreview} from './work-client-preview.mjs';
