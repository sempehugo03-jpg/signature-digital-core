const frame = document.querySelector('#review-frame');
document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
  frame.style.width = button.dataset.width + 'px';
  document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  frame.title = `Interface Fabrya à ${button.dataset.width} pixels`;
}));

document.querySelector("#review-scenario").addEventListener("change", e => { const scenario=e.target.value; frame.src=scenario === "live" ? "/produit" : `/interface-fixture?scenario=${encodeURIComponent(scenario)}${scenario === "visitor" ? "" : "&project=fixture_project"}`; });

document.querySelector('#review-recovery').addEventListener('click',async()=>{
 const result=document.querySelector('#review-recovery-result');
 const project=new URL(frame.contentWindow.location.href).searchParams.get('project');
 if(document.querySelector('#review-scenario').value!=='live'||!project) {result.textContent='Ouvrez un projet réel avec une étape de paiement existante. Aucun paiement ne sera créé.';return;}
 result.textContent='Vérification Stripe en lecture seule…';
 try {const response=await fetch(`/api/product/projects/${encodeURIComponent(project)}/checkout-recovery-proof`,{credentials:'same-origin',cache:'no-store'});const proof=await response.json();result.textContent=response.ok ? JSON.stringify(proof) : proof.message;} catch {result.textContent='Vérification indisponible. Aucune écriture ni paiement effectué.';}
});
