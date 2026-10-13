// Product conversation interface. Credits and status are always server-authoritative.
const app=document.querySelector('#change-center');
const params=new URLSearchParams(location.search);
const projectId=params.get('project');
let overview=null,queue=[],busy=false,recording=null,mediaStream=null,voiceChunks=[],loadError='';
const esc=value=>String(value??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const uri=()=>'/api/product/projects/'+encodeURIComponent(projectId);
const when=v=>v?new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v)):'À confirmer';
const status={awaiting_engine:'En attente du service de modification',reserved:'Crédits réservés',processing:'En cours de modification',preview_ready:'Aperçu prêt à vérifier',approved:'Aperçu approuvé · publication en attente',publishing:'Publication en cours de vérification',published:'Modification publiée et vérifiée',rolled_back:'Version précédente restaurée',reverted:'Aperçu refusé · crédits libérés',failed:'Modification non réalisée · crédits libérés',canceled:'Annulée'};
async function api(path,method='GET',body=null){
 const result=await fetch(uri()+path,{method,credentials:'same-origin',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 let payload;try{payload=await result.json()}catch{payload={message:'Réponse indisponible.'}}
 if(!result.ok){const e=new Error(payload.message||'Action indisponible.');e.code=payload.code;throw e;}
 return payload;
}
function messageRows(){
 return (overview?.changes||[]).map(x=>`<article class="change-bubble"><div class="change-bubble-head"><strong>Vous avez demandé</strong><time>${when(x.created_at)}</time></div><p>${esc(x.message||'Pièces jointes envoyées')}</p><div class="change-state">${esc(status[x.status]||'Demande enregistrée')}${x.credits_charged?` · ${x.credits_charged} crédits utilisés`:x.credits_held?` · ${x.credits_held} temporairement réservés`:''}</div>${x.status==='preview_ready'&&x.candidate_version_id?`<div class="change-bubble-actions"><a class="change-small-btn" href="${uri()}/changes/${encodeURIComponent(x.id)}/preview" target="_blank" rel="noopener">Consulter cet aperçu</a><button type="button" data-approve="${esc(x.id)}" class="change-small-btn">Valider cette version</button><button type="button" data-reject="${esc(x.id)}" class="change-small-btn secondary">Demander un nouvel ajustement</button></div>`:''}</article>`).join('')||'<p class="change-empty">Vos demandes apparaîtront ici. Décrivez simplement ce que vous souhaitez ajuster.</p>';
}
function render(){
 const available=(overview?.monthly_available||0)+(overview?.recharge_available||0);
 const percent=Math.max(0,Math.min(100,Number(overview?.monthly_available||0)));
 const filesOK=overview?.file_upload_available===true;
 app.innerHTML=`<a class="skiplink" href="#credits-main">Aller au contenu</a><header class="change-header"><a class="change-brand" href="/produit?project=${encodeURIComponent(projectId||'')}"><img src="/product-assets/fabrya-logo.svg" width="34" height="34" alt=""/> FABRYA</a><a class="change-back" href="/produit?project=${encodeURIComponent(projectId||'')}">← Retour à mon projet</a></header>
 <main id="credits-main" class="change-shell"><div class="change-intro"><p class="tagline">Votre espace client</p><h1>On fait évoluer votre site, ensemble.</h1><p>Écrivez comme dans une conversation. Dites-nous ce que vous souhaitez changer, sans choisir de catégorie technique.</p></div>
 <section class="change-grid"><div><section class="change-reserve" aria-labelledby="reserve-title"><div class="change-reserve-heading"><div><p class="tagline">Votre réserve mensuelle</p><h2 id="reserve-title">${overview?available:'—'} <span>crédits disponibles</span></h2></div><span class="change-cap">100 / mois</span></div><progress value="${percent}" max="100" aria-label="Crédits mensuels disponibles">${percent}%</progress><p>${overview?`${overview.monthly_available} crédits mensuels${overview.recharge_available?' + '+overview.recharge_available+' crédit(s) de recharge':''}.`:'Réserve à vérifier.'} ${overview?.reserved?overview.reserved+' réservés pendant des modifications en cours.':''}</p><p class="change-next">Prochain renouvellement : ${when(overview?.next_reset)}. La réserve mensuelle est attribuée après confirmation de la période payée.</p><details><summary>Comment fonctionnent mes crédits ?</summary><p>Vous disposez de 100 crédits pour chaque période mensuelle payée. Fabrya réserve provisoirement les crédits nécessaires, puis ne les débite définitivement qu'après la publication réelle vérifiée de la version validée. En cas d'échec, la réserve est libérée. Les crédits mensuels non utilisés expirent à la fin de leur période. Les recharges seront soumises à leurs conditions lors de leur ouverture.</p></details><div class="change-recharge"><button type="button" class="button light small" disabled aria-disabled="true">Recharger mes crédits</button><small>Les recharges seront ouvertes après validation de leurs prix et conditions. Aucun paiement n'est engagé ici.</small></div></section>
 <section class="change-composer" aria-labelledby="change-ask"><h2 id="change-ask">Qu'est-ce qu'on change ?</h2><p class="muted">Décrivez ce que vous imaginez, même simplement.</p><form id="change-form"><label for="change-text">Votre message</label><textarea id="change-text" maxlength="2000" placeholder="Ex. J’aimerais des photos plus lumineuses et un accueil plus épuré…" ${busy?'disabled':''}></textarea><div class="change-attachments" id="change-attachments">${queue.map((f,i)=>`<span>${esc(f.name)} <button type="button" data-remove="${i}" aria-label="Retirer ce fichier">×</button></span>`).join('')}</div><div class="change-actions"><label class="change-add ${filesOK?'':'is-disabled'}">＋ Ajouter une photo ou un document<input id="change-files" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.docx,audio/webm,audio/mpeg,audio/wav" multiple ${filesOK?'':'disabled'}/></label><button type="button" id="voice-button" class="change-small-btn secondary" ${filesOK?'':'disabled'}>${recording?'Arrêter le vocal':'🎙 Message vocal'}</button><button type="submit" class="button" ${busy||!overview?'disabled':''}>Envoyer ma demande ↗</button></div>${!filesOK?'<p class="change-hint">Les pièces jointes et vocaux seront disponibles après sécurisation du stockage privé et du contrôle des fichiers.</p>':''}</form><p class="change-hint">Une demande enregistrée n'est pas une modification livrée. Vous verrez ici son état réel et l'aperçu lorsqu'il sera prêt.</p></section></div>
 <section class="change-history" aria-labelledby="history-title"><div class="change-history-header"><p class="tagline">Conversation & historique</p><h2 id="history-title">Vos demandes, au même endroit.</h2></div><div id="change-messages" aria-live="polite">${messageRows()}</div>${overview?.history?.length?`<details class="change-history-ledger"><summary>Historique des mouvements de crédits</summary>${overview.history.map(h=>`<p>${when(h.updated_at)} · ${h.state==='released'?'Réserve libérée':h.state==='settled'?`${h.charged} crédit(s) utilisés`:`${h.amount} crédit(s) réservés`} · ${esc(h.source==='monthly_invoice'?'Réserve mensuelle':'Recharge')}</p>`).join('')}</details>`:''}</section></section><p id="change-feedback" role="status" class="change-feedback">${esc(loadError)}</p></main>`;
}
async function refresh(){overview=await api('/credits');loadError='';render();}
function report(msg){const node=document.querySelector('#change-feedback');if(node)node.textContent=msg;else{loadError=msg;render();}}
if(!projectId||!/^[A-Za-z0-9_-]{8,160}$/.test(projectId)){
 app.textContent='Projet introuvable. Revenez à votre espace Fabrya.';
}else{
 refresh().catch(e=>{overview=null;loadError=e.message;render();});
}
app.addEventListener('change',e=>{
 if(e.target.id==='change-files'){
   const files=[...e.target.files||[]];
   if(files.some(f=>f.size>8*1024*1024)||queue.length+files.length>5){report('Cinq fichiers maximum, 8 Mo par fichier.');return;}
   queue.push(...files);render();
 }
});
app.addEventListener('click',async e=>{
 const remove=e.target.closest('[data-remove]');if(remove){queue.splice(Number(remove.dataset.remove),1);render();return;}
 const approve=e.target.closest('[data-approve]');if(approve){
   const change=overview?.changes?.find(x=>x.id===approve.dataset.approve);if(!change)return;
   try{await api('/changes/'+encodeURIComponent(change.id)+'/acknowledge','POST',{version_id:change.candidate_version_id});await refresh();report('Version validée. La publication reste en attente de confirmation.');}catch(err){report(err.message)}return;
 }
 const reject=e.target.closest('[data-reject]');if(reject){
   const change=overview?.changes?.find(x=>x.id===reject.dataset.reject);
   if(!change||!confirm('Écarter cet aperçu ? Les crédits provisoirement réservés seront libérés si aucune publication n’a eu lieu.'))return;
   try{await api('/changes/'+encodeURIComponent(change.id)+'/reject','POST',{});await refresh();report('Aperçu écarté. Vous pouvez préciser une nouvelle demande.');}catch(err){report(err.message)}return;
 }
 if(e.target.closest('#voice-button')){
   if(recording){recording.stop();return;}
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){report('Enregistrement vocal indisponible sur cet appareil.');return;}
   try{mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});voiceChunks=[];
     if(!MediaRecorder.isTypeSupported('audio/webm')){mediaStream.getTracks().forEach(x=>x.stop());mediaStream=null;report('Ce navigateur ne prend pas en charge les vocaux WebM.');return;}
     recording=new MediaRecorder(mediaStream,{mimeType:'audio/webm'});
     recording.ondataavailable=x=>{if(x.data.size)voiceChunks.push(x.data)};
     recording.onstop=()=>{const file=new File(voiceChunks,'message-vocal.webm',{type:'audio/webm'});
       mediaStream?.getTracks().forEach(x=>x.stop());recording=null;mediaStream=null;
       if(file.size<=8*1024*1024)queue.push(file);else report('Message vocal trop volumineux.');render();};
     recording.start();render();
   }catch{report('Accès au microphone refusé ou indisponible.');}
 }
});
app.addEventListener('submit',async e=>{
 if(e.target.id!=='change-form')return;e.preventDefault();if(busy)return;
 const text=document.querySelector('#change-text')?.value?.trim()||'';
 if(!text&&queue.length===0){report('Écrivez votre demande ou ajoutez un fichier.');return;}
 if(queue.length&&!overview?.file_upload_available){report('Les pièces jointes ne sont pas encore disponibles. Votre texte reste dans le formulaire.');return;}
 const keyName='fabrya-change-key-'+projectId;
 const idempotency=localStorage.getItem(keyName)||crypto.randomUUID();
 localStorage.setItem(keyName,idempotency);
 busy=true;const submit=document.querySelector('#change-form button[type=submit]');if(submit)submit.disabled=true;
 try{
   const attachments=[];
   for(const f of queue){const r=await fetch(uri()+'/change-files',{method:'POST',credentials:'same-origin',headers:{'Content-Type':f.type,'X-Fabrya-Filename':f.name.replace(/[^\x20-\x7E]/g,'_')},body:f});
      const x=await r.json();if(!r.ok)throw Error(x.message||'Envoi du fichier impossible.');
      if(x.status!=='clean')throw Error('Le fichier est en vérification. Réessayez après confirmation.');
      attachments.push(x.id);}
   const saved=await api('/changes','POST',{request_key:idempotency,message:text,attachments});
   localStorage.removeItem(keyName);queue=[];await refresh();
   report(saved.status==='awaiting_engine'?'Demande enregistrée. Le service de modification doit encore être raccordé ; aucun crédit débité.':'Demande enregistrée. Les crédits nécessaires ont été réservés, pas encore débités.');
 }catch(err){report(err.message||'Envoi interrompu : votre message est conservé dans le formulaire.');}
 finally{busy=false;const submit=document.querySelector('#change-form button[type=submit]');if(submit)submit.disabled=false;}
});