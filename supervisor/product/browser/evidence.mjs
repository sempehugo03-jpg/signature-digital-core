// Only controlled loopback fixtures from suite.mjs; never captures from a private deployment.
import { readFile } from 'node:fs/promises';
import { privacyCheck } from '../model.mjs';
const branch='evidence/fabrya-product-browser-qa';
export async function readEvidence(api,task){
 try{
  const ref=await api.api(api.path(`git/ref/heads/${branch}`));
  const file=await api.api(api.path(`contents/${task.id}/receipt.json?ref=${ref.object.sha}`));
  const receipt=JSON.parse(Buffer.from(file.content,'base64').toString());privacyCheck(receipt);
  if(receipt.task_id!==task.id||receipt.commit!==task.commit||receipt.scope!=='PUBLIC_CODE_SYNTHETIC_LOOPBACK')throw new Error('BROWSER_EVIDENCE_SCOPE_INVALID');
  return {...receipt,evidence_commit:ref.object.sha};
 }catch(e){if(e.status===404)return null;throw e;}
}
export async function saveEvidence(api,task,report,output){
 const previous=await readEvidence(api,task);if(previous)return previous;
 privacyCheck(report);
 if(!['PASS','FAIL'].includes(report.status)||report.captures.length>90)throw new Error('BROWSER_REPORT_INVALID');
 let head;try{head=(await api.api(api.path(`git/ref/heads/${branch}`))).object.sha;}catch(e){if(e.status!==404)throw e;}
 const base=head?(await api.api(api.path(`git/commits/${head}`))).tree.sha:undefined;
 const entries=[];
 for(const name of report.captures){
  if(!/^[a-z-]+-(1440|390|320)\.png$/.test(name))throw new Error('BROWSER_CAPTURE_FILENAME_INVALID');
  const bytes=await readFile(`${output}/${name}`);
  if(bytes.length>5*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('BROWSER_CAPTURE_INVALID');
  const blob=await api.api(api.path('git/blobs'),'POST',{content:bytes.toString('base64'),encoding:'base64'});
  entries.push({path:`${task.id}/${name}`,mode:'100644',type:'blob',sha:blob.sha});
 }
 const receipt={task_id:task.id,commit:task.commit,run:task.run,result:report.status,effect_count:1,scope:'PUBLIC_CODE_SYNTHETIC_LOOPBACK'};
 entries.push({path:`${task.id}/receipt.json`,mode:'100644',type:'blob',content:JSON.stringify(receipt,null,2)});
 entries.push({path:`${task.id}/report.json`,mode:'100644',type:'blob',content:JSON.stringify(report,null,2)});
 const tree=await api.api(api.path('git/trees'),'POST',{...(base?{base_tree:base}:{}),tree:entries});
 const commit=await api.api(api.path('git/commits'),'POST',{message:`Product synthetic browser evidence ${task.id}`,tree:tree.sha,parents:head?[head]:[]});
 if(head)await api.api(api.path(`git/refs/heads/${branch}`),'PATCH',{sha:commit.sha,force:false});
 else await api.api(api.path('git/refs'),'POST',{ref:`refs/heads/${branch}`,sha:commit.sha});
 return {...receipt,evidence_commit:commit.sha};
}
