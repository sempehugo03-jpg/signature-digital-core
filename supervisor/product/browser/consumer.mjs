import { appendFile,readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { GitHub } from '../github.mjs';
import { REPOSITORY,BRANCH,queueTask } from '../model.mjs';
if(process.env.GITHUB_REPOSITORY!==REPOSITORY)throw new Error('BROWSER_SCOPE_INVALID');
const api=new GitHub(process.env.GITHUB_TOKEN);let {state,head}=await api.load();
const run=process.env.GITHUB_RUN_ID;
async function save(action){state.last_checkpoint={run,action,at:new Date().toISOString()};head=await api.save(state,head);}
const mode=process.argv[2]||'claim';
let task=state.qa_queue.find(t=>['RUNNING','RECEIPT'].includes(t.status));
if(mode==='claim'){
 if(task?.status==='RECEIPT'){
  const previous=await api.runStatus(task.run);if(previous.status!=='completed')throw new Error('BROWSER_RECEIPT_RUN_STILL_ACTIVE');
  const {artifacts}=await api.api(api.path(`actions/runs/${task.run}/artifacts`));
  const artifact=artifacts.find(a=>a.name===`fabrya-product-synthetic-qa-${task.id}`&&!a.expired);
  if(!artifact)throw new Error('BROWSER_DURABLE_ARTIFACT_MISSING');
  task.status=task.result;task.recovered_run=run;task.recovery_count=(task.recovery_count||0)+1;
  state.current_action=null;
  state.last_browser_qa={commit:task.commit,run:task.run,recovered_run:run,status:task.result,widths:[1440,390,320],scope:'AUTOMATED_SYNTHETIC_BROWSER',artifact_id:artifact.id,effect_count:task.effect_count};
  if(task.result==='PASS')state.gates.PRODUCT_QA_DISPATCH={status:'PASS',evidence:`Chromium run ${task.run}, uploaded synthetic captures artifact ${artifact.id}; recovered run ${run}, effect_count=${task.effect_count}`};
  else state.gates.PRODUCT_QA_DISPATCH={status:'FAIL',evidence:`Consumer executed but QA failed in ${task.run}`};
  state.technical_blocker=task.result==='PASS'?'PRIVATE_VISUAL_REVIEW_AND_CODEX_TRANSPORT_REQUIRED':'BROWSER_QA_FAILED';
  if(task.result!=='PASS')queueTask(state,'CODEX','Inspect browser report linked by run; repair exact failing Product interaction or overflow; no redesign/paid calls',task.files);
  await save('BROWSER_RECEIPT_RECOVERED_WITHOUT_REEXECUTION');
  await appendFile(process.env.GITHUB_OUTPUT,`execute=false\n`);process.exit(0);
 }
 if(task){const previous=await api.runStatus(task.run);if(previous.status!=='completed')throw new Error('BROWSER_TASK_OWNED_BY_ACTIVE_RUN');
  // No external business effects; incomplete synthetic run can safely replay only without receipt.
  task.status='QUEUED';state.current_action=null;
 }
 const snapshot=await api.snapshot(state.current_commit);
 if(snapshot.head!==state.current_commit||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==snapshot.head)throw new Error('BROWSER_HEAD_NOT_RECONCILED');
 for(const older of state.qa_queue)if(older.commit!==snapshot.head&&older.status==='QUEUED'){older.status='SUPERSEDED';older.superseded_by=snapshot.head;}
 queueTask(state,'BROWSER_QA','Execute current interface regression checks and synthetic browser captures', ['product/client.mjs','product/product.css']);
 task=state.qa_queue.find(t=>t.commit===snapshot.head&&t.status==='QUEUED');
 if(!task){await appendFile(process.env.GITHUB_OUTPUT,'execute=false\n');await save('BROWSER_NO_PENDING_TASK');process.exit(0);}
 task.status='RUNNING';task.run=run;task.started_at=new Date().toISOString();
 state.current_action={id:task.id,kind:'BROWSER_QA',run,status:'RUNNING',started_at:task.started_at};
 await save('BROWSER_CLAIMED');await appendFile(process.env.GITHUB_OUTPUT,`execute=true\ntask_id=${task.id}\n`);
}else if(mode==='receipt'){
 if(!task||task.run!==run||task.status!=='RUNNING')throw new Error('BROWSER_RECEIPT_OWNERSHIP');
 const report=JSON.parse(await readFile('/tmp/fabrya-browser-qa/report.json','utf8'));
 const {artifacts}=await api.api(api.path(`actions/runs/${run}/artifacts`));
 if(!artifacts.some(a=>a.name===`fabrya-product-synthetic-qa-${task.id}`&&!a.expired))throw new Error('BROWSER_UPLOAD_NOT_DURABLE');
 task.status='RECEIPT';task.result=report.status;task.effect_count=(task.effect_count||0)+1;
 state.ledger[task.id]={kind:'BROWSER_QA',status:'SUCCEEDED',commit:task.commit,run,effect_count:task.effect_count};
 await save('BROWSER_CAPTURES_RECEIPT_BEFORE_INTERRUPTION');
 if(state.gates.PRODUCT_QA_DISPATCH.status!=='PASS'){console.log('CONTROLLED_BROWSER_INTERRUPTION_AFTER_UPLOADED_CAPTURES_AND_CHECKPOINT');process.kill(process.pid,'SIGKILL');}
 // The independent Supervisor wake reconciles every receipt, without rerunning the browser.
}
