// Additive post-purchase orchestration: never uses the pre-purchase demo engine.
// Public HTTP callers can create requests, not mint credits, settle usage or publish.
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
export function creditService({db,clock=()=>Date.now(),modifier=null,billing=null,storage=null,scanner=null,enabled=false}={}) {
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
    await owner(user,id);
    const active=await wallets(id);
    const changes=await all(`SELECT id,message,status,credits_held,credits_charged,candidate_version_id,created_at,updated_at
      FROM fp_change_requests WHERE project_id=? AND user_id=? ORDER BY created_at DESC LIMIT 40`,id,user.id);
    const history=await all(`SELECT h.request_id,h.state,h.amount,h.charged,h.created_at,h.updated_at,w.source
      FROM fp_credit_holds h JOIN fp_credit_wallets w ON w.id=h.wallet_id
      WHERE w.project_id=? ORDER BY h.created_at DESC LIMIT 60`,id);
    return {monthly_max:INCLUDED_CREDITS,monthly_available:active.filter(w=>w.source==='monthly_invoice').reduce((n,w)=>n+w.available,0),
      recharge_available:active.filter(w=>w.source==='verified_topup').reduce((n,w)=>n+w.available,0),
      reserved:active.reduce((n,w)=>n+w.held,0),next_reset:active.find(w=>w.source==='monthly_invoice')?.valid_until||null,
      changes,history,engine_available:modifier?.kind==='authenticated-site-modifier',
      file_upload_available:!!(storage?.put&&scanner?.verifySafe),recharge_checkout_available:false, policy:'Crédits réservés pendant le traitement ; débit définitif après aperçu vérifié. Échec : crédits réservés libérés. La publication reste distincte.'};
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
    if(invoice?.id!==invoiceId||invoice?.status!=='paid'||invoice?.paid!==true||invoice?.currency!=='eur'||
       invoice.amount_paid<5900||invoice?.livemode!==billing.livemode||linkedId!==sub.stripe_subscription_id||
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
    const base=p.active_version_id;
    if(!base)deny('CREDIT_NO_ACTIVE_VERSION','Aucune version active pour ce projet.',409);
    const payload=JSON.stringify({message,attachments,base});
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
    const trusted=modifier?.kind==='authenticated-site-modifier'&&typeof modifier.quote==='function'&&typeof modifier.findTask==='function';
    let hold=0,allocation=[];
    if(trusted){
      const q=await modifier.quote({project_id:id,request_id:requestId,base_version_id:base,message,attachments});
      if(!Number.isSafeInteger(q?.credits)||q.credits<1||q.credits>MAX_CHANGE_CREDITS||!q?.cost_provenance)
        deny('CREDIT_ESTIMATE_UNAVAILABLE','Coût de la modification non vérifié.',503);
      hold=q.credits;
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
    for(const a of allocation)statements.push(stmt(`INSERT OR IGNORE INTO fp_credit_holds(id,request_id,wallet_id,amount,created_at,updated_at)
      VALUES(?,?,?,?,?,?)`,requestId+'_'+a.id,requestId,a.id,a.credits,stamp(),stamp()));
    for(const attachment of attachments)statements.push(stmt(`UPDATE fp_change_attachments SET request_id=? WHERE id=? AND project_id=? AND user_id=? AND request_id IS NULL`,requestId,attachment,id,user.id));
    try {await db.batch(statements);} catch(e) {
      if(String(e).includes('CREDIT_WALLET')||String(e).includes('constraint'))deny('CREDIT_RESERVE_RACE','La réserve a changé. Actualisez puis réessayez.',409);
      throw e;
    }
    const saved=await first('SELECT * FROM fp_change_requests WHERE project_id=? AND request_key=?',id,key);
    if(saved.input_hash!==hash)deny('CREDIT_IDEMPOTENCE_CONFLICT','La demande existe déjà avec un autre contenu.',409);
    return {id:saved.id,status:saved.status,held:saved.credits_held,duplicate:saved.id!==requestId};
  }
  // Internal engine receipt only: verifies a real persisted version, and never invents a site edit.
  async function settleVerifiedPreview({requestId,receipt}) {
    if(!modifier?.validateReceipt)deny('CREDIT_ENGINE_UNAVAILABLE','Preuve moteur indisponible.',503);
    const change=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!change)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(change.status==='preview_ready')return {id:change.id,status:change.status,charged:change.credits_charged,duplicate:true};
    if(!['reserved','processing'].includes(change.status))deny('CREDIT_CHANGE_NOT_RUNNING','Demande non active.',409);
    const confirmed=await modifier.validateReceipt({request_id:change.id,project_id:change.project_id,base_version_id:change.base_version_id,receipt});
    const version=await first(`SELECT id,artifact_hash,state FROM fp_versions WHERE id=? AND project_id=? AND state='ready'`,confirmed?.version_id,change.project_id);
    if(!version||version.artifact_hash!==confirmed?.artifact_hash||!confirmed?.verified)
      deny('CREDIT_PREVIEW_UNVERIFIED','Aperçu non encore confirmé par le moteur.',409);
    const actual=confirmed.credits;
    if(!Number.isSafeInteger(actual)||actual<0||actual>change.credits_held)deny('CREDIT_COST_OVER_HOLD','Coût final au-delà de la réservation.',409);
    const holds=await all(`SELECT id,amount FROM fp_credit_holds WHERE request_id=? AND state='held' ORDER BY id`,change.id);
    if(holds.reduce((n,h)=>n+h.amount,0)!==change.credits_held)deny('CREDIT_HOLD_INCONSISTENT','Réservation à vérifier.',503);
    let left=actual;
    const queries=[];
    for(const h of holds){let charge=Math.min(h.amount,left);left-=charge;
      queries.push(stmt(`UPDATE fp_credit_holds SET state='settled',charged=?,updated_at=? WHERE id=? AND state='held'`,charge,stamp(),h.id));}
    queries.push(stmt(`UPDATE fp_change_requests SET status='preview_ready',credits_charged=?,candidate_version_id=?,candidate_hash=?,updated_at=? WHERE id=? AND status IN ('reserved','processing')`,actual,version.id,version.artifact_hash,stamp(),change.id));
    await db.batch(queries);
    return {id:change.id,status:'preview_ready',charged:actual};
  }
  async function markFailed({requestId,reason='ENGINE_FAILED'}) {
    const c=await first('SELECT * FROM fp_change_requests WHERE id=?',requestId);
    if(!c)deny('CREDIT_CHANGE_NOT_FOUND','Demande introuvable.',404);
    if(['failed','canceled'].includes(c.status))return {id:c.id,status:c.status,duplicate:true};
    if(!['awaiting_engine','reserved','processing'].includes(c.status))deny('CREDIT_ALREADY_DELIVERED','Un aperçu vérifié ne peut pas être annulé rétroactivement.',409);
    const held=await all("SELECT id FROM fp_credit_holds WHERE request_id=? AND state='held'",requestId);
    await db.batch([...held.map(x=>stmt("UPDATE fp_credit_holds SET state='released',charged=0,updated_at=? WHERE id=? AND state='held'",stamp(),x.id)),
      stmt("UPDATE fp_change_requests SET status='failed',error_code=?,updated_at=? WHERE id=? AND status IN ('awaiting_engine','reserved','processing')",reason.slice(0,100),stamp(),requestId)]);
    return {id:c.id,status:'failed',credits_released:c.credits_held};
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
    if(c.status==='reverted')return {status:'reverted',duplicate:true};
    if(c.status!=='preview_ready')deny('CREDIT_NO_PREVIEW','Aucun aperçu à refuser.',409);
    await run("UPDATE fp_change_requests SET status='reverted',updated_at=? WHERE id=? AND status='preview_ready'",stamp(),changeId);
    // Rejecting a delivered preview does not debit twice or publish a site.
    return {status:'reverted',charged:c.credits_charged};
  }
  async function acknowledgeApproval(user,projectId,changeId,chosenVersion) {
    await eligible(user,projectId);
    const c=await first('SELECT * FROM fp_change_requests WHERE id=? AND project_id=? AND user_id=?',changeId,projectId,user.id);
    if(!c||c.candidate_version_id!==chosenVersion)deny('CREDIT_PREVIEW_NOT_FOUND','Version non liée à cette demande.',409);
    if(c.status==='approved')return {status:'approved',duplicate:true};
    if(c.status!=='preview_ready')deny('CREDIT_NO_PREVIEW','Aucun aperçu à valider.',409);
    const p=await first('SELECT active_version_id FROM fp_projects WHERE id=? AND user_id=?',projectId,user.id);
    if(p.active_version_id!==chosenVersion)deny('CREDIT_VERSION_NOT_APPROVED','Validez d’abord cette version dans votre espace.',409);
    await run("UPDATE fp_change_requests SET status='approved',updated_at=? WHERE id=? AND status='preview_ready'",stamp(),changeId);
    return {status:'approved',version_id:chosenVersion,public_published:false};
  }
  return {overview,grantPaidMonth,grantVerifiedTopup,request,settleVerifiedPreview,markFailed,storeUpload,confirmSafeUpload,rejectPreview,acknowledgeApproval};
}