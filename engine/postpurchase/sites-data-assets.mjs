import {isSha} from '../contracts/site-changes/v1/protocol.mjs';
export const SITE_ASSET_PART_BYTES=256*1024;
export const SITE_ASSET_MAX_BYTES=8*1024*1024;
export function sitesAssetReferences(html,projectRef){
 if(/(?:https?:)?\/\/[^\s"'<>`]*\/engine\/assets\//i.test(html))throw Error('SITE_FOREIGN_ASSET_ORIGIN');
 const references=[...html.matchAll(/\/engine\/assets\/([^\s"'<>`)]+)/g)].map(m=>m[0]),unique=[...new Set(references)];
 if(unique.length>5)throw Error('SITE_ASSET_LIMIT');
 return unique.map(locator=>{
  const match=locator.match(/^\/engine\/assets\/([A-Za-z0-9_-]{8,160})\/([a-f0-9]{64})\.png$/);
  if(!match||match[1]!==projectRef||!isSha(match[2]))throw Error('SITE_ASSET_SCOPE');
  return {locator,sha256:match[2]};
 });
}
export function base64Bytes(bytes){let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value);}
export function decodeBase64(value){if(typeof value!=='string'||value.length>350000||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw Error('SITE_ASSET_CHUNK_INVALID');return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
