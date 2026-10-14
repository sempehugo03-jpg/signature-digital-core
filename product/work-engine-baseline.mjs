import {renderContent} from '../engine/postpurchase/html-content.mjs';
import {sha256} from '../engine/postpurchase/auth.mjs';
import {validateManifest} from '../engine/postpurchase/content.mjs';

// Authenticated Work receipt only; never a client-supplied selector/template.
export async function authoredWorkBaseline(html,expectedHash,authored){
 if(typeof html!=='string'||new TextEncoder().encode(html).byteLength>2000000||await sha256(new TextEncoder().encode(html))!==expectedHash)
  throw Error('WORK_BASELINE_HASH_MISMATCH');
 const shape=authored&&Object.keys(authored).sort().join(',');
 if(!['content,manifest,schema,template','content,manifest,schema,slots'].includes(shape)||authored.schema!=='fabrya.work-baseline.v1'||!authored.content||typeof authored.content!=='object'||Array.isArray(authored.content))
  throw Error('WORK_AUTHORED_BASELINE_REQUIRED');
 validateManifest(authored.manifest);
 let template=authored.template;const content=structuredClone(authored.content);
 if(shape==='content,manifest,schema,slots'){
  // Small authenticated author offsets avoid duplicating large inline images
  // in the bounded Work receipt. Positions index the hash-verified HTML only.
  const fields=new Set(authored.manifest.fields.map(f=>f.id)),ids=new Set();
  if(!Array.isArray(authored.slots)||authored.slots.length!==fields.size)throw Error('WORK_AUTHOR_SLOTS_INVALID');
  const slots=[...authored.slots].sort((a,b)=>a.start-b.start);let end=-1,start=-1;
  for(const slot of slots){
   if(!slot||Object.keys(slot).sort().join(',')!=='end,id,start'||!fields.has(slot.id)||ids.has(slot.id)||!Number.isSafeInteger(slot.start)||!Number.isSafeInteger(slot.end)||slot.start<0||slot.end<slot.start||slot.end>html.length||slot.start<end||slot.start===start)throw Error('WORK_AUTHOR_SLOTS_INVALID');
   ids.add(slot.id);start=slot.start;end=slot.end;
   const field=authored.manifest.fields.find(f=>f.id===slot.id);
   if(field.type==='image'&&!field.prefix&&!field.suffix){
    // The default image is already inside the authenticated artifact. Avoid a
    // second large data URL in the receipt; derive only this declared slot.
    const keys=field.pointer.slice(1).split('/').map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));
    let parent=content;for(const key of keys.slice(0,-1)){if(!Object.hasOwn(parent,key))parent[key]={};if(!parent[key]||typeof parent[key]!=='object')throw Error('WORK_AUTHOR_SLOTS_INVALID');parent=parent[key];}
    const key=keys.at(-1);if(!Object.hasOwn(parent,key))parent[key]=html.slice(slot.start,slot.end).replace(/&(lt|gt|quot|#39|amp);/g,(_,entity)=>({lt:'<',gt:'>',quot:'"','#39':"'",amp:'&'}[entity]));
   }
  }
  template=html;for(const slot of slots.reverse())template=template.slice(0,slot.start)+'{{FABRYA:'+slot.id+'}}'+template.slice(slot.end);
 }
 if(typeof template!=='string'||new TextEncoder().encode(template).byteLength>2000000)throw Error('WORK_AUTHORED_BASELINE_REQUIRED');
 const content_json=JSON.stringify(content);
 if(content_json.length>2000000||renderContent(template,authored.manifest,content)!==html)throw Error('WORK_BASELINE_ROUNDTRIP_MISMATCH');
 return {template,manifest:authored.manifest,content_json,sha256:expectedHash};
}

// Trusted Work authoring for the two retained automobile QA deliveries only.
// No selector, HTML replacement needle or manifest comes from a browser.
export async function retainedWorkBaseline(html, expectedHash) {
 if(typeof html!=='string'||await sha256(new TextEncoder().encode(html))!==expectedHash)
  throw Error('WORK_BASELINE_HASH_MISMATCH');
 const prestation='Penser l’entretien en fonction du véhicule, de son historique et de votre manière de rouler.';
 const footer='Tarbes. Le goût du travail juste.';
 const asset=html.match(/const vehicleAsset="(data:image\/webp;base64,[A-Za-z0-9+/=]+)"/);
 if(!asset||html.split(prestation).length!==2||html.split(footer).length!==2)
  throw Error('WORK_BASELINE_UNSUPPORTED');
 const data={prestation,photo:asset[1],hours:''};
 const manifest={schema:'fabrya.mutable-content.v1',fields:[
  {id:'service.entretien',pointer:'/prestation',type:'text',max_length:600,aliases:['prestation entretien']},
  {id:'photo.atelier',pointer:'/photo',type:'image',aliases:['photographie atelier','photo atelier']},
  {id:'hours.opening',pointer:'/hours',type:'time',prefix:' · Ouverture : ',aliases:['horaire ouverture','heure ouverture']}
 ]};
 const template=html.replace(prestation,'{{FABRYA:service.entretien}}')
  .replace(asset[1],'{{FABRYA:photo.atelier}}')
  .replace(footer,footer+'{{FABRYA:hours.opening}}');
 if(renderContent(template,manifest,data)!==html)throw Error('WORK_BASELINE_ROUNDTRIP_MISMATCH');
 return {template,manifest,content_json:JSON.stringify(data),sha256:expectedHash};
}
