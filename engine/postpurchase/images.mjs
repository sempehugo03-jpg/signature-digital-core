import jpeg from 'jpeg-js';
import {decodePng,encodePng} from './png-raster.mjs';
import {sha256} from './auth.mjs';
export const IMAGE_LIMIT_BYTES=8*1024*1024;
export const IMAGE_LIMIT_PIXELS=3000000;
const encoder=new TextEncoder();
const check=(ok,code)=>{if(!ok)throw Error(code);};
const u32=(b,o)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(o);
export async function inspectPhotograph(input,mime,expectedHash){
 const bytes=new Uint8Array(input);check(bytes.length>16&&bytes.length<=IMAGE_LIMIT_BYTES,'ENGINE_IMAGE_SIZE');
 const source_sha256=await sha256(bytes);check(!expectedHash||source_sha256===expectedHash,'ENGINE_IMAGE_HASH');
 const started=performance.now();let decoded;
 if(mime==='image/png'){
  check([137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x),'ENGINE_IMAGE_MAGIC');
  check(u32(bytes,8)===13&&String.fromCharCode(...bytes.slice(12,16))==='IHDR','ENGINE_PNG_HEADER');
  const width=u32(bytes,16),height=u32(bytes,20);check(width>0&&height>0&&width*height<=IMAGE_LIMIT_PIXELS&&bytes[24]<=8,'ENGINE_IMAGE_DIMENSIONS');
  let at=8,ended=false;while(at+12<=bytes.length){const size=u32(bytes,at);check(size<=bytes.length-at-12,'ENGINE_PNG_CHUNK');const type=String.fromCharCode(...bytes.slice(at+4,at+8));at+=size+12;if(type==='IEND'){check(size===0&&at===bytes.length,'ENGINE_IMAGE_TRAILING_DATA');ended=true;break;}}
  check(ended,'ENGINE_PNG_TRUNCATED');decoded=decodePng(bytes,IMAGE_LIMIT_PIXELS);
 }else if(mime==='image/jpeg'){
  check(bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'ENGINE_IMAGE_MAGIC_OR_TRAILING_DATA');
  decoded=jpeg.decode(bytes,{useTArray:true,formatAsRGBA:true,maxResolutionInMP:3,maxMemoryUsageInMB:48,tolerantDecoding:false});
 }else throw Error('ENGINE_IMAGE_TYPE');
 check(decoded?.width>0&&decoded.height>0&&decoded.width*decoded.height<=IMAGE_LIMIT_PIXELS&&decoded.data.length===decoded.width*decoded.height*4,'ENGINE_IMAGE_DECODE');
 // The served image is a fresh raster encoding. Metadata, appended payloads,
 // SVG, scripts and original containers are never exposed as display assets.
 const safeBytes=encodePng(decoded);
 check(safeBytes.length<=IMAGE_LIMIT_BYTES,'ENGINE_IMAGE_ENCODE_SIZE');
 return {bytes,safeBytes,source_sha256,safe_sha256:await sha256(safeBytes),mime,safe_mime:'image/png',width:decoded.width,height:decoded.height,scan_method:'bounded-raster-decode-and-reencode-v1',elapsed_ms:performance.now()-started};
}
const schema=[
 'CREATE TABLE IF NOT EXISTS fm_image_objects(object_key TEXT PRIMARY KEY,project_ref TEXT NOT NULL,user_ref TEXT NOT NULL,sha256 TEXT NOT NULL,byte_size INTEGER NOT NULL,created_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS fm_image_chunks(object_key TEXT NOT NULL,part INTEGER NOT NULL,bytes BLOB NOT NULL,PRIMARY KEY(object_key,part))',
 'CREATE TABLE IF NOT EXISTS fm_image_checks(sha256 TEXT NOT NULL,mime TEXT NOT NULL,safe_sha256 TEXT NOT NULL,proof_json TEXT NOT NULL,PRIMARY KEY(sha256,mime))',
 'CREATE TABLE IF NOT EXISTS fm_image_safe_chunks(safe_sha256 TEXT NOT NULL,part INTEGER NOT NULL,bytes BLOB NOT NULL,PRIMARY KEY(safe_sha256,part))'
];
export async function migrateImages(db){for(const sql of schema)await db.prepare(sql).run();}
// Implements the existing private-bucket port using the already-bound private
// D1 database. No new bucket, paid service, browser URL or accounting subsystem.
export function privateImageStorage({db,project_ref,user_ref}){
 check(typeof project_ref==='string'&&typeof user_ref==='string','ENGINE_IMAGE_SCOPE_REQUIRED');
 const prefix='client-change-quarantine/'+project_ref+'/',partSize=256*1024;
 const stmt=(s,...a)=>db.prepare(s).bind(...a);
 const scope=key=>check(typeof key==='string'&&key.startsWith(prefix)&&/^file_[A-Za-z0-9_-]{8,160}$/.test(key.slice(prefix.length)),'ENGINE_IMAGE_SCOPE');
 return {
  async put(key,input){scope(key);const b=new Uint8Array(input);check(b.length>0&&b.length<=IMAGE_LIMIT_BYTES,'ENGINE_IMAGE_SIZE');const sha=await sha256(b),prior=await stmt('SELECT * FROM fm_image_objects WHERE object_key=?',key).first();if(prior){check(prior.project_ref===project_ref&&prior.user_ref===user_ref&&prior.sha256===sha&&prior.byte_size===b.length,'ENGINE_IMAGE_IMMUTABLE');return;}
   const commands=[stmt('INSERT INTO fm_image_objects(object_key,project_ref,user_ref,sha256,byte_size,created_at) VALUES(?,?,?,?,?,?)',key,project_ref,user_ref,sha,b.length,Date.now())];
   for(let at=0,part=0;at<b.length;at+=partSize,part++)commands.push(stmt('INSERT INTO fm_image_chunks(object_key,part,bytes) VALUES(?,?,?)',key,part,b.slice(at,at+partSize).buffer));await db.batch(commands);
  },
  async get(key){scope(key);const row=await stmt('SELECT * FROM fm_image_objects WHERE object_key=? AND project_ref=? AND user_ref=?',key,project_ref,user_ref).first();if(!row)return null;const chunks=(await stmt('SELECT part,bytes FROM fm_image_chunks WHERE object_key=? ORDER BY part',key).all()).results;const out=new Uint8Array(row.byte_size);let at=0;for(let i=0;i<chunks.length;i++){check(chunks[i].part===i,'ENGINE_IMAGE_CHUNKS');const b=new Uint8Array(chunks[i].bytes);check(at+b.length<=out.length,'ENGINE_IMAGE_CHUNKS');out.set(b,at);at+=b.length;}check(at===out.length&&await sha256(out)===row.sha256,'ENGINE_IMAGE_STORAGE_HASH');return {async arrayBuffer(){return out.buffer;}};},
  async delete(key){scope(key);const row=await stmt('SELECT user_ref FROM fm_image_objects WHERE object_key=? AND project_ref=? AND user_ref=?',key,project_ref,user_ref).first();check(row,'ENGINE_IMAGE_NOT_FOUND');await db.batch([stmt('DELETE FROM fm_image_chunks WHERE object_key=?',key),stmt('DELETE FROM fm_image_objects WHERE object_key=? AND user_ref=?',key,user_ref)]);}
 };
}
export function photographScanner(db){return {async verifySafe({bytes,mime,sha256:expected}){try{const result=await inspectPhotograph(bytes,mime,expected),proof={source_sha256:result.source_sha256,safe_sha256:result.safe_sha256,source_mime:mime,safe_mime:result.safe_mime,width:result.width,height:result.height,scan_method:result.scan_method,elapsed_ms:result.elapsed_ms,safe_byte_size:result.safeBytes.length};const commands=[];for(let at=0,part=0;at<result.safeBytes.length;at+=256*1024,part++)commands.push(db.prepare('INSERT OR IGNORE INTO fm_image_safe_chunks(safe_sha256,part,bytes) VALUES(?,?,?)').bind(result.safe_sha256,part,result.safeBytes.slice(at,at+256*1024).buffer));commands.push(db.prepare('INSERT OR IGNORE INTO fm_image_checks(sha256,mime,safe_sha256,proof_json) VALUES(?,?,?,?)').bind(result.source_sha256,mime,result.safe_sha256,JSON.stringify(proof)));await db.batch(commands);return true;}catch(error){if(/^ENGINE_IMAGE|^ENGINE_PNG/.test(error.message)||/jpeg|png|crc|inflate|marker|SOI|resolution|memory/i.test(error.message))return false;throw error;}}};}
export async function readSafePhotograph(db,{sha256:safeHash,project_ref,user_ref}){
 check(/^[a-f0-9]{64}$/.test(safeHash||''),'ENGINE_IMAGE_HASH');
 const row=await db.prepare('SELECT c.proof_json FROM fm_image_checks c JOIN fm_image_objects o ON o.sha256=c.sha256 WHERE c.safe_sha256=? AND o.project_ref=? AND o.user_ref=? LIMIT 1').bind(safeHash,project_ref,user_ref).first();check(row,'ENGINE_IMAGE_NOT_FOUND');const proof=JSON.parse(row.proof_json),chunks=(await db.prepare('SELECT part,bytes FROM fm_image_safe_chunks WHERE safe_sha256=? ORDER BY part').bind(safeHash).all()).results;
 const out=new Uint8Array(proof.safe_byte_size);let at=0;for(let i=0;i<chunks.length;i++){check(chunks[i].part===i,'ENGINE_IMAGE_CHUNKS');const b=new Uint8Array(chunks[i].bytes);check(at+b.length<=out.length,'ENGINE_IMAGE_CHUNKS');out.set(b,at);at+=b.length;}check(at===out.length&&await sha256(out)===safeHash,'ENGINE_IMAGE_STORAGE_HASH');return {bytes:out,mime:'image/png',proof};
}
export function productImageResolver(db){return async(principal,attachments)=>{
 const user_ref=principal.customer_ref.slice('customer_'.length),project_ref=principal.project_ref;check(principal.customer_ref==='customer_'+user_ref,'ENGINE_IMAGE_SCOPE');const storage=privateImageStorage({db,project_ref,user_ref}),output={};
 for(const a of attachments){const row=await db.prepare("SELECT * FROM fp_change_attachments WHERE id=? AND project_id=? AND user_id=? AND scan_state='clean'").bind(a.file_ref,project_ref,user_ref).first();check(row&&row.sha256===a.sha256&&row.mime===a.mime&&row.byte_size===a.byte_size,'ENGINE_IMAGE_ATTACHMENT_NOT_FOUND');const checked=await db.prepare('SELECT * FROM fm_image_checks WHERE sha256=? AND mime=?').bind(a.sha256,a.mime).first();check(checked,'ENGINE_IMAGE_SCAN_REQUIRED');const object=await storage.get(row.object_key);check(object,'ENGINE_IMAGE_NOT_FOUND');const bytes=new Uint8Array(await object.arrayBuffer());await readSafePhotograph(db,{sha256:checked.safe_sha256,project_ref,user_ref});output[a.file_ref]={...a,customer_ref:principal.customer_ref,project_ref,bytes,scan_status:'clean',scan_method:JSON.parse(checked.proof_json).scan_method,locator:'/engine/assets/'+project_ref+'/'+checked.safe_sha256+'.png'};
 }return output;
};}
