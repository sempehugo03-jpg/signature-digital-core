# B3 — Réception Work native, port backend isolé

## Propriété et base

Intégrateur unique ee22dc8c2fb4 conserve natif/UI/wrapper/manifest/runtime/env/publish. Mandat B3 : backend Produit seulement sur copie, sans API/Work hébergé/génération, abonnement, secret, compte, automation ni déploiement. Aucun fichier de private-integration touché. La factory existante verifyWorkSitePublisher est IMPORTÉE depuis private-release/qa-sites-modifier.mjs, jamais dupliquée ni modifiée.

Base du DELTA : QA114 39250db5f64f4b4f14b9da571a48c127555614f5 + B2 livré8332226bd45f9cafd4649bac9773dc60c41ea5ff, patch SHA2567b607900f13aac842a749aed5a4c38858e4848df75a14b6a71ef00d69b70ead0. Checkpoint local de cette base a55d56e068979c4c28ada6fbcfe55b91edb63229. Il sert au contrôle du delta, pas de nouvelle branche à intégrer. B3 ne réapplique PAS B2. Privé83/ad66d47242729bcea6509e91b66126f67661da52/env8, natif156c71140dd8409980d3ae3a40608d9e0ce793ea inchangé, env9 opt-in false enregistré non déployé sont les références rapportées par l'intégrateur. Gate8d90aa12e6aee951b6aee08060364f7536fe0658 relu. Connexion réelle/subscription active et tâche6acd7f717c44819190c9068c9030732b conservée avec source asdk_app_sites_f05d060424848191971382ec818225d4 sont les faits du mandat, aucune opération rejouée par B3.

## Changements backend

- product/native-work-server.mjs : branche directement FABRYA_WORK_PREVIEW_READBACK vers readWorkPreview, FABRYA_WORK_PUBLISHER_VERIFY vers verifyWorkSitePublisher, et réconciliation existante limitée au binding propriétaire native_work_. Même runtime DB, aucun callback d'un autre env ni stub true accepté. Les variables d'env partagées ne sont pas mutées. Les gardes privées/QA/Stripe TEST et authorizeWork officielles de B2 sont conservées.
- product/native-work-projects.mjs (nouveau) : sélection des projets par request_key /^native_work_[a-f0-9]{64}$/ dans fp_projects ; seul le propriétaire via fabrya_session accède au port. Null uniquement pour les routes/projets historiques, pour continuer leur fallback actuel. Un projet natif reconnu est consommé même si route interdite ou compte étranger : jamais transmis au déterministe.
- product/native-work-intake.mjs : injection du vérificateur natif renforcé par la factory serveur pour afficher la même qualification que la lecture/approbation. Le contrat fabrya.native-work-intake/v1, les clés, le brief sauvegardé et les IDs canoniques restent ceux de B2.
- product/service.mjs : garde propriétaire locale supplémentaire avant réconciliation : native_work_ avec adapter autre que work-mcp donne NATIVE_WORK_ADAPTER_REQUIRED409. Protège aussi les chemins indirects de l'ancien HTTP handler, notamment events/conversation, sans modifier l'adapter des projets historiques.
- product/work-product-adapter.mjs : libellé du brief corrigé en « Produit du MÊME événement, jamais dans une autre base ». Aucun brief/job historique réécrit.
- tests/product/native-work-reception.test.mjs : tests locaux de bout en bout et erreurs, aucune vraie requête Work créée.

## Montage pour l'intégrateur — pas de wrapper fourni ni modifié

Réutiliser la factory nativeWorkServer de B2, avant le fallback historique, sur la même DB privée. Appeler son fetch pour les routes ci-dessous et ne poursuivre le fallback que si le résultat est null. B3 ajoute la sélection native ; ne PAS modifier globalement l'ancien productHandler pour lui injecter Work. La garde de service évite sa réconciliation accidentelle mais ne remplace pas le bon ordre du routage.

| Route native reconnue | Méthode | Traitement |
| --- | --- | --- |
| /mcp | POST | Même transport workMcp, auth officielle et trois hooks réels ci-dessus. |
| /api/product/native-work-intake | GET / POST | Contrat B2 ; préflight GET sans création ; POST reste opt-in false jusqu'à décision de l'intégrateur. |
| /api/product/projects/:id | GET | productHandler + productService + workProductAdapter explicites, suivi du même job. |
| /api/product/projects/:id/work-previews | GET | Événements d'aperçus réels, propriétaire seulement. |
| /api/product/projects/:id/work-previews/:preview/preview | GET | HTML réel conservé, sandbox existante. |
| /api/product/projects/:id/versions/:version/preview | GET | Octets de la version canonique ; recordWorkClientPreview existant après authentification. |
| /p/:version | GET | Permalien privé natif, propriétaire et sandbox existants. |
| /api/product/projects/:id/approve | POST | Même origine, aucune activation/subscription existante, provenance et livraison vérifiées, writer exact, aperçu propriétaire enregistré, puis approbation canonique. |

Les autres opérations natives (PATCH, jobs/retry, revisions, conversation, crédits/changements, checkout/payment/portal/publish/restore) sont refusées dans CE port B3. Le mandat couvre réception/lecture/validation, pas une nouvelle création ni l'activation payante. Checkout/payment/publish/restore donnent NATIVE_WORK_COMMERCE_LOCKED409 ; aucune clé Stripe n'est lue par B3, aucun appel Stripe n'est exécuté. Même après une livraison approuvée, le paiement reste fermé dans ce port jusqu'à un raccordement Stripe TEST distinct réellement validé. Le delivery.checkout_allowed canonique décrit uniquement la preuve de livraison ; il ne signifie pas que B3 ouvre une route Checkout. Pas de déclaration « prêt à payer » à en déduire côté front.

Une approbation native demande le vérificateur de livraison existant PLUS le reçu exact qualification=verified avec publisher_readback.verified, même site, même hash et release_ref work_release_<version_id>. Preview_only est consultable mais non approuvable/payable. Aucune conversion de NOT_VERIFIED en PASS visuel. Les versions artistiques ultérieures restent lisibles ; l'approbation B3 est limitée au binding de livraison original et ne contourne pas le circuit Work de review.

## Dépendances et migrations indispensables

**Aucune nouvelle migration Produit B3.** B2 doit déjà disposer du core fp_* et fp_version_delivery avec ses triggers et de son lot Work11tables/4triggers. Ne pas rejouer B2 ni0000/core/identités. GET de réception/preview ne provisionne pas de moteur ni ne crée de job. Les initialiseurs canoniques existants WorkReviews/Previews peuvent faire CREATE IF NOT EXISTS sur leur schéma déjà installé.

Pour le vrai Site de chaque événement, Work doit livrer le writer createSitesDataWorker EXISTANT et ses migrations engine/postpurchase/sites-data-drizzle/0000_windy_amazoness.sql via les opérations officielles autorisées, sur le DB de CE Site livré, avant completion. Ce n'est pas une migration du DB Produit ni une publication exécutée par B3. Binding exact claim.delivery, même client/project/site, baseline release work_release_<claim.delivery.version_id>, proof.site_change_baseline authored exact. Aucun moteur alternatif.

Secrets uniquement obtenus/configurés via le circuit officiel du véritable Site : FABRYA_SITE_WRITER_SECRET sur ce Site ; FABRYA_WORK_SITE_<site>_READ pour readWorkPreview ; FABRYA_ENGINE_SITE_<site>_WRITE_SECRET et _READ pour verifyWorkSitePublisher sur le Produit du MÊME événement. B3 ne lit, ne crée et ne copie aucun de ces secrets. Les alias A/B historiques du vérificateur existant ne correspondent pas à un nouveau projet native_work_, donc aucun transfert QA ni compte/solde/subscription.

readWorkPreview vérifie bytes ET hash servis par le Site privé. verifyWorkSitePublisher fait la vérification signée du writer existant (reconcile bootstrap sans nouvelle commande, puis GET/index.html et release/hash exacts). Les fonctions existantes sont maintenant montées, sans bypass. Le flux peut donc refuser une completion si le Site/writer/identifiant de lecture n'est pas réellement provisionné ; conserver la request/le job, ne pas en créer un autre.

**backend-closure.json** : fermeture transitive réelle esbuild ESM browser/es2022, 57 fichiers du dépôt +4 fichiers de paquets installés (fflate0.8.2 et jpeg-js0.4.4). Chaque fichier a son SHA256. Les paquets sont déjà présents, aucune installation. Aucun fichier d'UI/CSS/worker-entry requis. La factory de writer importe l'engine existant ; l'utiliser tel quel, ne pas recopier un moteur. Garder tout fichier cible identique ; comparer les écarts avant intégration. raw-assets resolver requis pour work-creation-method.md?raw. Cette fermeture indique les dépendances, pas57fichiers à remplacer aveuglément.

## Preuves et limites

42 tests ciblés PASS et31 tests de non-régression PASS. Les fixtures exécutent les vrais handlers Work/Product et le vrai Sites data Worker en SQLite mémoire, avec tout fetch intercepté. Test du reçu completion→readback→writer→réconciliation du même job→preview du bon client→approbation ; zéro commande de publication, checkout, activation ou abonnement client. Tests de secret manquant/erroné, bytes changés, binding writer étranger, origine étrangère, client étranger, preview_only, projet actif, et ancien déterministe bloqué sans altérer le job natif. L'ancien projet continue de fonctionner et de retourner null au routeur natif. Les gardes de B2 restent testées.

Les PASS locaux ne certifient ni démo réelle ni navigateur ni fidélité artistique. B3 ne déclenche pas le nouveau plugin exposé, ne touche pas la subscription active, la tâche existante, env9, les comptes, les crédits ou la génération. **Exécution de réception hébergée avec B3 = NOT_VERIFIED ; intégration et publication restent exclusivement chez ee22dc8c2fb4.**


Validation finale : npm run build PASS + assertions privées PASS ; compilation du backend ESM browser/es2022 PASS ; git diff --check PASS ; git apply --check PASS sur contenus exacts B2. Commit source local f36807c01182187d721990b11efef14baf930fe2. Patch différentiel SHA256 9f21946148d7e6cf98f39c9a7e88357df5c36369ba7f8c245f9a1344b37ebcb5. Aucun déploiement B3.
