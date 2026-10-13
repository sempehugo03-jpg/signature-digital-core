// QA cost accounting only: measured bytes, configurable test coefficients.
// These rates are NOT provider invoices or a commercial tariff.
export function qaCreditPolicy(env={}) {
 if(env.FABRYA_PRODUCT_QA!=='true'||env.FABRYA_STRIPE_MODE!=='test'||env.FABRYA_QA_CREDIT_POLICY!=='measured-bytes-v1')return null;
 const unit=Number(env.FABRYA_QA_CREDIT_UNIT_MICROEUR||100000);
 const base=Number(env.FABRYA_QA_COST_BASE_MICROEUR||10000),perKiB=Number(env.FABRYA_QA_COST_KIB_MICROEUR||10);
 if(![unit,base,perKiB].every(x=>Number.isSafeInteger(x)&&x>0)||unit>1000000||base>100000||perKiB>1000)return null;
 const cap=base+Math.ceil(2300000/1024)*perKiB;
 return Object.freeze({unit,estimate_microeur:base,cap_microeur:cap,basis:'QA isolated measured-bytes-v1: zero provider calls; provisional accounting coefficients, not invoiced hosting cost',
  measure(html){const bytes=new TextEncoder().encode(html).byteLength; if(bytes>2300000)throw Error('QA_COST_CAP_EXCEEDED');return {actual_cost_microeur:base+Math.ceil(bytes/1024)*perKiB,usage:{artifact_bytes:bytes,provider_calls:0,provider_cost_microeur:0,policy:'measured-bytes-v1',accounting_scope:'isolated-test',hosting_invoice_cost_microeur:null,base_microeur:base,per_kib_microeur:perKiB}};}});
}
