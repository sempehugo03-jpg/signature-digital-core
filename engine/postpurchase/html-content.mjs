import {validateManifest} from './content.mjs';
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function value(data,pointer){return pointer.slice(1).split('/').reduce((o,k)=>o[k.replace(/~1/g,'/').replace(/~0/g,'~')],data);}
// Slots are authored by Work, within the retained HTML. Client cannot select a
// selector, file, component or replacement needle. Every slot must occur once.
export function renderContent(template,manifest,data){
 validateManifest(manifest);let html=template;
 for(const field of manifest.fields){const token='{{FABRYA:'+field.id+'}}';if(template.split(token).length!==2)throw Error('ENGINE_TEMPLATE_SLOT_INVALID');const v=value(data,field.pointer);if(typeof v!=='string')throw Error('ENGINE_CONTENT_INVALID');const display=v?String(field.prefix||'')+v+String(field.suffix||''):'';html=html.replace(token,()=>escape(display));}
 if(/\{\{FABRYA:/.test(html))throw Error('ENGINE_UNDECLARED_SLOT');return html;
}
