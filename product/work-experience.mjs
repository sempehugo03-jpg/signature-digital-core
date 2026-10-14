import {digest} from './contract.mjs';
export const EXPERIENCE_CONTRACT='business-experience/v1';
const fields=['visitor_question','mechanic','useful_output','visual_surprise','business_reason','why_not_decoration'];
export function validateExperiencePlan(plan){if(!plan||fields.some(k=>typeof plan[k]!=='string'||plan[k].trim().length<15||plan[k].length>1500)||!Array.isArray(plan.rejected_alternatives)||plan.rejected_alternatives.length<2||plan.rejected_alternatives.some(v=>typeof v!=='string'||v.length<15))throw Error('EXPERIENCE_PLAN_REQUIRED');return plan;}
export async function initializeExperiences(db){await db.exec(`CREATE TABLE IF NOT EXISTS fp_work_experiences(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,owner TEXT NOT NULL,base_hash TEXT NOT NULL,plan_json TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TRIGGER IF NOT EXISTS fp_work_experiences_no_update BEFORE UPDATE ON fp_work_experiences BEGIN SELECT RAISE(ABORT,'immutable_experience_plan'); END; CREATE TRIGGER IF NOT EXISTS fp_work_experiences_no_delete BEFORE DELETE ON fp_work_experiences BEGIN SELECT RAISE(ABORT,'immutable_experience_plan'); END;`);}
export async function saveExperiencePlan({db,row,owner,base,plan}){
 if(row.owner!==owner)throw Error('EXPERIENCE_OWNER_REFUSED');validateExperiencePlan(plan);await initializeExperiences(db);
 const link=await db.prepare('SELECT l.*,p.status FROM fp_work_product_links l JOIN fp_projects p ON p.id=l.project_id AND p.user_id=l.user_id WHERE l.request_id=?').bind(row.id).first();if(!link)throw Error('EXPERIENCE_BINDING_REQUIRED');
 if(await db.prepare(`SELECT 1 locked WHERE EXISTS(SELECT 1 FROM fp_activations WHERE project_id=?) OR EXISTS(SELECT 1 FROM fp_subscriptions WHERE project_id=?) OR EXISTS(SELECT 1 FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing','paid'))`).bind(link.project_id,link.project_id,link.project_id).first())throw Error('POSTPURCHASE_ROUTE_REQUIRED');
 if(row.status==='completed'){const current=await db.prepare("SELECT artifact_hash FROM fp_versions WHERE project_id=? AND job_id=? AND state='ready' ORDER BY number DESC LIMIT 1").bind(link.project_id,link.job_id).first();if(base!==current?.artifact_hash)throw Error('EXPERIENCE_BASE_CHANGED');}else base='unbuilt';
 const json=JSON.stringify(plan),id='exp_'+(await digest(row.id+':'+base+':'+json)).slice(0,40);await db.prepare('INSERT OR IGNORE INTO fp_work_experiences VALUES(?,?,?,?,?,?)').bind(id,row.id,owner,base,json,new Date().toISOString()).run();const stored=await db.prepare('SELECT id,created_at,base_hash FROM fp_work_experiences WHERE id=?').bind(id).first();return {request_id:row.id,plan_ref:stored.id,recorded_at:stored.created_at,base_hash:stored.base_hash,persisted:true,construction_executed:false};
}
export async function verifyExperience({db,row,proof,base}){
 let envelope;try{envelope=JSON.parse(row.brief);}catch{}
 const required=envelope?.creative?.signature_contract===EXPERIENCE_CONTRACT||proof.signature_contract===EXPERIENCE_CONTRACT;
 if(!required)return null;await initializeExperiences(db);
 const e=proof.interaction_execution,p=await db.prepare('SELECT * FROM fp_work_experiences WHERE id=? AND request_id=? AND owner=?').bind(e?.plan_ref||'',row.id,row.owner).first();
 if(!p||p.base_hash!==(base||'unbuilt'))throw Error('EXPERIENCE_PLAN_NOT_RECORDED');
 if(!/^[a-z][a-z0-9-]{2,60}$/.test(e.script_id||'')||!Array.isArray(e.control_ids)||e.control_ids.length<2||e.control_ids.some(id=>!/^[a-z][a-z0-9-]{2,60}$/.test(id))||!/^[a-z][a-z0-9-]{2,60}$/.test(e.output_id||'')||!Array.isArray(e.states)||e.states.length<3||e.tests?.status!=='PASS'||!Array.isArray(e.tests.cases)||e.tests.cases.length<3)throw Error('EXPERIENCE_EXECUTION_REQUIRED');
 const html=proof.artifact_html||'',scripts=[...html.matchAll(new RegExp('<script id="'+e.script_id+'">([\\s\\S]*?)<\\/script>','g'))];if(scripts.length!==1||await digest(scripts[0][1])!==e.source_sha256)throw Error('EXPERIENCE_SOURCE_MISMATCH');const script=scripts[0][1];
 for(const id of [...e.control_ids,e.output_id])if(html.split('id="'+id+'"').length!==2||!script.includes(id))throw Error('EXPERIENCE_CONTROL_NOT_CONNECTED');
 if(!script.includes('addEventListener')||!script.includes('textContent'))throw Error('EXPERIENCE_STATE_NOT_CONNECTED');
 if(e.states.some(s=>typeof s!=='string'||!s.trim())||e.tests.cases.some(c=>c.pass!==true||typeof c.name!=='string'))throw Error('EXPERIENCE_TESTS_REQUIRED');
 return {plan_ref:p.id,planned_at:p.created_at,source_sha256:e.source_sha256,control_ids:e.control_ids,output_id:e.output_id,reported_tests:e.tests,visual_qa:proof.desktop?.status==='PASS'&&proof.mobile?.status==='PASS'?'caller_reports_PASS':'NOT_VERIFIED',note:'Server verifies retained plan, actual script bytes and connected IDs; tests are authenticated Work evidence, not independent browser QA or aesthetic certification.'};
}
