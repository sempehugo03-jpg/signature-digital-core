import { creditService, CreditError } from './change-credits.mjs';

// This opt-in adapter shares existing authenticated sessions and Project ownership.
// No publicly callable grant, engine settlement, recharge finalization or publish endpoint.
export async function changeCreditsHttp({request,path,db,identity,env={},clock=()=>Date.now(),modifier=null,billing=null}={}) {
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
    const service=creditService({db,clock,enabled:true,modifier,billing,storage:env.FABRYA_CLIENT_PRIVATE_R2,scanner:env.FABRYA_CLIENT_FILE_SCANNER});
    if(path.length===3&&path[2]==='credits'&&request.method==='GET')return send(await service.overview(user,path[1]));
    if(path.length===3&&path[2]==='changes'&&request.method==='POST'){
      const text=await request.text();if(text.length>12000)throw new CreditError('CREDIT_REQUEST_TOO_LARGE','Demande trop longue.',413);
      let body;try{body=JSON.parse(text);}catch{throw new CreditError('CREDIT_REQUEST_INVALID','Demande incomplète.',400);}
      if(!body||Array.isArray(body)||typeof body!=='object')throw new CreditError('CREDIT_REQUEST_INVALID','Demande invalide.',400);
      return send(await service.request(user,path[1],body),202);
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
      return send(await service.acknowledgeApproval(user,path[1],path[3],body.version_id));
    }
    return send({code:'NOT_FOUND',message:'Opération indisponible.'},404);
  }catch(e){if(e instanceof CreditError)return send({code:e.code,message:e.message},e.status);
    // Database, storage and adapter error details stay server-side.
    return send({code:'CREDIT_UNAVAILABLE',message:'Service temporairement indisponible. Votre projet et vos crédits sont conservés.'},503);
  }
}