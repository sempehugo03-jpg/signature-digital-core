// Only trusted Work manifests select mutable data. No component/source rewriting.
const own=(o,k)=>Object.hasOwn(o,k);
const fail=code=>{throw Object.assign(new Error(code),{code});};
const forbidden=new Set(['__proto__','prototype','constructor']);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function parts(pointer){
 if(typeof pointer!=='string'||!/^\/(?:[^/~]|~[01])+(?:\/(?:[^/~]|~[01])+)*$/.test(pointer))fail('MANIFEST_POINTER');
 const keys=pointer.slice(1).split('/').map(s=>s.replace(/~1/g,'/').replace(/~0/g,'~'));
 if(keys.some(k=>forbidden.has(k)))fail('MANIFEST_POINTER');return keys;
}
function slot(data,pointer){const keys=parts(pointer);let parent=data;for(const key of keys.slice(0,-1)){if(!parent||typeof parent!=='object'||!own(parent,key))fail('CONTENT_TARGET_MISSING');parent=parent[key];}const key=keys.at(-1);if(!parent||typeof parent!=='object'||!own(parent,key))fail('CONTENT_TARGET_MISSING');return {parent,key};}
export function validateManifest(manifest){
 if(manifest?.schema!=='fabrya.mutable-content.v1'||!Array.isArray(manifest.fields)||!manifest.fields.length||manifest.fields.length>200)fail('MANIFEST_INVALID');
 const ids=new Set(),paths=new Set();
 for(const field of manifest.fields){
  if(!/^[a-z][a-z0-9_.-]{1,79}$/.test(field.id)||ids.has(field.id)||paths.has(field.pointer))fail('MANIFEST_FIELD');
  parts(field.pointer);ids.add(field.id);paths.add(field.pointer);
  if(!['text','time','link','image'].includes(field.type)||!Array.isArray(field.aliases)||!field.aliases.length||field.aliases.some(a=>typeof a!=='string'||a.length<2||a.length>80))fail('MANIFEST_TYPE');
  if(field.type==='text'&&(!Number.isInteger(field.max_length)||field.max_length<1||field.max_length>10000))fail('MANIFEST_TEXT_LIMIT');
 }
 const pointers=[...paths];if(pointers.some(p=>pointers.some(q=>p!==q&&q.startsWith(p+'/'))))fail('MANIFEST_OVERLAPPING_TARGETS');return manifest;
}
export function understand(message,manifest,attachments=[]){
 validateManifest(manifest);
 if(typeof message!=='string'||message.length<2||message.length>2000)fail('MESSAGE_INVALID');
 const n=normalize(message);
 if(/\b(?:pas|jamais|ne|annule|annuler|peut-etre|si)\b|\?/.test(n))return {classification:'CLARIFICATION_REQUIRED',reason:'INTENT_CONFIRMATION_REQUIRED',question:'Confirme la modification que tu souhaites préparer.',operations:[]};
 if(/(?:nouvelle|ajout\w*|cre\w*)\s+(?:(?:une?|la|le)\s+)?(?:nouvelle\s+)?(?:page|animation|fonctionnalite)|refonte|re\w*\s+(?:design|site)|transform\w*\s+(?:graphique|visuel)/.test(n))return {classification:'COMPLEX_MODIFICATION_REQUIRED',reason:'DESIGN_OR_STRUCTURE_CHANGE',operations:[]};
 const matches=manifest.fields.filter(f=>f.aliases.some(a=>n.includes(normalize(a))));
 if(matches.length!==1)return {classification:'CLARIFICATION_REQUIRED',reason:matches.length?'AMBIGUOUS_FIELD':'FIELD_REQUIRED',question:'Quel contenu précis souhaites-tu modifier ?',operations:[]};
 const field=matches[0];let value;
 if(field.type==='time'){
  const times=[...n.matchAll(/\b(\d{1,2})\s*(?:h|:)(?:\s*(\d{2}))?\b/g)];
  if(times.length===1)value=times[0][1].padStart(2,'0')+':'+(times[0][2]||'00');
 }else if(field.type==='image'){if(attachments.length===1)value=attachments[0].file_ref;
 }else{
  const quoted=[...message.matchAll(/[«“"]([^»”"]+)[»”"]/g)];
  if(quoted.length===1)value=quoted[0][1].trim();
  else {const suffix=message.match(/\b(?:par|devient|avec)\s+(.+?)\s*$/i);if(suffix)value=suffix[1];}
 }
 if(value===undefined)return {classification:'CLARIFICATION_REQUIRED',reason:'VALUE_REQUIRED',question:'Quelle est la nouvelle valeur pour '+field.aliases[0]+' ?',operations:[]};
 return {classification:'SMALL_MODIFICATION',operations:[{field_id:field.id,value}]};
}
export function applyOperations(data,manifest,operations,verifiedAssets={}){
 validateManifest(manifest);
 if(!Array.isArray(operations)||!operations.length||operations.length>20)fail('OPERATIONS_INVALID');
 const output=structuredClone(data),seen=new Set();
 for(const op of operations){
  if(!op||Object.keys(op).some(k=>!['field_id','value'].includes(k))||seen.has(op.field_id))fail('OPERATION_INVALID');
  seen.add(op.field_id);const field=manifest.fields.find(f=>f.id===op.field_id);if(!field)fail('FIELD_NOT_ALLOWED');let value=op.value;
  if(typeof value!=='string'||!value.length)fail('VALUE_INVALID');
  if(field.type==='text'&&(value.length>field.max_length||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)))fail('TEXT_INVALID');
  if(field.type==='time'&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))fail('TIME_INVALID');
  if(field.type==='link'){
   let url;try{url=new URL(value);}catch{fail('LINK_INVALID');}
   if(url.protocol!=='https:'||url.username||url.password)fail('LINK_INVALID');value=url.href;
  }
  if(field.type==='image'){
   if(!own(verifiedAssets,value))fail('ASSET_NOT_VERIFIED');
   const asset=verifiedAssets[value];
   if(asset.scan_status!=='clean'||!/^image\/(?:png|jpeg|webp|avif)$/.test(asset.mime)||! /^(?:\/assets\/[a-f0-9]{64}\.(?:png|jpg|webp|avif)|\/engine\/assets\/[A-Za-z0-9_-]{8,160}\/[a-f0-9]{64}\.png)$/.test(asset.locator))fail('ASSET_NOT_VERIFIED');value=asset.locator;
  }
  const {parent,key}=slot(output,field.pointer);if(typeof parent[key]!=='string')fail('CONTENT_TYPE_MISMATCH');parent[key]=value;
 }
 return output;
}
