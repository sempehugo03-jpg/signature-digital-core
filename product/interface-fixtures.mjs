// Private, page-local UI fixtures. No account, DB, Stripe, engine or LIVE mutation.
import { cleanInput, OFFER } from './contract.mjs';
export const FIXTURE_SCENARIOS = ['visitor','active','past_due','unpaid','canceled','pending','slow','failed','timeout','cancelled','empty-history','network-error','offline','session-expired'];
export function interfaceFixture(scenario) {
  const created = '2026-10-11T08:00:00.000Z';
  const input = cleanInput({name:'Atelier du Pic · Démonstration',activity:'Menuiserie sur mesure',description:'Un atelier fictif pour vérifier l’interface.',objective:'Le bois pensé pour votre quotidien.'});
  const versions = [2,1].map(number => ({id:`fixture_v${number}`,number,state:'ready',created_at:created,updated_at:created,modification:number===2?'Plus sobre. Titre : Le bois pensé pour votre quotidien.':'',source:number===1?'brief':'revision'}));
  const state = {project:{id:'fixture_project',company_input:input,draft_revision:1,step:3,status:'review',approved_version_id:'fixture_v2',active_version_id:null,created_at:created,updated_at:created},job:null,versions,subscription:null,activation:null,checkout:null,offer:OFFER};
  if (['active','past_due','unpaid','canceled'].includes(scenario)) {
    state.subscription={state:scenario,amount:5900,currency:'eur',updated_at:created};
    state.project.status=scenario==='active'?'active':'payment_attention';
    state.project.active_version_id='fixture_v2';
    state.activation={version_id:'fixture_v2',created_at:created};
  }
  if (scenario==='pending') state.checkout={state:'creating',updated_at:created};
  if (['slow','failed','timeout','cancelled'].includes(scenario)) {
    state.project.status='creating';
    state.job={id:'fixture_job',job_id:'fixture_job',attempt:1,status:scenario==='slow'?'creating':scenario==='cancelled'?'cancelled':'failed',version:'fixture_v3',recoverable:true,error:scenario==='slow'?null:{message:scenario==='timeout'?'La création prend plus de temps que prévu. Votre brief et vos versions sont conservés.':scenario==='cancelled'?'La création a été annulée. Votre brief reste conservé.':'La création n’a pas abouti. Votre brief et vos versions sont conservés.'}};
  }
  if (['empty-history','offline'].includes(scenario)) {state.project.status='draft';state.project.approved_version_id=null;state.versions=[];}
  return state;
}
export function fixturePreview(number) {
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#f4f0e8;color:#253d30;font:16px system-ui;padding:28px;overflow-wrap:anywhere}h1{font:clamp(32px,5vw,58px) Georgia;line-height:1.12}p{line-height:1.7}a{color:inherit;display:inline-block;padding:14px 0}section{padding:38px 0;border-top:1px solid #bbb;margin-top:38px}</style><header>Atelier du Pic · Exemple fictif</header><p>MENUISERIE SUR MESURE</p><h1>${number===2?'Le bois pensé pour votre quotidien.':'Des meubles à votre mesure.'}</h1><p>Une proposition fictive pour parcourir les états de Fabrya.</p><a href="#approche">Découvrir notre approche ↓</a><section id="approche"><h2>Le projet commence par vos usages.</h2><p>Échange, choix des matières, puis fabrication.</p></section><footer>Démonstration d’interface · V${number} · Aucun paiement</footer></html>`;
}
