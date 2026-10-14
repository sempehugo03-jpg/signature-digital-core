// Instructions and evidence for the existing Work handoff. No generator or billing path.
export const workCreativePolicy={
 version:'fabrya-work-creative/v1',
 signature_contract:'business-experience/v1',
 instructions:[
  'Appliquer fabrya-creation-work dans Work direct, sans nouvel agent ni moteur.',
  'Avant toute construction, inventer plusieurs pistes métier, choisir une mécanique spécifique et rejeter explicitement deux alternatives classiques. Enregistrer le plan avec fabrya_work_request_checkpoint operation=experience_plan, avant le code, sans nouveau job.',
  'Le plan comporte visitor_question, mechanic, useful_output, visual_surprise, business_reason, why_not_decoration et rejected_alternatives[2]. L’interaction change un état intelligible et produit un résultat utile pour la prochaine action du visiteur ; les photographies participent à sa conception dès le départ. Aucun type de signature ni mise en page imposés.',
  'Fournir proof.signature_contract=business-experience/v1 et proof.interaction_execution={plan_ref,script_id,source_sha256,control_ids,output_id,states[3],tests:{status,cases:[{name,pass}]}}. Le vrai script est inline dans un élément <script id=...>. Tester son modèle métier, les cas limites et le retour ; garder NON VÉRIFIÉ pour les gestes/pixels non observés.',
  'Écrire cinq intentions : métier/audience, objectif, ressenti, action, signature et place. Direction artistique libre, jamais un template imposé.',
  'Inventorier les outils réellement disponibles dans cette exécution. Pour des médias photographiques, utiliser image_gen natif si disponible et autorisé sans nouvelle dépense ; examiner les images et intégrer leurs vrais octets. Aucun remplacement automatique par une illustration générique.',
  'L’interdiction des API payantes externes ne signifie pas supprimer les outils natifs déjà disponibles. Ne créer aucune clé ni dépense. Si le coût ou la disponibilité du moyen reste inconnu, déclarer la limite sans appeler un fournisseur de secours.',
  'Développer le site et une signature pertinente, vérifier clavier/tactile/mouvements réduits. Examiner début/milieu/fin/retour, desktop/mobile avec le navigateur officiellement autorisé. Corriger artistiquement avant livraison vérifiée.',
  'Fournir proof.creative_review : policy_version, intent[5], tools[{name,available,evidence}], media[{role,sha256,source,examined}], signature{purpose,evidence}, artistic_corrections[], limitations[]. Les noms d’outils sont des constats de l’exécution, pas des droits accordés par ce contrat.',
  'Absence de contrôle visuel : NOT_VERIFIED, aperçu privé uniquement ; ne jamais annoncer parité Work ou livraison prête. Conserver historique, commande, Site et site-change/v1.0.0.',
  'Respecter le ledger propre à la commande. Le budget historique Équinoxe ne vaut pas pour une autre entreprise.'
 ].join('\n'),
 budget:{external_paid_calls_allowed:false,new_spend_authorized:false,mission_ledger_required:true},
 capabilities:{native_image_generation:'must_be_observed_in_Work_execution',official_browser:'must_be_observed_in_Work_execution',production_parity:'not_proven'}
};
export function workRequestBudget(brief){
 let b;try{b=JSON.parse(brief);}catch{}
 const ledger=b?.financial_ledger;
 return {...workCreativePolicy.budget,...(ledger&&typeof ledger==='object'?{mission_ledger:ledger}:{}),paid_calls_allowed:false};
}
export async function validateCreativeReview(proof,brief){
 let envelope;try{envelope=JSON.parse(brief);}catch{return;}
 // Old commands and their immutable receipts remain valid under their original contract.
 if(envelope?.creative?.version!==workCreativePolicy.version)return;
 const r=proof?.creative_review;
 if(r?.policy_version!==workCreativePolicy.version||!Array.isArray(r.intent)||r.intent.length!==5||r.intent.some(v=>typeof v!=='string'||!v.trim())||!Array.isArray(r.tools)||!Array.isArray(r.media)||!Array.isArray(r.artistic_corrections)||!Array.isArray(r.limitations)||typeof r.signature?.purpose!=='string'||!r.signature.purpose.trim())throw Error('CREATIVE_REVIEW_REQUIRED');
 if(r.tools.some(t=>typeof t.name!=='string'||typeof t.available!=='boolean'||typeof t.evidence!=='string'))throw Error('CREATIVE_TOOLS_EVIDENCE_REQUIRED');
 if(r.media.some(m=>!/^[a-f0-9]{64}$/.test(m.sha256)||typeof m.role!=='string'||typeof m.source!=='string'||m.examined!==true))throw Error('CREATIVE_MEDIA_EVIDENCE_REQUIRED');
 if(proof.delivery_mode!=='preview_only'&&(r.limitations.length||!r.media.length||!r.tools.some(t=>t.available&&/browser/.test(t.name))))throw Error('CREATIVE_CAPABILITY_UNVERIFIED');
 const actual=new Set();for(const m of (proof.artifact_html||'').matchAll(/src=["']data:image\/(?:png|webp|jpeg|avif);base64,([^"']+)["']/g)){let bytes;try{bytes=Uint8Array.from(atob(m[1]),c=>c.charCodeAt(0));}catch{throw Error('CREATIVE_MEDIA_INVALID');}actual.add(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join(''));}
 if(r.media.some(m=>!actual.has(m.sha256)))throw Error('CREATIVE_MEDIA_NOT_IN_ARTIFACT');
 // Tool execution trace comes from authenticated Work; image bytes are verified here.
 // This does not certify actual browser observation or aesthetic quality.
}
