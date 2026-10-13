import {modifierHttp} from './postpurchase/http.mjs';
import {runPrivateProbe,diagnosticPage,proofPage} from './postpurchase/private-probe.mjs';
import {createModifier} from './postpurchase/engine.mjs';
import {privateImageProbe} from './postpurchase/private-image-probe.mjs';
import {readSafePhotograph} from './postpurchase/images.mjs';
import {productAuth} from '../product/auth.mjs';
const origin='https://fabrya-product-qa.sempehugo03.chatgpt.site';
const A={id:'appgprj_6acd8ed5ddbc8191bc99a0ab07b50edf',origin:'https://atelier-test-a-work-qa.sempehugo03.chatgpt.site',key:'FABRYA_ENGINE_QA_SITE_A_READ'};
const B={id:'appgprj_6acd8f35784481919fcba8d412f79a3e',origin:'https://atelier-test-b-work-qa.sempehugo03.chatgpt.site',key:'FABRYA_ENGINE_QA_SITE_B_READ'};
const headers={'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff'};
async function readResponse(site,path,env){if(!env[site.key])throw Error('ENGINE_QA_SITE_READ_NOT_CONFIGURED');const canonical=path==='/index.html'?'/':path;const r=await fetch(site.origin+canonical,{headers:{'OAI-Sites-Authorization':'Bearer '+env[site.key]},redirect:'manual',cache:'no-store'});if(!r.ok)throw Error('ENGINE_QA_SITE_READ_HTTP_'+r.status);return r;}
async function saved(db,run){if(!/^qa_[a-f0-9]{32}$/.test(run))throw Error('ENGINE_QA_RUN_INVALID');const row=await db.prepare('SELECT event FROM fm_events WHERE change_ref=? ORDER BY id DESC LIMIT 1').bind(run).first();if(!row)throw Error('ENGINE_QA_RUN_NOT_FOUND');return JSON.parse(row.event).proof;}
export async function enginePrivateRoute(request,env){
 const u=new URL(request.url);if(u.origin!==origin)return new Response('Private Engine only',{status:403});
 if(u.pathname.startsWith('/engine/v1/'))return modifierHttp(request,env);
 if(request.method==='GET'&&u.pathname==='/engine/qa')return new Response(diagnosticPage().replace('</html>','<form method="post" action="/engine/qa/photo"><button>Contrôler une photographie réelle dans le stockage privé</button></form></html>'),{headers:{...headers,'content-type':'text/html; charset=utf-8'}});
 if(request.method==='POST'&&u.pathname==='/engine/qa/photo'){
  if(request.headers.get('origin')!==origin)return new Response('Origin denied',{status:403});
  try{const photo=new Uint8Array(await (await readResponse(A,'/assets/atelier-master.png',env)).arrayBuffer()),proof=await privateImageProbe(env.DB,photo);return new Response('<!doctype html><meta charset="utf-8"><h1>Photographie — preuve hébergée</h1><pre id="proof">'+JSON.stringify(proof,null,2).replace(/[<>&]/g,'')+'</pre><a href="/engine/qa/photo/'+proof.run_ref+'.png">Voir le raster contrôlé et conservé</a>',{headers:{...headers,'content-type':'text/html; charset=utf-8'}});}catch(error){return new Response('<!doctype html><h1>Contrôle interrompu</h1><pre>'+String(error.message).replace(/[<>&]/g,'')+'</pre>',{status:503,headers:{...headers,'content-type':'text/html; charset=utf-8'}});}
 }
 const photoMatch=u.pathname.match(/^\/engine\/qa\/photo\/(photo_[a-f0-9]{32})\.png$/);
 if(request.method==='GET'&&photoMatch){try{const row=await env.DB.prepare('SELECT event FROM fm_events WHERE change_ref=? ORDER BY id DESC LIMIT 1').bind(photoMatch[1]).first();if(!row)return new Response('Not found',{status:404});const proof=JSON.parse(row.event).proof,file=await readSafePhotograph(env.DB,{...proof.scope,sha256:proof.safe_sha256});return new Response(file.bytes,{headers:{...headers,'content-type':file.mime,'x-fabrya-asset-sha256':proof.safe_sha256}});}catch{return new Response('Not found',{status:404});}}
 const asset=u.pathname.match(/^\/engine\/assets\/([A-Za-z0-9_-]{8,160})\/([a-f0-9]{64})\.png$/);
 if(request.method==='GET'&&asset){try{const user=await productAuth({db:env.DB}).user(request);if(!user)return new Response('Unauthorized',{status:401});const p=await env.DB.prepare('SELECT id FROM fp_projects WHERE id=? AND user_id=?').bind(asset[1],user.id).first();if(!p)return new Response('Not found',{status:404});const file=await readSafePhotograph(env.DB,{sha256:asset[2],project_ref:p.id,user_ref:user.id});return new Response(file.bytes,{headers:{...headers,'content-type':'image/png','content-security-policy':"default-src 'none'; sandbox"}});}catch{return new Response('Not found',{status:404});}}
 if(request.method==='POST'&&u.pathname==='/engine/qa/run'){
  if(request.headers.get('origin')!==origin)return new Response('Origin denied',{status:403});
  try{const proof=await runPrivateProbe(env.DB,{siteA:A,siteB:B,readSite:async(site,path)=>(await readResponse(site,path,env)).text()});return new Response(proofPage(proof).replace('<p>Aperçu :','<p><a href="/engine/qa/preview/'+proof.run_ref+'/">Consulter l’aperçu réel conservé</a></p><p>Aperçu :'),{headers:{...headers,'content-type':'text/html; charset=utf-8'}});}catch(error){return new Response('<!doctype html><meta charset="utf-8"><h1>Contrôle interrompu</h1><pre>'+String(error.message).replace(/[<>&]/g,'')+'</pre>',{status:503,headers:{...headers,'content-type':'text/html; charset=utf-8'}});}
 }
 const match=u.pathname.match(/^\/engine\/qa\/preview\/(qa_[a-f0-9]{32})\/(.*)$/);
 if(request.method==='GET'&&match){try{const proof=await saved(env.DB,match[1]);if(match[2]===''){const {adapter}=createModifier({db:env.DB});const html=await adapter.readPreview(proof.preview.scope,{change_ref:proof.preview.change_ref});return new Response(html,{headers:{...headers,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; frame-ancestors 'self'; form-action 'none'",'x-fabrya-artifact-sha256':proof.preview.sha256}});}if(!['style.css','app.js','assets/atelier-master.png'].includes(match[2]))return new Response('Asset not found',{status:404});const r=await readResponse(A,'/'+match[2],env);return new Response(r.body,{headers:{...headers,'content-type':r.headers.get('content-type')||'application/octet-stream'}});}catch(error){return Response.json({error:String(error.message)},{status:404,headers});}}
 return new Response('Engine route not found',{status:404});
}
