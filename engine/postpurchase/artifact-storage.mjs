import {renderContent} from './html-content.mjs';
import {sha256} from './auth.mjs';
const bytes=s=>new TextEncoder().encode(s);
export const ARTIFACT_DERIVED_PREFIX='FABRYA_DERIVED_HTML_V1:';
// Leave room for IDs, hashes, record headers and future additive small columns
// below D1's 2 MB row limit. Never retain a second copy of a large data image.
export const ARTIFACT_ROW_TEXT_BUDGET=1_900_000;
export const renderConfigHash=config=>sha256(bytes(JSON.stringify({template:config.template,manifest:config.manifest})));
export async function compactArtifactHtml({html,content_json,config}){
 if(typeof html!=='string'||typeof content_json!=='string')throw Error('ENGINE_ARTIFACT_INVALID');
 if(bytes(html).length+bytes(content_json).length<=ARTIFACT_ROW_TEXT_BUDGET)return html;
 const sentinel=ARTIFACT_DERIVED_PREFIX+await renderConfigHash(config);
 if(bytes(sentinel).length+bytes(content_json).length>ARTIFACT_ROW_TEXT_BUDGET)throw Error('ENGINE_ARTIFACT_ROW_TOO_LARGE');
 // Compaction is safe only when exact original bytes can be reconstructed.
 if(renderContent(config.template,config.manifest,JSON.parse(content_json))!==html)throw Error('ENGINE_ARTIFACT_ROUNDTRIP_MISMATCH');
 return sentinel;
}
export async function materializeArtifact(artifact,config,{render_pin=null}={}){
 const configHash=await renderConfigHash(config);
 if((render_pin&&render_pin!==configHash)||(config.render_config_sha256&&config.render_config_sha256!==configHash))throw Error('ENGINE_RENDER_CONFIG_CHANGED');
 let html=artifact.html;
 if(typeof html!=='string'||typeof artifact.content_json!=='string')throw Error('ENGINE_ARTIFACT_CORRUPT');
 if(html.startsWith(ARTIFACT_DERIVED_PREFIX)){
  const pin=html.slice(ARTIFACT_DERIVED_PREFIX.length);
  if(!/^[a-f0-9]{64}$/.test(pin)||pin!==configHash)throw Error('ENGINE_RENDER_CONFIG_CHANGED');
  html=renderContent(config.template,config.manifest,JSON.parse(artifact.content_json));
 }
 if(await sha256(bytes(html))!==artifact.sha256)throw Error('ENGINE_ARTIFACT_CORRUPT');
 return {...artifact,html};
}
