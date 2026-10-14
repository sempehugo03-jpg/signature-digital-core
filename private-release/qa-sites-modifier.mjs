import {qaCreditPolicy} from '../product/qa-credit-policy.mjs';
import {createProductModifier} from '../engine/postpurchase/product-adapter.mjs';
import {createSitesDataPublisher} from '../engine/postpurchase/sites-data-publisher.mjs';
import {ModifierStore} from '../engine/postpurchase/durable-store.mjs';
import {authoredWorkBaseline,retainedWorkBaseline} from '../product/work-engine-baseline.mjs';
import {compactArtifactHtml,renderConfigHash} from '../engine/postpurchase/artifact-storage.mjs';

// Retained QA only. A Work binding, active subscription and exact delivered
// artifact are independently checked before registering its Engine baseline.
const originals=Object.freeze([
 {tag:'A',site:'appgprj_6acd8ed5ddbc8191bc99a0ab07b50edf',project:'prj_4325cb35e05efb496e82149304022e20',user:'b8a064c2-3f70-4e36-b2cf-371ebbb395af',version:'ver_694383e22ccb570cd064d697b7d2c9c3',hash:'09e2612241991aa59cf8d5f936f3d40c9ccd82b4aa505d04c189a16609c98064',origin:'https://atelier-test-a-work-qa.sempehugo03.chatgpt.site'},
 {tag:'B',site:'appgprj_6acd8f35784481919fcba8d412f79a3e',project:'prj_00a9417b403eb38ad7902bf505870ed5',user:'a5492add-0f1d-44eb-88d2-e7785a41109d',version:'ver_3c67491440307b9371567724235c18b8',hash:'b5d8479313a3c98e0e874a40374449a3fe97df8fd7c7438a731e846d54e3bda4',origin:'https://atelier-test-b-work-qa.sempehugo03.chatgpt.site'}
]);
function publisherFor(o,env,db=null){
 const original=originals.find(x=>x.site===o.site&&x.project===o.project&&x.user===o.user&&x.version===o.version&&x.hash===o.hash);
 const writerSecret=env['FABRYA_ENGINE_SITE_'+o.site+'_WRITE_SECRET']||(original&&env['FABRYA_ENGINE_QA_SITE_'+original.tag+'_WRITE_SECRET']);
 const serviceToken=env['FABRYA_ENGINE_SITE_'+o.site+'_READ']||(original&&env['FABRYA_ENGINE_QA_SITE_'+original.tag+'_READ']);
 if(!writerSecret||!serviceToken)return {original};
 const binding={customer_ref:'customer_'+o.user,origin:new URL(o.demo_url).origin,project_ref:o.project,site_project_id:o.site,site_ref:o.site};
 return {original,binding,publisher:createSitesDataPublisher({sites:[{binding,writerSecret,serviceToken}],db})};
}
// Called only by authenticated Work completion, before accepting a new demo.
// The Site writer must already exist; this does not deploy or spend money.
export async function verifyWorkSitePublisher(o,env){
 if(env.FABRYA_PRODUCT_QA!=='true'||env.FABRYA_STRIPE_MODE!=='test')throw Error('WORK_PUBLISHER_QA_ONLY');
 const {publisher,binding,original}=publisherFor(o,env);
 if(!publisher)throw Error('WORK_PUBLISHER_NOT_PROVISIONED');
 const baseline=o.authored?await authoredWorkBaseline(o.html,o.hash,o.authored):original?await retainedWorkBaseline(o.html,o.hash):null;
 if(!baseline)throw Error('WORK_AUTHORED_BASELINE_REQUIRED');
 if(await publisher.reconcile({site:binding,command_key:'bootstrap_'+o.version})!==null)throw Error('WORK_BOOTSTRAP_COMMAND_CONFLICT');
 const release_ref='work_release_'+o.version;
 await publisher.verify({site:binding,release:{release_ref},expected_sha256:o.hash});
 return {verified:true,site_project_id:o.site,release_ref,sha256:o.hash};
}
export async function qaSitesModifier(options,env){
 const {db,principal}=options;
 if(env.FABRYA_PRODUCT_QA!=='true'||env.FABRYA_STRIPE_MODE!=='test')return createProductModifier(options);
 const verified=await db.prepare(`SELECT b.site_project_id AS site,b.project_id AS project,b.user_id AS user,b.version_id AS version,
   b.client_artifact_sha256 AS hash,b.demo_url,v.html,w.result FROM fp_work_site_bindings b
   JOIN fp_work_product_links l ON l.request_id=b.request_id AND l.project_id=b.project_id AND l.user_id=b.user_id AND l.version_id=b.version_id
   JOIN fp_work_mcp_requests w ON w.id=b.request_id JOIN fp_versions v ON v.id=b.version_id AND v.project_id=b.project_id
   JOIN fp_projects p ON p.id=b.project_id JOIN fp_activations a ON a.project_id=p.id
   JOIN fp_subscriptions s ON s.project_id=p.id WHERE b.project_id=? AND b.user_id=? AND p.user_id=b.user_id
   AND w.status='completed' AND v.artifact_hash=b.client_artifact_sha256
   AND a.version_id=b.version_id AND a.artifact_hash=b.client_artifact_sha256
   AND s.state='active' AND s.amount=5900 AND s.currency='eur'`).bind(principal.project_ref,principal.customer_ref?.replace(/^customer_/,'' )).first();
 if(!verified)return createProductModifier(options);
 const o=verified;
 // Historical aliases preserve A/B secrets. Eligibility is determined by the
 // verified delivery above, never by these aliases or a browser site ref.
 const {publisher,binding,original}=publisherFor(o,env,db);
 if(!publisher)return createProductModifier(options);
 // Signed lookup only: initializes immutable original Site data, but cannot
 // create a publication command, change served HTML or charge any credit.
 // Keep ordinary account/credit reads usable if transport is unavailable.
 try {
  const absent=await publisher.reconcile({site:binding,command_key:'bootstrap_'+o.version});
  if(absent!==null)throw Error('QA_BOOTSTRAP_COMMAND_CONFLICT');
 } catch {return createProductModifier(options);}
 const store=new ModifierStore(db),existing=await store.first('SELECT * FROM fm_sites WHERE site_ref=?',o.site);
 if(!existing){
  const receiptProof=JSON.parse(verified.result).proof;
  const baseline=receiptProof?.site_change_baseline?await authoredWorkBaseline(verified.html,o.hash,receiptProof.site_change_baseline):original?await retainedWorkBaseline(verified.html,o.hash):null;
  if(!baseline)return createProductModifier(options);
  const release_ref='work_release_'+o.version;
  const receipt={release_ref,site_project_id:o.site,artifact_sha256:o.hash,actual_cost_microeur:null};
  await publisher.verify({site:binding,release:receipt,expected_sha256:o.hash});
  const config={...binding,template:baseline.template,manifest:baseline.manifest,source_kind:'retained-original-work-client-artifact',original_work_version:o.version,original_work_hash:o.hash};
  config.render_config_sha256=await renderConfigHash(config);
  const artifactHtml=await compactArtifactHtml({html:verified.html,content_json:baseline.content_json,config});
  await store.batch([
   ['INSERT OR IGNORE INTO fm_sites(site_ref,customer_ref,project_ref,config_json,current_release) VALUES(?,?,?,?,?)',o.site,principal.customer_ref,o.project,JSON.stringify(config),release_ref],
   ['INSERT OR IGNORE INTO fm_artifacts VALUES(?,?,?,?,?,?)',o.version,o.site,artifactHtml,baseline.content_json,o.hash,Date.now()],
   ['INSERT OR IGNORE INTO fm_releases VALUES(?,?,?,?,?,?)',release_ref,o.site,o.version,o.hash,JSON.stringify(receipt),Date.now()]
  ]);
 }
 await store.site(principal,o.site);
 // No cost estimate, tariff, approval reference or actual cost is fabricated.
 return Object.freeze({...createProductModifier({...options,publisher,costPolicy:qaCreditPolicy(env)}),publisher_transport_verified:true});
}
