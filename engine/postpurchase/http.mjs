import {authenticateRequest} from './auth.mjs';
import {createModifier} from './engine.mjs';
import {productApprovalVerifier} from './product-approval.mjs';
import {productImageResolver} from './images.mjs';
const allowed=new Set(['quote','findTask','submitTask','getTask','validatePreview','publish','getCurrentRelease','restore','validateRelease']);
// Exact host/owner edge gating belongs to the retained private Worker entry.
export async function modifierHttp(request,env,dependencies={}){
 const path=new URL(request.url).pathname,method=path.split('/').at(-1),db=env.DB;
 const headers={'cache-control':'private, no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'};
 if(request.method!=='POST'||!allowed.has(method))return Response.json({error:'ENGINE_METHOD_NOT_FOUND'},{status:404,headers});
 try{
  const verified=await authenticateRequest(request,{secret:env.FABRYA_MODIFIER_PRODUCT_SECRET,replayStore:{async consume(service,nonce,expires){const r=await db.prepare('INSERT OR IGNORE INTO fm_nonces(service_id,nonce,expires_at) VALUES(?,?,?)').bind(service,nonce,expires).run();return r.meta.changes===1;}}});
  const input=JSON.parse(verified.body);if(!input.scope||Object.keys(input.scope).some(k=>!['customer_ref','project_ref'].includes(k)))throw Error('ENGINE_SCOPE_INVALID');
  const {adapter}=createModifier({db,productApproval:productApprovalVerifier(db),assetResolver:productImageResolver(db),...dependencies});return Response.json(await adapter[method](input.scope,input.args),{headers});
 }catch(error){const code=String(error.message||'ENGINE_ERROR');return Response.json({error:code},{status:/UNAUTHORIZED|PRINCIPAL|AUTH_NOT_CONFIGURED/.test(code)?401:/REPLAY|CONFLICT|BUSY|APPROVAL_REQUIRED/.test(code)?409:/NOT_FOUND/.test(code)?404:/NOT_CONNECTED|COST_POLICY|REQUIRED/.test(code)?503:400,headers});}
}
