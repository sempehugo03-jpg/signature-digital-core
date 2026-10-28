import { createHash } from 'node:crypto';
export const REPOSITORY = 'sempehugo03-jpg/signature-digital-core';
export const BRANCH = 'work/fabrya-product-20261010';
export const BASELINE = '903d2715dc0962306d77272755dae574453a149c';
export const STATE_BRANCH = 'state/fabrya-product-supervisor';
export const STATES = ['INTERFACE','QA','BILLING','LIVE_PROOF','PUBLIC_READY','COMPLETE','BLOCKED_HUMAN','BLOCKED_TECHNICAL'];
export const SUPERVISOR_GATES = ['PRODUCT_SUPERVISOR_INSTALLED','PRODUCT_STATE_DURABLE','PRODUCT_RESUME_AFTER_CRASH','PRODUCT_IDEMPOTENCE','PRODUCT_WATCHDOG_RECOVERY','PRODUCT_WORKER_DISPATCH','PRODUCT_QA_DISPATCH','PRODUCT_HUMAN_GATES','PRODUCT_PRIVACY_GATE'];
export function key(action, commit, scope = 'product') { return createHash('sha256').update(`${scope}:${action}:${commit}`).digest('hex'); }
export function initialState(interfaceGates) {
  return { schema_version:1, mission:'fabrya-product-interface', current_commit:BASELINE, product_branch:BRANCH, pr_number:202,
    current_state:'BLOCKED_HUMAN', current_action:null, next_action:'WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION',
    last_successful_action:'ACQUIRED_INTERFACE_QA', last_worker_run:null, last_browser_qa:{commit:BASELINE,evidence:'docs/product/interface-readiness.md',widths:[1440,390,320],status:'ACQUIRED_PASS'},
    last_test_run:{commit:BASELINE,evidence:'docs/product/interface-readiness.md',status:'ACQUIRED_PASS',tests:32}, last_checkpoint:null,
    gates:{...Object.fromEntries(Object.entries(interfaceGates.gates).map(([name,value])=>[name,{...value,commit:BASELINE}])),...Object.fromEntries(SUPERVISOR_GATES.map(name=>[name,{status:'FAIL',evidence:'Not proved'}])),PRODUCT_SUPERVISOR_RECOVERY:{status:'FAIL',evidence:'Controlled hosted recovery not proved'}},
    stages:{INTERFACE:'ACQUIRED_PASS',QA:'ACQUIRED_PASS',BILLING:'READY',LIVE_PROOF:'WAITING_HUMAN_PAYMENT',PUBLIC_READY:'NOT_YET',COMPLETE:'NO'},
    human_blocker:'FIRST_LIVE_PAYMENT_AUTHORIZATION', technical_blocker:null,
    live_payment_status:'NOT_PAID', live_subscription_status:'NOT_PROVED',live_activation_status:'NOT_PROVED',public_deployment_status:'NOT_AUTHORIZED',terminal_state:false,
    authorization:{payment:null,public_deployment:null,new_paid_provider_calls:false},
    readiness:{READY_TO_CHARGE_59_EUR:'NO',reason:'No fresh private project/version/Checkout receipt; inherited readiness is not a charge authorization',amount_minor:5900,currency:'EUR',cadence:'month'},
    ledger:{}, worker_queue:[],qa_queue:[],proof:{status:'PENDING',action:'READ_ONLY_REPOSITORY_PROBE',effect_count:0,recovery_count:0},revision:0 };
}
export function privacyCheck(value) {
 const text = JSON.stringify(value);
 if (/(?:sk_|rk_|whsec_|ghp_|github_pat_|cs_live_|cus_|sub_)[A-Za-z0-9_]+|Bearer\s+\S+|(?:password|cvv|cvc|card_number|session_cookie|checkout_url|email)"\s*:/i.test(text)) throw new Error('PUBLIC_STATE_PRIVACY_REJECTED');
 if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text)) throw new Error('PUBLIC_STATE_CONTACT_REJECTED');
 if (/\b\d{13,19}\b/.test(text)) throw new Error('PUBLIC_STATE_NUMERIC_IDENTIFIER_REJECTED');
 return true;
}
export function validate(state) {
 const allowed = new Set(['schema_version','mission','current_commit','product_branch','pr_number','current_state','current_action','next_action','last_successful_action','last_worker_run','last_browser_qa','last_test_run','last_checkpoint','gates','stages','human_blocker','technical_blocker','live_payment_status','live_subscription_status','live_activation_status','public_deployment_status','terminal_state','authorization','readiness','ledger','worker_queue','qa_queue','proof','revision','pending_zones','pending_files']);
 if(Object.keys(state).some(name=>!allowed.has(name))) throw new Error('PUBLIC_STATE_UNKNOWN_FIELD');

 if(state.mission!=='fabrya-product-interface'||state.product_branch!==BRANCH||state.pr_number!==202||!STATES.includes(state.current_state)) throw new Error('STATE_SCOPE_INVALID');
 if(!/^[a-f0-9]{40}$/.test(state.current_commit)||!Number.isInteger(state.revision)) throw new Error('STATE_INVALID');
 privacyCheck(state); return state;
}
export function changedZones(files) {
 return {ui:files.some(f=>/^product\/(?:client|product\.css|index\.html|assets\/|interface-)/.test(f)),
 product:files.some(f=>/^product\//.test(f)),worker:files.some(f=>/^product\/(?:service|http|auth|stripe-gateway|webhook-ingress|worker-entry|contract|db\/|.*schema)/.test(f))};
}
export function browserEvidenceCurrent(state) {
 const proof=state.last_browser_qa;
 return proof?.status==='PASS' && (proof.commit===state.current_commit || proof.applies_to_commit===state.current_commit);
}
export function reconcile(state, snapshot) {
 validate(state);
 if(snapshot.repository!==REPOSITORY||snapshot.pr.number!==202||snapshot.pr.head.ref!==BRANCH||snapshot.pr.head.sha!==snapshot.head||snapshot.pr.state!=='open') throw new Error('REAL_BRANCH_PR_MISMATCH');
 if(snapshot.baselineAncestor!==true) throw new Error('ACQUIRED_BASELINE_MISSING');
 if(snapshot.head!==state.current_commit){
   const reuseBrowser=browserEvidenceCurrent(state);
   const reuseTests=state.last_test_run?.status==='PASS' && (state.last_test_run.commit===state.current_commit || state.last_test_run.applies_to_commit===state.current_commit);
   const zones=changedZones(snapshot.changedFiles); state.current_commit=snapshot.head;
   // Keep the original executed commit. Only supervisor/docs changes may extend applicability.
   if(snapshot.changedFiles.every(f=>/^(?:supervisor\/product\/|tests\/supervisor\/|docs\/|\.github\/workflows\/fabrya-product-|vercel\.json$)/.test(f))){
    if(reuseBrowser)state.last_browser_qa={...state.last_browser_qa,applies_to_commit:snapshot.head,reuse_reason:'NO_PRODUCT_OR_PRODUCT_TEST_CHANGE'};
    if(reuseTests)state.last_test_run={...state.last_test_run,applies_to_commit:snapshot.head,reuse_reason:'NO_PRODUCT_OR_PRODUCT_TEST_CHANGE'};
   }
   if(zones.product){state.stages.QA='REQUIRED';state.current_state='QA';state.human_blocker=null;state.next_action='PRODUCT_TEST_QA';state.pending_zones=zones;state.pending_files=snapshot.changedFiles.filter(f=>/^product\/|^tests\/product\//.test(f));}
   if(zones.worker){for(const name of ['CHECKOUT_RETURN','CHECKOUT_LONG_RECOVERY'])state.gates[name].status='REVIEW_REQUIRED';}
   if(zones.ui){state.stages.INTERFACE='REVIEW_REQUIRED'; for(const [name,gate] of Object.entries(state.gates)) if(!name.startsWith('PRODUCT_')) gate.status='REVIEW_REQUIRED';}
 }
 return state;
}
export function nextAction(state) {
 if(state.terminal_state) return 'STOP';
 if(state.current_action) return 'RECONCILE_RUNNING_ACTION';
 if(state.proof.status==='PENDING') return 'READ_ONLY_REPOSITORY_PROBE';
 if(state.proof.status==='INTERRUPTED') return 'RECOVER_PROBE';
 if(state.current_state==='BLOCKED_TECHNICAL') return 'STOP';
 if(state.stages.QA==='REQUIRED') return 'PRODUCT_TEST_QA';
 if(state.stages.INTERFACE==='REVIEW_REQUIRED') return 'QUEUE_BROWSER_QA';
 if(state.stages.LIVE_PROOF!=='PASS') return 'WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION';
 return 'WAITING_FOR_PUBLIC_DEPLOYMENT_AUTHORIZATION';
}
export function humanGate(state, action) {
 const publicAction=action==='WAITING_FOR_PUBLIC_DEPLOYMENT_AUTHORIZATION';
 state.current_state='BLOCKED_HUMAN';state.human_blocker=publicAction?'PUBLIC_DEPLOYMENT_AUTHORIZATION':'FIRST_LIVE_PAYMENT_AUTHORIZATION';state.next_action=action;
 // No human authorization can be inferred from a commit, run input, issue or worker result.
 if(publicAction) state.stages.PUBLIC_READY='READY_FOR_REVIEW';
 return state;
}
export function queueTask(state, kind, problem, files) {
 if(!['CODEX','BROWSER_QA'].includes(kind)) throw new Error('TASK_KIND_INVALID');
 if(files.some(f=>f.split('/').includes('..')||!/^product\/|^tests\/product\//.test(f))) throw new Error('TASK_SCOPE_REJECTED');
 const id=key(kind,state.current_commit);
 const queue=kind==='CODEX'?state.worker_queue:state.qa_queue;
 if(!queue.some(t=>t.id===id)) queue.push({id,kind,status:'QUEUED',commit:state.current_commit,branch:BRANCH,problem,files,result_expected:kind==='CODEX'?'Targeted reversible correction preserving acquired gates':'Real pixels/navigation/forms/errors at 1440/390/320; DOM alone insufficient',preserve:Object.keys(state.gates).filter(k=>!k.startsWith('PRODUCT_')),paid_calls_authorized:false,public_deployment_authorized:false});
 return id;
}
export function readiness(state) {return SUPERVISOR_GATES.every(name=>state.gates[name].status==='PASS')&&state.gates.PRODUCT_PERIODIC_WAKE?.status==='PASS'?'PASS':'FAIL';}
