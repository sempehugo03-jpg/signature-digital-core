// Additive post-purchase orchestration: never uses the pre-purchase demo engine.
// Public HTTP callers can create requests/approve, never mint credits, settle or publish.
import {SITE_CHANGE_PROTOCOL,validateQuote,validatePreviewReceipt,validatePublicationReceipt,validateRollbackReceipt,validateChangeEnvelope} from '../contracts/site-changes/v1/protocol.mjs';
export const INCLUDED_CREDITS = 100;
export const MAX_CHANGE_CREDITS = 50;
export const MAX_ATTACHMENTS = 5;
const opaque = s => typeof s === 'string' && /^[A-Za-z0-9_-]{8,160}$/.test(s);
const iso = t => new Date(t).toISOString();
export class CreditError extends Error {
  constructor(code, message, status=409) {super(message); this.code=code; this.status=status;}
}
const deny=(code,message,status=409)=>{throw new CreditError(code,message,status);};
const resultCount=r=>Number(r?.meta?.changes??r?.changes??0);
const dateValid=v=>typeof v==='string'&&!Number.isNaN(Date.parse(v))&&v.endsWith('Z');
export function creditService({db,clock=()=>Date.now(),modifier=null,billing=null,storage=null,scanner=null,enabled=false,creditUnitMicroeur=0}={}) {
  if(!db)throw Error('CREDIT_DATABASE_REQUIRED');
  const stamp=()=>iso(clock());
  const first=(sql,...args)=>db.prepare(sql).bind(...args).first();
  const all=async(sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
  const run=(sql,...args)=>db.prepare(sql).bind(...args).run();
  const stmt=(sql,...args)=>db.prepare(sql).bind(...args);
  async function owner(user,id) {
    if(!user?.id||!opaque(id))deny('CREDIT_NOT_FOUND','Projet introuvable.',404);
    const p=await first('SELECT id,active_version_id,status FROM fp_projects WHERE id=? AND user_id=?',id,user.id);
    if(!p)deny('CREDIT_NOT_FOUND','Projet introuvable.',404);
    return p;
  }
  async function eligible(user,id) {
    const p=await owner(user,id);
    const sub=await first('SELECT stripe_subscription_id,state,price_id,amount,currency FROM fp_subscriptions WHERE project_id=?',id);
    const active=await first('SELECT version_id FROM fp_activations WHERE project_id=?',id);
    if(p.status!=='active'||sub?.state!=='active'||sub.amount!==5900||sub.currency!=='eur'||!active)
      deny('CREDIT_SUBSCRIPTION_REQUIRED','Les modifications sont réservées aux abonnements confirmés.',403);
    return {p,sub};
  }
  async function wallets(id,at=stamp()) {
    return all(`SELECT id,source,allowance,held,spent,valid_until,allowance-held-spent AS available
      FROM fp_credit_wallets WHERE project_id=? AND valid_from<=? AND (valid_until IS NULL OR valid_until>?)
      ORDER BY CASE source WHEN 'monthly_invoice' THEN 0 ELSE 1 END,valid_until,id`,id,at,at);
  }
  async function overview(user,id) {
    const project=await owner(user,id);
    const active=await wallets(id);
    const changes=await all(`SELECT id,message,status,credits_held,credits_charged,candidate_version_id,base_release_ref,created_at,updated_at
      FROM fp_change_requests WHERE project_id=? AND user_id=? ORDER BY created_at DESC LIMIT 40`,id,user.id);
    const history=await all(`SELECT h.request_id,h.state,h.amount,h.charged,h.created_at,h.updated_at,w.source
      FROM fp_credit_holds h JOIN fp_credit_wallets w ON w.id=h.wallet_id
      WHERE w.project_id=? ORDER BY h.created_at DESC LIMIT 60`,id);
    let currentSiteUrl=null;
    if(modifier?.publisher_transport_verified===true){
      const binding=await first('SELECT demo_url FROM fp_work_site_bindings WHERE project_id=? AND user_id=? AND version_id=?',id,user.id,project.active_version_id);
      if(binding){const url=new URL(binding.demo_url);if(url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.endsWith('.chatgpt.site'))currentSiteUrl=url.origin+'/index.html';}
    }
    return {current_site_url:currentSiteUrl,monthly_max:INCLUDED_CREDITS,monthly_available:active.filter(w=>w.source==='monthly_invoice').reduce((n,w)=>n+w.available,0),
      recharge_available:active.filter(w=>w.source==='verified_topup').reduce((n,w)=>n+w.available,0),
      reserved:active.reduce((n,w)=>n+w.held,0),next_reset:active.find(w=>w.source==='monthly_invoice')?.valid_until||null,
      changes,history,engine_available:modifier?.kind==='authenticated-site-modifier',
      file_upload_available:!!(storage?.put&&scanner?.verifySafe),recharge_checkout_available:false, policy:'Crédits réservés pendant le traitement ; débit définitif après publication vérifiée. Échec : crédits réservés libérés. La publication reste distincte.'};
  }
  async function readUpload(user,projectId,fileId) {
    await owner(user,projectId);
    const row=await first("SELECT * FROM fp_change_attachments WHERE id=? AND project_id=? AND user_id=? AND scan_state='clean'",fileId,projectId,user.id);
    if(!row)deny('CREDIT_FILE_NOT_FOUND','Fichier introuvable.',404);
    if(!storage?.get)deny('CREDIT_STORAGE_UNAVAILABLE','Fichier indisponible.',503);
    const obj=await storage.get(row.object_key);
    if(!obj)deny('CREDIT_FILE_NOT_FOUND','Fichier introuvable.',404);
    const bytes=new Uint8Array(await obj.arrayBuffer());
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==row.sha256||bytes.length!==row.byte_size)deny('CREDIT_FILE_CORRUPT','Fichier indisponible.',503);
    return {bytes,mime:row.mime,filename:row.filename};
  }
  async function readPreview(user,projectId,changeId) {
    await owner(user,projectId);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=? AND project_id=? AND user_id=?',changeId,projectId,user.id);
    if(!c)deny('CREDIT_PREVIEW_NOT_FOUND','Aperçu introuvable.',404);
    if(!['preview_ready','approved','publishing','published','rolled_back'].includes(c.status)||!c.preview_receipt_json)deny('CREDIT_NO_PREVIEW','Aucun aperçu disponible.',409);
    if(!modifier?.readPreview)deny('CREDIT_ENGINE_UNAVAILABLE','Aperçu en préparation.',503);
    const html=await modifier.readPreview({request_id:c.id,site_ref:c.engine_site_ref,version_ref:c.candidate_version_id});
    if(typeof html!=='string')deny('CREDIT_PREVIEW_UNVERIFIED','Aperçu indisponible.',503);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(html))),b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==c.candidate_hash)deny('CREDIT_PREVIEW_UNVERIFIED','Aperçu indisponible.',503);
    return html;
  }
  // Internal-only operation. Proof comes from the Stripe server gateway, never from the browser.
  async function grantPaidMonth(projectId,invoiceId) {
    if(!enabled||!billing?.getInvoice||!billing?.getSubscription||!billing?.validSubscription)
      deny('CREDIT_BILLING_UNAVAILABLE','Activation de la réserve indisponible.',503);
    if(!opaque(projectId)||!opaque(invoiceId))deny('CREDIT_INVOICE_INVALID','Facture non vérifiable.',400);
    const sub=await first('SELECT * FROM fp_subscriptions WHERE project_id=?',projectId);
    if(!sub||sub.state!=='active')deny('CREDIT_SUBSCRIPTION_REQUIRED','Abonnement non actif.',409);
    const invoice=await billing.getInvoice(invoiceId);
    const linked=invoice?.parent?.subscription_details?.subscription||invoice?.subscription;
    const linkedId=typeof linked==='string'?linked:linked?.id;
    const verified=await billing.getSubscription(sub.stripe_subscription_id);
    // Basil removed Invoice.paid. Provider status remains authoritative;
    // explicit legacy false, unpaid/partial or off-Stripe payments are refused.
    if(verified?.id!==sub.stripe_subscription_id||verified?.status!=='active'||verified?.livemode!==billing.livemode||invoice?.id!==invoiceId||invoice?.status!=='paid'||invoice?.paid===false||invoice?.currency!=='eur'||
       !Number.isSafeInteger(invoice.amount_paid)||invoice.amount_paid<5900||(invoice.amount_remaining!==undefined&&invoice.amount_remaining!==0)||(invoice.amount_paid_off_stripe!==undefined&&invoice.amount_paid_off_stripe!==0)||invoice?.livemode!==billing.livemode||linkedId!==sub.stripe_subscription_id||
       !billing.validSubscription(verified))deny('CREDIT_INVOICE_INVALID','Facture ou abonnement non vérifié.',409);
    const priceId=sub.price_id;
    const line=invoice.lines?.data?.find(x=>{
      const id=x.price?.id||x.pricing?.price_details?.price;
      return id===priceId && x.period?.start && x.period?.end;
    });
    const start=line?.period?.start,end=line?.period?.end;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end-start<25*86400||end-start>35*86400)
      deny('CREDIT_PERIOD_UNVERIFIED','Période de facturation non vérifiée.',409);
    const id='month_'+invoiceId;
    await run(`INSERT OR IGNORE INTO fp_credit_wallets(id,project_id,source,source_ref,allowance,valid_from,valid_until,created_at)
      VALUES(?,?,'monthly_invoice',?,100,?,?,?)`,id,projectId,invoiceId,iso(start*1000),iso(end*1000),stamp());
    const w=await first('SELECT * FROM fp_credit_wallets WHERE source=? AND source_ref=?','monthly_invoice',invoiceId);
    if(w?.project_id!==projectId||w?.allowance!==100||w?.valid_from!==iso(start*1000)||w?.valid_until!==iso(end*1000))
      deny('CREDIT_GRANT_CONFLICT','Une facture ne peut pas créditer deux projets.',409);
    return {wallet_id:w.id,credits:100,valid_until:w.valid_until};
  }
  // Recharges: existing payment gateway must verify a one-time session, amount and approved SKU.
  // No public route or price is exposed until commercial terms are explicitly configured.
  async function grantVerifiedTopup({projectId,intentId}) {
    if(!enabled||!billing?.getSession||!billing?.verifyTopupPrice)
      deny('CREDIT_TOPUP_UNAVAILABLE','Recharges en cours de configuration.',503);
    const intent=await first('SELECT * FROM fp_credit_topup_intents WHERE id=? AND project_id=?',intentId,projectId);
    if(!intent?.stripe_session_id)deny('CREDIT_TOPUP_NOT_FOUND','Recharge introuvable.',404);
    const session=await billing.getSession(intent.stripe_session_id);
    const valid=await billing.verifyTopupPrice(intent.price_id,intent.cents,intent.credits);
    if(!valid||session.id!==intent.stripe_session_id||session.mode!=='payment'||session.payment_status!=='paid'||session.status!=='complete'||
       session.currency!=='eur'||session.amount_total!==intent.cents||session.livemode!==billing.livemode||
       session.metadata?.topup_intent_id!==intent.id||session.metadata?.project_id!==projectId)
      deny('CREDIT_TOPUP_UNVERIFIED','Paiement de la recharge non confirmé.',409);
    const walletId='topup_'+intent.id;
    await db.batch([
      stmt(`INSERT OR IGNORE INTO fp_credit_wallets(id,project_id,source,source_ref,allowance,valid_from,valid_until,created_at)
        VALUES(?,?,'verified_topup',?,?,?,NULL,?)`,walletId,projectId,intent.id,intent.credits,stamp(),stamp()),
      stmt(`UPDATE fp_credit_topup_intents SET state='paid',updated_at=? WHERE id=? AND state IN ('open','paid')`,stamp(),intent.id)
    ]);
    const w=await first('SELECT * FROM fp_credit_wallets WHERE id=?',walletId);
    if(w?.project_id!==projectId||w?.allowance!==intent.credits)deny('CREDIT_TOPUP_CONFLICT','Recharge déjà attribuée.',409);
    return {wallet_id:w.id,credits:w.allowance};
  }
  async function request(user,id,body={}) {
    if(!enabled)deny('CREDIT_FEATURE_DISABLED','Modifications non encore ouvertes.',503);
    const {p}=await eligible(user,id);
    const key=body.request_key;
    if(!opaque(key))deny('CREDIT_INVALID_KEY','Réessayez votre envoi.',400);
    const message=String(body.message??'').trim();
    const attachments=body.attachments??[];
    if(!Array.isArray(attachments)||attachments.length>MAX_ATTACHMENTS||attachments.some(x=>!opaque(x))||new Set(attachments).size!==attachments.length)
      deny('CREDIT_INVALID_ATTACHMENTS','Pièces jointes non valides.',400);
    if((message.length<2 && attachments.length===0)||message.length>2000)
      deny('CREDIT_MESSAGE_INVALID','Décrivez votre demande en quelques mots (2 000 caractères maximum).',400);
    // Retry uses the persisted baseline, even after publication changed current release.
    const prior=await first('SELECT * FROM fp_change_requests WHERE project_id=? AND request_key=?',id,key);
    if(prior){
      if(prior.user_id!==user.id||prior.message!==message||prior.attachment_ids_json!==JSON.stringify(attachments))deny('CREDIT_IDEMPOTENCE_CONFLICT','La demande existe déjà avec un autre contenu.',409);
      return {id:prior.id,status:prior.status,held:prior.credits_held,duplicate:true};
    }
    const trusted=modifier?.kind==='authenticated-site-modifier'&&typeof modifier.quote==='function'&&typeof modifier.findTask==='function'&&typeof modifier.getCurrentRelease==='function';
    const live=trusted ? await modifier.getCurrentRelease({project_id:id,user_ref:user.id}) : null;
    if(trusted && (!opaque(live?.site_ref)||!opaque(live?.version_ref)||!opaque(live?.release_ref)||!(/^[a-f0-9]{64}$/).test(live?.sha256||'')))
      deny('CREDIT_ENGINE_BASE_UNVERIFIED','La version actuelle du site doit être vérifiée.',503);
    const base=trusted?live.version_ref:p.active_version_id;
    if(!base)deny('CREDIT_NO_ACTIVE_VERSION','Aucune version active pour ce projet.',409);
    const payload=JSON.stringify({message,attachments,base,site:live?.site_ref||null});
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload))),b=>b.toString(16).padStart(2,'0')).join('');
    const existing=await first('SELECT * FROM fp_change_requests WHERE project_id=? AND request_key=?',id,key);
    if(existing){if(existing.input_hash!==hash)deny('CREDIT_IDEMPOTENCE_CONFLICT','La demande existe déjà avec un autre contenu.',409);return {id:existing.id,status:existing.status,held:existing.credits_held,duplicate:true};}
    if(attachments.length){
      const files=await all(`SELECT id FROM fp_change_attachments WHERE project_id=? AND user_id=? AND request_id IS NULL AND scan_state='clean'`,id,user.id);
      if(attachments.some(x=>!files.some(f=>f.id===x)))deny('CREDIT_ATTACHMENT_OWNER','Fichier non disponible dans ce projet.',403);
    }
    // One active change at a time, including pending-engine states. Reduces abuse and ambiguity.
    const inFlight=await first(`SELECT id FROM fp_change_requests WHERE project_id=? AND status IN ('awaiting_engine','reserved','processing','preview_ready') LIMIT 1`,id);
    if(inFlight)deny('CREDIT_CHANGE_PENDING','Terminez ou annulez votre demande précédente avant d’en envoyer une autre.',409);
    const identity=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id+':'+key))),b=>b.toString(16).padStart(2,'0')).join('');
    const requestId='chg_'+identity.slice(0,32);
    let hold=0,allocation=[],envelope=null;
    if(trusted){
      if(!Number.isSafeInteger(creditUnitMicroeur)||creditUnitMicroeur<=0)deny('CREDIT_POLICY_NOT_CONFIGURED','Tarification des crédits en préparation.',503);
      const files=attachments.length?await all(`SELECT id,mime,byte_size,sha256 FROM fp_change_attachments WHERE project_id=? AND user_id=? AND scan_state='clean'`,id,user.id):[];
      envelope={protocol:SITE_CHANGE_PROTOCOL,customer_ref:'customer_'+user.id,project_ref:id,site_ref:live.site_ref,change_ref:requestId,
        base_version_ref:base,base_release_ref:live.release_ref,base_sha256:live.sha256,idempotency_key:key,
        message,attachments:attachments.map(a=>{const f=files.find(x=>x.id===a);return {file_ref:f.id,sha256:f.sha256,mime:f.mime,byte_size:f.byte_size};}),requested_at:stamp()};
      validateChangeEnvelope(envelope);
      const q=await modifier.quote(envelope);
      try{validateQuote(q,envelope)}catch{deny('CREDIT_ESTIMATE_UNAVAILABLE','Coût de la modification non vérifié.',503);}
      hold=Math.max(1,Math.ceil(q.max_cost_microeur/creditUnitMicroeur));
      if(hold>MAX_CHANGE_CREDITS)deny('CREDIT_ESTIMATE_EXCEEDS_POLICY','Une validation adaptée est nécessaire pour cette modification.',409);
      let remaining=hold;
      for(const w of await wallets(id)){
        const n=Math.min(w.available,remaining);
        if(n>0){allocation.push({id:w.id,credits:n});remaining-=n;}
        if(!remaining)break;
      }
      if(remaining)deny('CREDIT_RESERVE_EMPTY','Réserve insuffisante. Attendez le renouvellement ou une recharge.',409);
    }
    const state=trusted?'reserved':'awaiting_engine';
    const statements=[stmt(`INSERT OR IGNORE INTO fp_change_requests(id,project_id,user_id,request_key,message,input_hash,attachment_ids_json,base_version_id,status,credits_held,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,requestId,id,user.id,key,message,hash,JSON.stringify(attachments),base,state,hold,stamp(),stamp())];
    if(trusted)statements.push(stmt(`UPDATE fp_change_requests SET engine_site_ref=?,base_release_ref=?,base_sha256=?,engine_envelope_json=? WHERE id=? AND input_hash=?`,live.site_ref,live.release_ref,live.sha256,JSON.stringify(envelope),requestId,hash));
    for(const a of allocation)statements.push(stmt(`INSERT OR IGNORE INTO fp_credit_holds(id,request_id,wallet_id,amount,created_at,updated_at)
      SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM fp_change_requests WHERE id=? AND input_hash=?)`,requestId+'_'+a.id,requestId,a.id,a.credits,stamp(),stamp(),requestId,hash));
    for(const attachment of attachments)statements.push(stmt(`UPDATE fp_change_attachments SET request_id=? WHERE id=? AND project_id=? AND user_id=? AND request_id IS NULL AND EXISTS(SELECT 1 FROM fp_change_requests WHERE id=? AND input_hash=?)`,requestId,attachment,id,user.id,requestId,hash));
    try {await db.batch(statements);} catch(e) {
      if(String(e).includes('CREDIT_WALLET')||String(e).includes('constraint'))deny('CREDIT_RESERVE_RACE','La réserve a changé. Actualisez puis réessayez.',409);
      throw e;
    }
    const saved=await first('SELECT * FROM fp_change_requests WHERE project_id=? AND request_key=?',id,key);
    if(!saved)deny('CREDIT_CHANGE_PENDING','Une autre demande est déjà en cours.',409);
    if(saved.input_hash!==hash)deny('CREDIT_IDEMPOTENCE_CONFLICT','La demande existe déjà avec un autre contenu.',409);
    return {id:saved.id,status:saved.status,held:saved.credits_held,duplicate:saved.id!==requestId};
  }
  // Internal-only dispatch. A lost provider response is reconciled by task ID before retry;
  // unknown outcome pauses rather than creating a second edit.
  async function dispatchPending({requestId}) {
    if(!modifier?.findTask||!modifier?.submitTask)deny('CREDIT_ENGINE_UNAVAILABLE','Moteur de modification non raccordé.',503);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!c)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(c.status==='processing'||c.status==='preview_ready'||c.status==='approved'||c.status==='publishing'||c.status==='published')
      return {id:c.id,status:c.status,duplicate:true};
    if(c.status!=='reserved')deny('CREDIT_CHANGE_NOT_DISPATCHABLE','Demande non prête.',409);
    const previous=await modifier.findTask({change_ref:c.id,site_ref:c.engine_site_ref});
    if(previous===undefined)deny('CREDIT_DISPATCH_AMBIGUOUS','État du moteur incertain : aucune nouvelle tâche créée.',503);
    if(previous!==null && previous.change_ref!==c.id)deny('CREDIT_DISPATCH_CONFLICT','Tâche moteur incohérente.',409);
    // Exact saved command is replayed; no reconstruction or changed body after interruption.
    const envelope=JSON.parse(c.engine_envelope_json||'null');validateChangeEnvelope(envelope);
    const task=previous||await modifier.submitTask(envelope);
    if(!opaque(task?.engine_task_ref)||task?.change_ref!==c.id)deny('CREDIT_DISPATCH_AMBIGUOUS','Tâche moteur non confirmée.',503);
    await run(`UPDATE fp_change_requests SET status='processing',engine_handle=?,updated_at=? WHERE id=? AND status='reserved'`,task.engine_task_ref,stamp(),c.id);
    return {id:c.id,status:'processing',engine_task_ref:task.engine_task_ref};
  }
  // Same authenticated request drives existing Engine operations; retries reconcile
  // the durable task first, never create a parallel job or publisher.
  async function prepareRequested({requestId}) {
    await dispatchPending({requestId});
    const c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!['processing','reserved'].includes(c.status))return {id:c.id,status:c.status,duplicate:true};
    const receipt=await modifier.validatePreview({request_id:c.id,site_ref:c.engine_site_ref});
    return settleVerifiedPreview({requestId:c.id,receipt});
  }
  // Preview is real Engine-owned site data; it is NOT a Product fp_versions row.
  // The hold remains and spent stays zero until verified publication.
  async function settleVerifiedPreview({requestId,receipt}) {
    if(!modifier?.validatePreview)deny('CREDIT_ENGINE_UNAVAILABLE','Preuve moteur indisponible.',503);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!c)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(c.status==='preview_ready')return {id:c.id,status:'preview_ready',charged:0,duplicate:true};
    if(!['reserved','processing'].includes(c.status))deny('CREDIT_CHANGE_NOT_RUNNING','Demande non active.',409);
    const confirmed=await modifier.validatePreview({request_id:c.id,site_ref:c.engine_site_ref,receipt});
    if(!confirmed||confirmed.change_ref!==c.id||confirmed.site_ref!==c.engine_site_ref||confirmed.base_version_ref!==c.base_version_id||
       confirmed.base_sha256!==c.base_sha256||confirmed.state!=='PREVIEW_READY'||confirmed.published!==false||
       !opaque(confirmed.version_ref)||!(/^[a-f0-9]{64}$/).test(confirmed.artifact_sha256||''))
      deny('CREDIT_PREVIEW_UNVERIFIED','Aperçu non encore confirmé par le moteur.',409);
    try{validatePreviewReceipt(confirmed,JSON.parse(c.engine_envelope_json||'null'));}
    catch{deny('CREDIT_PREVIEW_UNVERIFIED','Contrat de l’aperçu invalide.',409);}
    await run(`UPDATE fp_change_requests SET status='preview_ready',candidate_version_id=?,candidate_hash=?,preview_receipt_json=?,updated_at=?
      WHERE id=? AND status IN ('reserved','processing')`,confirmed.version_ref,confirmed.artifact_sha256,JSON.stringify(confirmed),stamp(),c.id);
    return {id:c.id,status:'preview_ready',charged:0,reserved:c.credits_held};
  }
  async function releaseUnpublished(c,state,reason=null){
    const rows=await all("SELECT id FROM fp_credit_holds WHERE request_id=? AND state='held'",c.id);
    await db.batch([...rows.map(h=>stmt("UPDATE fp_credit_holds SET state='released',charged=0,updated_at=? WHERE id=? AND state='held'",stamp(),h.id)),
      stmt("UPDATE fp_change_requests SET status=?,error_code=?,updated_at=? WHERE id=? AND status IN ('awaiting_engine','reserved','processing','preview_ready','approved')",state,reason,stamp(),c.id)]);
    return {id:c.id,status:state,credits_released:c.credits_held};
  }
  async function assertUnpublished(c){
    if(!c.engine_site_ref)return;
    if(!modifier?.getCurrentRelease)deny('CREDIT_PUBLICATION_UNKNOWN','Publication à vérifier avant restitution.',503);
    const current=await modifier.getCurrentRelease({site_ref:c.engine_site_ref});
    if(current?.release_ref!==c.base_release_ref||current?.sha256!==c.base_sha256)
      deny('CREDIT_PUBLICATION_UNKNOWN','La version actuelle du site doit être vérifiée.',503);
  }
  async function markFailed({requestId,reason='ENGINE_FAILED'}) {
    const c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!c)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(['failed','canceled','reverted'].includes(c.status))return {id:c.id,status:c.status,duplicate:true};
    if(!['awaiting_engine','reserved','processing','preview_ready','approved'].includes(c.status))deny('CREDIT_ALREADY_DELIVERED','Publication à vérifier avant restitution.',409);
    await assertUnpublished(c);
    return releaseUnpublished(c,'failed',String(reason).slice(0,100));
  }
  async function storeUpload(user,id,{bytes,mime,filename}={}) {
    if(!enabled||!storage?.put)deny('CREDIT_STORAGE_UNAVAILABLE','Envoi de fichiers temporairement indisponible.',503);
    await eligible(user,id);
    const input=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
    if(input.byteLength<12||input.byteLength>8*1024*1024)deny('CREDIT_UPLOAD_SIZE','Fichier limité à 8 Mo.',413);
    const types={
      'image/png':(b)=>b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71,
      'image/jpeg':(b)=>b[0]===255&&b[1]===216&&b[2]===255,
      'image/webp':(b)=>String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP',
      'application/pdf':(b)=>String.fromCharCode(...b.slice(0,5))==='%PDF-',
      'audio/webm':(b)=>b[0]===26&&b[1]===69&&b[2]===223&&b[3]===163,
      'audio/mpeg':(b)=>String.fromCharCode(...b.slice(0,3))==='ID3'||b[0]===255&&(b[1]&224)===224,
      'audio/wav':(b)=>String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WAVE',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':(b)=>b[0]===80&&b[1]===75&&b[2]===3&&b[3]===4,
    };
    if(!types[mime]?.(input))deny('CREDIT_UPLOAD_TYPE','Format de fichier non accepté.',415);
    const cleanName=String(filename||'document').replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(0,90);
    const recent=await first('SELECT COUNT(*) AS n FROM fp_change_attachments WHERE user_id=? AND created_at>?',user.id,iso(clock()-24*3600000));
    if((recent?.n||0)>=25)deny('CREDIT_UPLOAD_LIMIT','Limite de fichiers atteinte pour aujourd’hui.',429);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',input)),b=>b.toString(16).padStart(2,'0')).join('');
    const fileId='file_'+crypto.randomUUID().replaceAll('-','');
    const objectKey=`client-change-quarantine/${id}/${fileId}`;
    // Private bucket only; no signed/public URLs and no execution of uploaded content.
    await storage.put(objectKey,input,{httpMetadata:{contentType:'application/octet-stream'}});
    try{
      await run(`INSERT INTO fp_change_attachments(id,project_id,user_id,request_id,object_key,filename,mime,scan_state,byte_size,sha256,created_at)
        VALUES(?,?,?,NULL,?,?,?,'quarantine',?,?,?)`,fileId,id,user.id,objectKey,cleanName,mime,input.byteLength,hash,stamp());
    }catch(e){try{if(storage.delete)await storage.delete(objectKey);}catch{}throw e;}
    const proof=scanner?.verifySafe?await confirmSafeUpload({fileId}):null;
    return {id:fileId,filename:cleanName,mime,bytes:input.byteLength,status:proof?.status||'quarantine'};
  }
  async function confirmSafeUpload({fileId}) {
    if(!scanner?.verifySafe||!storage?.get)deny('CREDIT_SCANNER_UNAVAILABLE','Contrôle du fichier non raccordé.',503);
    const f=await first('SELECT * FROM fp_change_attachments WHERE id=?',fileId);
    if(!f||f.scan_state!=='quarantine')deny('CREDIT_UPLOAD_STATE','Fichier déjà vérifié ou indisponible.',409);
    const blob=await storage.get(f.object_key);
    if(!blob)deny('CREDIT_UPLOAD_MISSING','Fichier indisponible.',409);
    const fileBytes=new Uint8Array(await blob.arrayBuffer());
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',fileBytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(digest!==f.sha256||fileBytes.byteLength!==f.byte_size)deny('CREDIT_UPLOAD_INTEGRITY','Fichier à vérifier.',409);
    const ok=await scanner.verifySafe({bytes:fileBytes,mime:f.mime,sha256:f.sha256});
    await run('UPDATE fp_change_attachments SET scan_state=? WHERE id=? AND scan_state=\'quarantine\'',ok?'clean':'rejected',fileId);
    return {fileId,status:ok?'clean':'rejected'};
  }
  async function rejectPreview(user,projectId,changeId) {
    await eligible(user,projectId);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=? AND project_id=? AND user_id=?',changeId,projectId,user.id);
    if(!c)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(c.status==='reverted')return {status:'reverted',duplicate:true,charged:0};
    if(c.status!=='preview_ready')deny('CREDIT_NO_PREVIEW','Aucun aperçu à refuser.',409);
    await assertUnpublished(c);
    await releaseUnpublished(c,'reverted','CUSTOMER_REJECTED_PREVIEW');
    return {status:'reverted',charged:0,credits_released:c.credits_held};
  }
  async function acknowledgeApproval(user,projectId,changeId,chosenVersion) {
    await eligible(user,projectId);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=? AND project_id=? AND user_id=?',changeId,projectId,user.id);
    if(!c||c.candidate_version_id!==chosenVersion)deny('CREDIT_PREVIEW_NOT_FOUND','Version non liée à cette demande.',409);
    if(['approved','publishing','published'].includes(c.status))return {status:c.status,duplicate:true};
    if(c.status!=='preview_ready')deny('CREDIT_NO_PREVIEW','Aucun aperçu à valider.',409);
    await assertUnpublished(c);
    await run("UPDATE fp_change_requests SET status='approved',approval_ref=?,updated_at=? WHERE id=? AND status='preview_ready'",'approval_'+changeId,stamp(),changeId);
    return {status:'approved',version_ref:chosenVersion,public_published:false,charged:0};
  }
  // Internal server-to-server operation, NEVER routed directly from the client.
  // Reconcile a previous unknown publication outcome before repeating the command.
  async function publishApproved({requestId}) {
    if(!modifier?.publish||!modifier?.getCurrentRelease||!modifier?.validateRelease)
      deny('CREDIT_ENGINE_UNAVAILABLE','Publication indisponible.',503);
    let c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!c)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(c.status==='published')return {status:'published',charged:c.credits_charged,duplicate:true};
    if(!['approved','publishing'].includes(c.status))deny('CREDIT_NOT_APPROVED','Aperçu non validé.',409);
    if(modifier.publication_available===false)deny('CREDIT_PUBLISHER_NOT_CONNECTED','Publication temporairement indisponible. Votre validation est conservée.',503);
    if(!Number.isSafeInteger(creditUnitMicroeur)||creditUnitMicroeur<=0)deny('CREDIT_POLICY_NOT_CONFIGURED','Tarification des crédits en préparation.',503);
    // Engine current state is authoritative; if request already published, recover without re-publishing.
    let current=await modifier.getCurrentRelease({site_ref:c.engine_site_ref});
    let publication;
    if(current?.change_ref===c.id&&current?.version_ref===c.candidate_version_id&&current?.sha256===c.candidate_hash){
      await run("UPDATE fp_change_requests SET status='publishing',updated_at=? WHERE id=? AND status='approved'",stamp(),c.id);
      publication=await modifier.validateRelease({change_ref:c.id,release_ref:current.release_ref});
    }else{
      if(c.status==='publishing'&&typeof modifier.reconcilePublication!=='function')deny('CREDIT_PUBLICATION_UNKNOWN','Publication à réconcilier : pas de second appel.',503);
      if(current?.release_ref!==c.base_release_ref||current?.sha256!==c.base_sha256)
        deny('CREDIT_SITE_CHANGED','La version actuelle du site ne correspond plus à votre demande.',409);
      await run("UPDATE fp_change_requests SET status='publishing',updated_at=? WHERE id=? AND status='approved'",stamp(),c.id);
      const publicationArgs={change_ref:c.id,site_ref:c.engine_site_ref,version_ref:c.candidate_version_id,
        artifact_sha256:c.candidate_hash,expected_release_ref:c.base_release_ref,approval_ref:c.approval_ref,idempotency_key:c.request_key};
      // Only an explicit reconciliation capability may resume an ambiguous
      // command. Other adapters retain the fail-closed, no-second-publish rule.
      publication=await (c.status==='publishing'?modifier.reconcilePublication(publicationArgs):modifier.publish(publicationArgs));
      current=await modifier.getCurrentRelease({site_ref:c.engine_site_ref});
      // Verify a public URL and its served bytes in the modifier adapter.
      const checked=await modifier.validateRelease({change_ref:c.id,release_ref:current?.release_ref});
      publication=checked;
    }
    if(!publication?.verified||publication?.change_ref!==c.id||publication?.state!=='PUBLISHED'||
       current?.version_ref!==c.candidate_version_id||current?.sha256!==c.candidate_hash||
       current?.release_ref!==publication.release_ref)
      deny('CREDIT_PUBLICATION_UNVERIFIED','Publication non confirmée : crédits toujours réservés.',503);
    try{validatePublicationReceipt(publication,JSON.parse(c.engine_envelope_json||'null'),JSON.parse(c.preview_receipt_json||'null'));}
    catch{deny('CREDIT_PUBLICATION_UNVERIFIED','Publication hors contrat.',503);}
    if(!Number.isSafeInteger(publication.actual_cost_microeur)||publication.actual_cost_microeur<0||
       !Number.isSafeInteger(creditUnitMicroeur)||creditUnitMicroeur<=0)
      deny('CREDIT_COST_UNVERIFIED','Coût réel du moteur non justifié.',503);
    const actual=Math.min(c.credits_held,Math.max(1,Math.ceil(publication.actual_cost_microeur/creditUnitMicroeur)));
    const holds=await all("SELECT id,amount FROM fp_credit_holds WHERE request_id=? AND state='held' ORDER BY id",c.id);
    if(holds.reduce((n,x)=>n+x.amount,0)!==c.credits_held){
      const settled=await first('SELECT * FROM fp_change_requests WHERE id=?',c.id);
      if(settled.status==='published')return {status:'published',charged:settled.credits_charged,duplicate:true};
      deny('CREDIT_HOLD_INCONSISTENT','Réservation à vérifier.',503);
    }
    let remaining=actual;
    const billable=holds.map(h=>{const part=Math.min(remaining,h.amount);remaining-=part;return {...h,part}});
    await db.batch([
      ...billable.map(h=>stmt("UPDATE fp_credit_holds SET state='settled',charged=?,updated_at=? WHERE id=? AND state='held'",h.part,stamp(),h.id)),
      stmt("UPDATE fp_change_requests SET status='published',engine_release_id=?,credits_charged=?,credits_held=0,published_at=?,updated_at=? WHERE id=? AND status='publishing'",publication.release_ref,actual,stamp(),stamp(),c.id)
    ]);
    return {status:'published',charged:actual,release_ref:publication.release_ref,duplicate:false};
  }
  async function acknowledgeRestore(user,projectId,requestId,{target_release_ref,request_key}={}) {
    await eligible(user,projectId);
    if(!opaque(request_key)||!opaque(target_release_ref))deny('CREDIT_ROLLBACK_REQUEST_INVALID','Choisissez la version à restaurer.',400);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=? AND project_id=? AND user_id=?',requestId,projectId,user.id);
    if(!c||!['published','rolled_back'].includes(c.status)||target_release_ref!==c.base_release_ref)deny('CREDIT_ROLLBACK_REQUEST_INVALID','Version non liée à cette publication.',409);
    const existing=await first('SELECT * FROM fp_change_restore_consents WHERE request_id=?',c.id);
    if(existing){
      if(existing.user_id!==user.id||existing.target_release_ref!==target_release_ref||existing.idempotency_key!==request_key)deny('CREDIT_ROLLBACK_CONFLICT','Une autre restauration est déjà enregistrée.',409);
      return {approval_ref:existing.approval_ref,state:existing.state,duplicate:true};
    }
    const current=await modifier?.getCurrentRelease({site_ref:c.engine_site_ref});
    if(current?.release_ref!==c.engine_release_id||current?.sha256!==c.candidate_hash)deny('CREDIT_ROLLBACK_CONFLICT','Le site a changé depuis cette publication.',409);
    const approval='restore_'+crypto.randomUUID().replaceAll('-','');
    await run(`INSERT OR IGNORE INTO fp_change_restore_consents(id,request_id,project_id,user_id,site_ref,target_release_ref,target_sha256,expected_release_ref,approval_ref,idempotency_key,state,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,'pending',?,?)`,'consent_'+c.id,c.id,projectId,user.id,c.engine_site_ref,c.base_release_ref,c.base_sha256,c.engine_release_id,approval,request_key,stamp(),stamp());
    const saved=await first('SELECT * FROM fp_change_restore_consents WHERE request_id=?',c.id);
    if(!saved||saved.idempotency_key!==request_key)deny('CREDIT_ROLLBACK_CONFLICT','La restauration a changé.',409);
    return {approval_ref:saved.approval_ref,state:saved.state};
  }
  async function rollbackPublished({requestId,customerApprovalRef}) {
    if(!modifier?.restore||!modifier?.getCurrentRelease||!modifier?.validateRelease)deny('CREDIT_ENGINE_UNAVAILABLE','Retour arrière indisponible.',503);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!c||!opaque(customerApprovalRef))deny('CREDIT_ROLLBACK_REQUEST_INVALID','Retour arrière non autorisé.',403);
    const consent=await first('SELECT * FROM fp_change_restore_consents WHERE request_id=? AND approval_ref=?',requestId,customerApprovalRef);
    if(!consent||consent.user_id!==c.user_id||consent.project_id!==c.project_id||consent.site_ref!==c.engine_site_ref||consent.target_release_ref!==c.base_release_ref||consent.target_sha256!==c.base_sha256||consent.expected_release_ref!==c.engine_release_id)deny('CREDIT_ROLLBACK_REQUEST_INVALID','Consentement de restauration non vérifié.',403);
    if(c.status==='rolled_back')return {status:'rolled_back',duplicate:true,charged:c.credits_charged};
    if(c.status!=='published')deny('CREDIT_NOT_PUBLISHED','Aucune version publiée à restaurer.',409);
    const after=await modifier.getCurrentRelease({site_ref:c.engine_site_ref});
    if(after.release_ref!==c.engine_release_id&&after.release_ref!==c.base_release_ref)deny('CREDIT_ROLLBACK_CONFLICT','Le site a changé depuis cette publication.',409);
    await run("UPDATE fp_change_restore_consents SET state='restoring',updated_at=? WHERE id=? AND state='pending'",stamp(),consent.id);
    const receipt=await modifier.restore({change_ref:c.id,site_ref:c.engine_site_ref,target_release_ref:c.base_release_ref,
      expected_release_ref:c.engine_release_id,approval_ref:customerApprovalRef,idempotency_key:consent.idempotency_key});
    const restored=await modifier.getCurrentRelease({site_ref:c.engine_site_ref});
    if(!receipt?.verified||restored?.release_ref!==c.base_release_ref||restored?.sha256!==c.base_sha256)
      deny('CREDIT_ROLLBACK_UNVERIFIED','Retour arrière non confirmé.',503);
    try{const published={release_ref:c.engine_release_id};validateRollbackReceipt(receipt,JSON.parse(c.engine_envelope_json||'null'),published)}
    catch{deny('CREDIT_ROLLBACK_UNVERIFIED','Retour arrière hors contrat.',503)};
    await db.batch([stmt("UPDATE fp_change_requests SET status='rolled_back',updated_at=? WHERE id=? AND status='published'",stamp(),c.id),stmt("UPDATE fp_change_restore_consents SET state='restored',updated_at=? WHERE id=? AND state='restoring'",stamp(),consent.id)]);
    return {status:'rolled_back',charged:c.credits_charged,release_ref:restored.release_ref};
  }
  return {overview,readUpload,readPreview,grantPaidMonth,grantVerifiedTopup,request,dispatchPending,prepareRequested,settleVerifiedPreview,publishApproved,rollbackPublished,acknowledgeRestore,markFailed,storeUpload,confirmSafeUpload,rejectPreview,acknowledgeApproval};
}
