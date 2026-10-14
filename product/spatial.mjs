// Persistent presentation only. No project data, requests, progress or billing.
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const constrained=()=>reduced.matches||navigator.connection?.saveData||navigator.connection?.effectiveType==='2g'||(navigator.deviceMemory&&navigator.deviceMemory<=2);
export function spatialState({screen='landing',phase='',tab='',active=false}={}) {
 const view=['login','register'].includes(screen)?'account':screen==='landing'?'arrival':screen==='projects'?'collection':tab==='subscription'?'checkout':tab==='history'?'versions':phase==='creation'?'production':phase==='interrupted'?'interrupted':phase.startsWith('brief')?'brief':active?'studio':'reveal';
 root.dataset.spatialView=view;
 const label=document.querySelector('#spatial-location');
 if(label)label.textContent=({arrival:'Votre vision',account:'Votre espace',collection:'Vos projets',brief:'Votre vision',production:'Création en cours',interrupted:'Projet conservé',reveal:'Votre création',versions:'Vos versions',checkout:'Votre abonnement',studio:'Votre atelier',changes:'Faire évoluer'})[view]||'Votre atelier';
}
function quality(){root.dataset.spatialQuality=constrained()?'quiet':'full';}
quality(); reduced.addEventListener?.('change',quality);navigator.connection?.addEventListener?.('change',quality);
let frame=0;
addEventListener('pointermove',e=>{
 if(constrained()||e.pointerType!=='mouse'||root.dataset.spatialView!=='arrival'||frame)return;
 frame=requestAnimationFrame(()=>{root.style.setProperty('--gaze-x',`${((e.clientX/innerWidth)-.5)*8}px`);root.style.setProperty('--gaze-y',`${((e.clientY/innerHeight)-.5)*5}px`);frame=0;});
},{passive:true});
addEventListener('blur',()=>{root.style.setProperty('--gaze-x','0px');root.style.setProperty('--gaze-y','0px');});
// Post-purchase keeps the same shell on its existing route.
if(document.querySelector('#change-center')){root.dataset.spatialView='changes';const l=document.querySelector('#spatial-location');if(l)l.textContent='Faire évoluer';}
