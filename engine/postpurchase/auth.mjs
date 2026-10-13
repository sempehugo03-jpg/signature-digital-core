// Service authentication precedes customer/site lookup. Replay records MUST be durable.
const encoder=new TextEncoder();
export const AUTH_WINDOW_MS=60000;
export async function sha256(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
async function key(secret){if(typeof secret!=='string'||secret.length<32)throw Error('SERVICE_AUTH_NOT_CONFIGURED');return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
function canonical(method,path,timestamp,nonce,bodyHash){return [method,path,timestamp,nonce,bodyHash].join('\n');}
export async function signRequest({secret,method,path,body,timestamp,nonce}){
 if(!/^[A-Za-z0-9_-]{16,100}$/.test(nonce)||!/^\d{13}$/.test(String(timestamp)))throw Error('AUTH_INPUT_INVALID');
 const data=encoder.encode(canonical(method,path,String(timestamp),nonce,await sha256(encoder.encode(body))));
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),data)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function authenticateRequest(request,{secret,replayStore,now=Date.now(),serviceId='product'}){
 const timestamp=request.headers.get('x-fabrya-timestamp'),nonce=request.headers.get('x-fabrya-nonce'),signature=request.headers.get('x-fabrya-signature');
 if(!/^\d{13}$/.test(timestamp||'')||Math.abs(now-Number(timestamp))>AUTH_WINDOW_MS||! /^[A-Za-z0-9_-]{16,100}$/.test(nonce||'')||! /^[a-f0-9]{64}$/.test(signature||''))throw Error('SERVICE_UNAUTHORIZED');
 const raw=await request.arrayBuffer();if(raw.byteLength>65536)throw Error('REQUEST_TOO_LARGE');
 const u=new URL(request.url),data=encoder.encode(canonical(request.method,u.pathname+u.search,timestamp,nonce,await sha256(raw)));
 const bytes=Uint8Array.from(signature.match(/../g),s=>parseInt(s,16));
 if(!await crypto.subtle.verify('HMAC',await key(secret),bytes,data))throw Error('SERVICE_UNAUTHORIZED');
 // consume() is an atomic INSERT with UNIQUE(service_id,nonce), never an in-memory Set.
 if(!replayStore||!await replayStore.consume(serviceId,nonce,Number(timestamp)+AUTH_WINDOW_MS))throw Error('SERVICE_REPLAY');
 return {service_id:serviceId,body:new TextDecoder('utf-8',{fatal:true}).decode(raw)};
}
export function d1ReplayStore(db){return {async consume(serviceId,nonce,expires){const r=await db.prepare('INSERT OR IGNORE INTO fabrya_modifier_nonces(service_id,nonce,expires_at) VALUES (?,?,?)').bind(serviceId,nonce,expires).run();return r.meta.changes===1;}};}
