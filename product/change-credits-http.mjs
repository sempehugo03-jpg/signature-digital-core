import { creditService, CreditError } from './change-credits.mjs';
import {approvedCreditUnit} from './postpurchase-adapter.mjs';
import {privatePreviewPresentation} from './private-preview-presentation.mjs';

// This opt-in adapter shares existing authenticated sessions and Project ownership.
// No publicly callable grant, engine settlement, recharge finalization or publish endpoint.
export async function changeCreditsHttp({request,path,db,identity,env={},clock=()=>Date.now(),modifier=null,modifierFactory=null,billing=null}={}) {
  const send=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
  try {
    if(env.FABRYA_CREDITS_ENABLED!=='true') throw new CreditError('CREDIT_FEATURE_DISABLED','Ce service est en préparation.',503);
    const user=await identity.user(request);
    if(!user)throw new CreditError('SESSION_EXPIRED','Connectez-vous pour retrouver vos demandes.',401);
    if(!path[1]||!/^[A-Za-z0-9_-]{8,160}$/.test(path[1]))throw new CreditError('CREDIT_NOT_FOUND','Projet introuvable.',404);
    if(request.method!=='GET'){
      const origin=new URL(request.url).origin, supplied=request.headers.get('origin'), site=request.headers.get('sec-fetch-site');
      if(origin!==supplied||(site&&site!=='same-origin'&&site!=='none'))throw new CreditError('CREDIT_ORIGIN','Cette opération n’est pas autorisée.',403);
      await identity.rate(request,'change-credits-'+path[2],user.id,20);
    }
    const owned=await db.prepare('SELECT id FROM fp_projects WHERE id=? AND user_id=?').bind(path[1],user.id).first();
    if(!owned)throw new CreditError('CREDIT_NOT_FOUND','Projet introuvable.',404);
    if(modifierFactory)modifier=await modifierFactory({user,projectId:path[1]});
    const service=creditService({db,clock,enabled:true,modifier,billing,storage:env.FABRYA_CLIENT_PRIVATE_R2,scanner:env.FABRYA_CLIENT_FILE_SCANNER,creditUnitMicroeur:approvedCreditUnit(env)});
    if(path.length===4&&path[2]==='change-files'&&request.method==='GET') {
      const file=await service.readUpload(user,path[1],path[3]);
      return new Response(file.bytes,{headers:{'content-type':'application/octet-stream','content-disposition':'attachment; filename="'+file.filename.replace(/[^A-Za-z0-9._-]/g,'_')+'"','cache-control':'private, no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox"}});
    }
    if(path.length===5&&path[2]==='changes'&&path[4]==='preview'&&request.method==='GET'){
      const logical=await service.readPreview(user,path[1],path[3]);
      const candidate=await db.prepare('SELECT candidate_hash,engine_site_ref FROM fp_change_requests WHERE id=? AND project_id=? AND user_id=?').bind(path[3],path[1],user.id).first();
      let preview;try{preview=await privatePreviewPresentation({html:logical,artifactSha256:candidate.candidate_hash,projectRef:path[1],requestId:path[3],siteRef:candidate.engine_site_ref,modifier});}
      catch{throw new CreditError('CREDIT_PREVIEW_ASSET_UNAVAILABLE','Photographie de l’aperçu indisponible.',503);}
      return new Response(preview.html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-fabrya-artifact-sha256':preview.artifact_sha256,'x-fabrya-preview-presentation-sha256':preview.presentation_sha256,'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts"}});
    }
    if(path.length===3&&path[2]==='credits'&&request.method==='GET')return send(await service.overview(user,path[1]));
    if(path.length===3&&path[2]==='changes'&&request.method==='POST'){
      const text=await request.text();if(text.length>12000)throw new CreditError('CREDIT_REQUEST_TOO_LARGE','Demande trop longue.',413);
      let body;try{body=JSON.parse(text);}catch{throw new CreditError('CREDIT_REQUEST_INVALID','Demande incomplète.',400);}
      if(!body||Array.isArray(body)||typeof body!=='object')throw new CreditError('CREDIT_REQUEST_INVALID','Demande invalide.',400);
      const saved=await service.request(user,path[1],body);
      return send(['reserved','processing'].includes(saved.status)?await service.prepareRequested({requestId:saved.id}):saved,202);
    }
    if(path.length===3&&path[2]==='change-files'&&request.method==='POST'){
      const max=8*1024*1024;
      if(Number(request.headers.get('content-length')||0)>max)throw new CreditError('CREDIT_UPLOAD_SIZE','Fichier limité à 8 Mo.',413);
      const chunks=[];let count=0;
      const reader=request.body?.getReader();
      if(!reader)throw new CreditError('CREDIT_UPLOAD_EMPTY','Aucun fichier reçu.',400);
      while(true){const {value,done}=await reader.read();if(done)break;count+=value.byteLength;
        if(count>max){await reader.cancel();throw new CreditError('CREDIT_UPLOAD_SIZE','Fichier limité à 8 Mo.',413);}chunks.push(value);}
      const bytes=new Uint8Array(count);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      return send(await service.storeUpload(user,path[1],{bytes,mime:request.headers.get('content-type'),filename:request.headers.get('x-fabrya-filename')}),201);
    }
    if(path.length===5&&path[2]==='changes'&&request.method==='POST'&&path[4]==='reject')
      return send(await service.rejectPreview(user,path[1],path[3]));
    if(path.length===5&&path[2]==='changes'&&request.method==='POST'&&path[4]==='acknowledge'){
      const raw=await request.text();if(raw.length>2000)throw new CreditError('CREDIT_REQUEST_TOO_LARGE','Demande trop longue.',413);
      let body;try{body=JSON.parse(raw);}catch{throw new CreditError('CREDIT_REQUEST_INVALID','Demande invalide.',400);}
      await service.acknowledgeApproval(user,path[1],path[3],body.version_id);
      return send(await service.publishApproved({requestId:path[3]}));
    }
    if(path.length===5&&path[2]==='changes'&&request.method==='POST'&&path[4]==='restore'){
      const raw=await request.text();if(raw.length>2000)throw new CreditError('CREDIT_REQUEST_TOO_LARGE','Demande trop longue.',413);
      let body;try{body=JSON.parse(raw);}catch{throw new CreditError('CREDIT_REQUEST_INVALID','Demande invalide.',400);}
      const consent=await service.acknowledgeRestore(user,path[1],path[3],body);
      return send(await service.rollbackPublished({requestId:path[3],customerApprovalRef:consent.approval_ref}));
    }
    return send({code:'NOT_FOUND',message:'Opération indisponible.'},404);
  }catch(e){if(e instanceof CreditError)return send({code:e.code,message:e.message},e.status);
    console.error(JSON.stringify({event:'change_credit_adapter_failed',code:/^[A-Z][A-Z0-9_]{1,100}$/.test(e?.message||'')?e.message:'UNCLASSIFIED'}));
    // Database, storage and adapter error details stay server-side.
    return send({code:'CREDIT_UNAVAILABLE',message:'Service temporairement indisponible. Votre projet et vos crédits sont conservés.'},503);
  }
}
