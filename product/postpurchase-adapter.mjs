import {productApprovalReader} from './change-approval.mjs';

// The hosting composition supplies the retained Engine code, not a browser URL.
// A new immutable Engine instance is bound to the server-authenticated owner.
export function postpurchaseFactory({db,env}) {
 const engine=env.FABRYA_POSTPURCHASE_ENGINE_FACTORY;
 if(typeof engine!=='function')return null;
 return async({user,projectId})=>{
  const owned=await db.prepare('SELECT id FROM fp_projects WHERE id=? AND user_id=?').bind(projectId,user?.id).first();
  if(!owned)return null;
  return engine({db,principal:Object.freeze({customer_ref:'customer_'+user.id,project_ref:projectId}),productApproval:productApprovalReader(db)});
 };
}

// Commercial conversion remains closed until an explicit approved policy is configured.
export function approvedCreditUnit(env={}) {
 const value=Number(env.FABRYA_CREDIT_UNIT_MICROEUR||0);
 return env.FABRYA_CREDIT_POLICY_STATE==='approved'&&/^[A-Za-z0-9_-]{8,160}$/.test(env.FABRYA_CREDIT_POLICY_APPROVAL_REF||'')&&Number.isSafeInteger(value)&&value>0?value:0;
}
