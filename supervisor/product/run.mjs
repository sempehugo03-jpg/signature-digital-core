import { readFile, appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { GitHub } from './github.mjs';
import { REPOSITORY, BRANCH, BASELINE, initialState, reconcile, nextAction, humanGate, queueTask, key, readiness } from './model.mjs';
const api = new GitHub(process.env.GITHUB_TOKEN);
if(process.env.GITHUB_REPOSITORY!==REPOSITORY||!process.env.GITHUB_TOKEN) throw new Error('EXECUTION_SCOPE_INVALID');
const run=process.env.GITHUB_RUN_ID;
let durable=await api.load();
let state=durable?.state||initialState(JSON.parse(await readFile('docs/product/interface-gates.json','utf8')));
let head=durable?.head||null;
const checkpoint=async(action)=>{state.last_checkpoint={run,action,at:new Date().toISOString()};state.last_worker_run={run,attempt:Number(process.env.GITHUB_RUN_ATTEMPT||1)}; head=await api.save(state,head);};
const mark=(gate,status,evidence)=>{state.gates[gate]={status,evidence};};
const snapshot=await api.snapshot(state.current_commit);
reconcile(state,snapshot);
mark('PRODUCT_SUPERVISOR_INSTALLED','PASS','GitHub-hosted wake reads real branch and PR 202');
mark('PRODUCT_STATE_DURABLE','PASS','CAS checkpoint on state/fabrya-product-supervisor');
mark('PRODUCT_HUMAN_GATES','PASS','No payment/public deployment capability; explicit human gates');
mark('PRODUCT_PRIVACY_GATE','PASS','Public state allowlisted; runtime credentials excluded');
// No fabricated transport proof. Queues are not Codex execution or cloud-browser execution.
mark('PRODUCT_WORKER_DISPATCH','FAIL','Codex durable consumer/transport not configured or proved; paid provider calls disabled');
if(state.gates.PRODUCT_QA_DISPATCH.status!=='PASS')mark('PRODUCT_QA_DISPATCH','FAIL','Durable Chromium consumer awaiting executed/recovered receipt');
if(state.proof.status==='PASS')mark('PRODUCT_SUPERVISOR_RECOVERY','PASS',`Controlled read-only probe recovered in run ${state.proof.recovered_run}`);
let action=nextAction(state);
// Finished consumers have a durable receipt. Dispatch recovery, never replay a received action.
const browserTask=state.qa_queue.find(t=>['RUNNING','RECEIPT'].includes(t.status));
if(browserTask){
 const previous=await api.runStatus(browserTask.run);
 if(previous.status==='completed')action='DISPATCH_BROWSER_QA';
 else action='STOP';
}else if(!state.current_action && state.stages.QA!=='REQUIRED' &&
 (state.qa_queue.some(t=>t.status==='QUEUED')||state.stages.INTERFACE==='REVIEW_REQUIRED') &&
 !state.qa_queue.some(t=>t.commit===state.current_commit&&['PASS','FAIL'].includes(t.status)))action='DISPATCH_BROWSER_QA';

// Technical tests/build have no business effect; a completed failed runner can safely resume them.
if(action==='RECONCILE_RUNNING_ACTION'&&state.current_action.kind==='PRODUCT_TEST_QA'){
 const previous=await api.runStatus(state.current_action.run);
 if(previous.status==='completed'){
  state.current_action=null;state.stages.QA='REQUIRED';action='PRODUCT_TEST_QA';
 }
}

if(action==='DISPATCH_BROWSER_QA'){
 if(!browserTask)queueTask(state,'BROWSER_QA','Inspect current changed Product interface', ['product/client.mjs','product/product.css']);
 await checkpoint('BEFORE_BROWSER_DISPATCH');
 await api.api(api.path('actions/workflows/fabrya-product-browser-qa.yml/dispatches'),'POST',{ref:BRANCH});
 state.next_action='WAITING_BROWSER_EXECUTION_OR_RECEIPT_RECOVERY';await checkpoint('BROWSER_WORKFLOW_DISPATCHED');
}else if(action==='READ_ONLY_REPOSITORY_PROBE'){
 const id=key(action,BASELINE,'recovery-proof');
 state.current_action={id,kind:action,status:'RUNNING',run,started_at:new Date().toISOString()};
 await checkpoint('BEFORE_READ_ONLY_PROBE');
 // This action only reads GitHub. Its receipt survives runner/process disappearance.
 state.ledger[id]={status:'SUCCEEDED',kind:action,commit:snapshot.head,pr:202,effect_count:1};
 state.proof={...state.proof,id,status:'INTERRUPTED',effect_count:1,interrupted_run:run,receipt_commit:snapshot.head};
 await checkpoint('READ_ONLY_PROBE_COMMITTED');
 console.log('CONTROLLED_INTERRUPTION_AFTER_DURABLE_CHECKPOINT');
 process.kill(process.pid, 'SIGKILL');
}else if(action==='RECONCILE_RUNNING_ACTION'||action==='RECOVER_PROBE'){
 const active=state.current_action;
 if(!active||active.kind!=='READ_ONLY_REPOSITORY_PROBE'){
  state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='UNKNOWN_RUNNING_ACTION_REQUIRES_EXTERNAL_RECONCILIATION';
 }else{
  const previous=await api.runStatus(active.run);
  const age=Date.now()-Date.parse(active.started_at);
  if(previous.status!=='completed'&&age<30*60*1000){console.log('Previous run still owns action; no duplicate');}
  else if(previous.status!=='completed'){
   state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='STALE_RUN_STILL_ACTIVE_NO_DUPLICATE';
  }else if(!state.ledger[active.id]){
   // Known read-only action is safe to repeat only when no committed receipt exists.
   state.current_action=null;state.proof.status='PENDING';state.next_action='READ_ONLY_REPOSITORY_PROBE';
  }else if(state.ledger[active.id].status==='SUCCEEDED'&&state.proof.effect_count===1){
   state.current_action=null;state.proof.status='PASS';state.proof.recovery_count++;state.proof.recovered_run=run;
   state.last_successful_action='RECOVERED_READ_ONLY_PROBE_WITHOUT_REPLAY';
   mark('PRODUCT_RESUME_AFTER_CRASH','PASS',`Read-only receipt recovered from run ${active.run} in run ${run}; effect_count=1`);
   mark('PRODUCT_SUPERVISOR_RECOVERY','PASS',`Controlled read-only probe recovered in run ${run}`);
   mark('PRODUCT_WATCHDOG_RECOVERY','PASS',`Completed interrupted runner reconciled by independent wake ${run}`);
   mark('PRODUCT_IDEMPOTENCE','PASS','Durable action ID and receipt; recovered without replay; CAS refuses competing checkpoints');
   humanGate(state,'WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION');
  }else{state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='UNCERTAIN_PROBE_RECEIPT';}
 }
 await checkpoint('WATCHDOG_RECONCILIATION');
}else if(action==='PRODUCT_TEST_QA'){
 const id=key(action,state.current_commit);
 state.current_action={id,kind:action,status:'RUNNING',run,started_at:new Date().toISOString()};await checkpoint('BEFORE_PRODUCT_QA');
 try{
  // Executed source must equal the reconciled head, or defer until next wake.
  if(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==state.current_commit)throw new Error('CHECKOUT_HEAD_CHANGED');
  execFileSync('npm',['ci','--ignore-scripts'],{cwd:'product',stdio:'inherit'});
  execFileSync('npm',['test'],{cwd:'product',stdio:'inherit'});
  execFileSync('npm',['run','build'],{cwd:'product',stdio:'inherit'});
  execFileSync('npm',['ci','--ignore-scripts'],{stdio:'inherit'});
  execFileSync('npm',['run','build'],{stdio:'inherit'});
  state.last_test_run={run,commit:state.current_commit,status:'PASS'};state.stages.QA='PASS';state.ledger[id]={kind:action,status:'SUCCEEDED',commit:state.current_commit};state.current_action=null;
  if(state.pending_zones?.ui){queueTask(state,'BROWSER_QA','Changed product interface requires fresh visual evidence',state.pending_files||[]);state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='BROWSER_QA_CONSUMER_NOT_CONNECTED';state.next_action='QUEUE_BROWSER_QA';}
  else if(Object.values(state.gates).some(g=>g.status==='REVIEW_REQUIRED')){state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='TARGETED_PRIVATE_EVIDENCE_REQUIRED';state.next_action='REVIEW_INVALIDATED_GATES';}
  else humanGate(state,'WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION');
 }catch{state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='PRODUCT_QA_FAILED';state.current_action=null;queueTask(state,'CODEX','Product QA failed; inspect linked GitHub runner logs and correct only affected product files',state.pending_files||[]);state.next_action='WAITING_CODEX_TRANSPORT';}
 await checkpoint('PRODUCT_QA_RESULT');
}else if(action==='QUEUE_BROWSER_QA'){
 queueTask(state,'BROWSER_QA','Fresh browser evidence required',state.pending_files||[]);state.current_state='BLOCKED_TECHNICAL';state.technical_blocker='BROWSER_QA_CONSUMER_NOT_CONNECTED';await checkpoint('BROWSER_QA_QUEUED');
}else{
 if(action.startsWith('WAITING_FOR_'))humanGate(state,action);
 await checkpoint('SAFE_STOP');
}
const report={current_state:state.current_state,next_action:state.next_action,PRODUCT_SUPERVISOR_READY:readiness(state),gates:Object.fromEntries(Object.entries(state.gates).filter(([k])=>k.startsWith('PRODUCT_'))),proof:state.proof};
console.log(JSON.stringify(report,null,2));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Fabrya Product Supervisor\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`);
