import {productAuth} from '../product/auth.mjs';
import {migrateImages,privateImageStorage,photographScanner} from './postpurchase/images.mjs';
// Server factory hook only: reuse Product identity/ownership and its existing
// upload/scan methods. No Product decision, credit or subscription is changed.
export async function storagePortsForRequest(request,env){
 const path=new URL(request.url).pathname;
 const match=path.match(/^\/api\/product\/projects\/([A-Za-z0-9_-]{8,160})\/(?:change-files|changes|credits)(?:\/|$)/);
 if(!match||!env.DB)return env;
 const user=await productAuth({db:env.DB}).user(request);if(!user)return env;
 const owner=await env.DB.prepare('SELECT id FROM fp_projects WHERE id=? AND user_id=?').bind(match[1],user.id).first();if(!owner)return env;
 await migrateImages(env.DB);
 return {...env,FABRYA_CLIENT_PRIVATE_R2:privateImageStorage({db:env.DB,project_ref:owner.id,user_ref:user.id}),FABRYA_CLIENT_FILE_SCANNER:photographScanner(env.DB)};
}
