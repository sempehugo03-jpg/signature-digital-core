import { REPOSITORY, BRANCH, STATE_BRANCH, BASELINE, validate } from './model.mjs';
export class GitHub {
 constructor(token,request=fetch){this.token=token;this.request=request;}
 async api(path,method='GET',body){
  if(!path.startsWith(`/repos/${REPOSITORY}/`)) throw new Error('API_REPOSITORY_SCOPE');
  const r=await this.request(`https://api.github.com${path}`,{method,headers:{Authorization:`Bearer ${this.token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok){const e=new Error(`GITHUB_HTTP_${r.status}`);e.status=r.status;throw e;} return r.status===204?null:r.json();
 }
 path(path){return `/repos/${REPOSITORY}/${path}`;}
 async snapshot(previous){
  const [branch,pr,baseline,current]=await Promise.all([this.api(this.path(`branches/${encodeURIComponent(BRANCH)}`)),this.api(this.path('pulls/202')),this.api(this.path(`compare/${BASELINE}...${encodeURIComponent(BRANCH)}`)),this.api(this.path(`compare/${previous}...${encodeURIComponent(BRANCH)}`))]);
  if(current.files?.length>=300) throw new Error('COMPARE_TRUNCATED');
  return {repository:REPOSITORY,head:branch.commit.sha,pr,baselineAncestor:['ahead','identical'].includes(baseline.status),changedFiles:(current.files||[]).map(f=>f.filename)};
 }
 async load(){
  try{const head=await this.api(this.path(`git/ref/heads/${STATE_BRANCH}`));const blob=await this.api(this.path(`contents/state.json?ref=${head.object.sha}`));return {head:head.object.sha,state:validate(JSON.parse(Buffer.from(blob.content,'base64').toString()))};}
  catch(e){if(e.status===404)return null;throw e;}
 }
 async save(state,expected){
  validate(state);state.revision++; const content=JSON.stringify(state,null,2)+'\n';
  const tree=await this.api(this.path('git/trees'),'POST',{tree:[{path:'state.json',mode:'100644',type:'blob',content}]});
  const commit=await this.api(this.path('git/commits'),'POST',{message:`Product supervisor checkpoint r${state.revision}`,tree:tree.sha,parents:expected?[expected]:[]});
  if(!expected){await this.api(this.path('git/refs'),'POST',{ref:`refs/heads/${STATE_BRANCH}`,sha:commit.sha});}
  else { // No force: two children of the same state commit cannot both update this ref.
   await this.api(this.path(`git/refs/heads/${STATE_BRANCH}`),'PATCH',{sha:commit.sha,force:false});
  }
  return commit.sha;
 }
 async runStatus(run){const r=await this.api(this.path(`actions/runs/${run}`));return {status:r.status,conclusion:r.conclusion,head_sha:r.head_sha};}
}
