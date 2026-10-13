import { interfaceFixture, FIXTURE_SCENARIOS } from '/product-assets/interface-fixtures.mjs';
const scenario = new URLSearchParams(location.search).get('scenario');
if (!FIXTURE_SCENARIOS.includes(scenario)) throw new Error('Unknown UI scenario');
let state=interfaceFixture(scenario);
const nativeFetch=window.fetch.bind(window);
const nativeReplace=window.history.replaceState.bind(window.history);
window.history.replaceState=(data,title,url)=>{if(url==null)return nativeReplace(data,title,url);const target=new URL(url,location.href);if(target.pathname==='/interface-fixture')target.searchParams.set('scenario',scenario);return nativeReplace(data,title,target.pathname+target.search+target.hash);};
const store=new Map();
Object.defineProperty(window,'localStorage',{value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
window.fetch=async (url,options={}) => {
  if (url==='/product-assets/config.json') return Response.json({qa:false,payment_mode:'live',engine_mode:'mock'});
  if (!String(url).startsWith('/api/interface-fixtures/')) return nativeFetch(url,options);
  const path=String(url).slice('/api/interface-fixtures/'.length);
  if(path==='auth/session') return Response.json({user:scenario==='visitor'?null:{id:'fixture_user',firstName:'Camille',email:'exemple@fabrya.invalid'}});
  if(path==='events') return Response.json({ok:true});
  if(scenario==='session-expired'&&path.startsWith('projects/')) return Response.json({code:'SESSION_EXPIRED',message:'Reconnectez-vous pour retrouver votre projet. Votre travail reste sauvegardé.'},{status:401});
  if(path==='projects') return Response.json({projects:[{...state.project,name:state.project.company_input.name}]});
  if(scenario==='network-error'&&options.method==='POST') throw new TypeError('Simulated network interruption');
  if(options.method==='PATCH') {const body=JSON.parse(options.body);state.project.company_input=body.company_input;state.project.step=body.step;state.project.draft_revision++;}
  if(path.endsWith('/portal')) return Response.json({code:'UI_FIXTURE',message:'Démonstration uniquement : aucun portail de paiement réel n’est ouvert.'},{status:409});
  if(path.endsWith('/checkout')) return Response.json({code:'UI_FIXTURE',message:'Démonstration uniquement : aucun paiement n’est créé.'},{status:409});
  if(path.endsWith('/cancel')) {state.job.status='cancelled';state.job.error={message:'La création a été annulée. Votre brief reste conservé.'};}
  if(path.endsWith('/retry')) {state.job=null;state.project.status='review';return Response.json({job:{status:'ready',version:'fixture_v2'}});}
  if(path.endsWith('/approve')) {const version=JSON.parse(options.body).version_id;state.project.approved_version_id=version;if(state.project.status==='active'){state.project.active_version_id=version;state.activation.version_id=version;}}
  return Response.json(state);
};
await import('/product-assets/fixture-product-client.mjs');

if(scenario==='offline') {
 const controls=document.createElement('aside');controls.className='fixture-note';
 controls.innerHTML='<button type="button" id="fixture-disconnect">Simuler hors connexion</button> <button type="button" id="fixture-reconnect">Simuler le retour réseau</button>';
 document.body.prepend(controls);
 controls.querySelector('#fixture-disconnect').addEventListener('click',()=>window.dispatchEvent(new Event('offline')));
 controls.querySelector('#fixture-reconnect').addEventListener('click',()=>window.dispatchEvent(new Event('online')));
}
