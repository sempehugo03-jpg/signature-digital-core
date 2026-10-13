import {digest,fail} from './contract.mjs';
// Recorded only by the authenticated Product preview route, never a Work flag.
export async function recordWorkClientPreview(db,user,version) {
 const link=await db.prepare("SELECT l.request_id,l.project_id,l.user_id,l.version_id,a.hash FROM fp_work_product_links l JOIN fp_work_mcp_requests r ON r.id=l.request_id AND r.status='completed' JOIN fp_work_mcp_artifacts a ON a.request_id=r.id JOIN fp_projects p ON p.id=l.project_id AND p.user_id=l.user_id WHERE l.project_id=? AND l.version_id=? AND l.user_id=? AND a.hash=?").bind(version.project_id,version.id,user.id,version.artifact_hash).first();
 if(!link)return;
 if(await digest(version.html)!==link.hash)fail('WORK_ARTIFACT_CORRUPT','Aperçu indisponible.',503);
 await db.prepare('INSERT OR IGNORE INTO fp_work_client_previews VALUES(?,?,?,?,?,?)').bind(link.version_id,link.request_id,link.project_id,link.user_id,link.hash,new Date().toISOString()).run();
}
