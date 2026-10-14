# Lot UX204 — revue partielle Work, 11 octobre 2026

Dépôt : sempehugo03-jpg/signature-digital-core. Base exacte : 5f9d4e1633ee33d09339d105b31d92e27570e197 (branche work/fabrya-product-20261010 et refs/pull/202/head). Ce lot ne modifie pas le code pendant le setup ; les changements UX suivent le mandat explicite reçu après préparation.

## Diagnostic et résultat

Le rendu de Mon projet testait seulement le statut active : une version déjà choisie avant abonnement conservait le CTA de validation. Le rendu vérifie maintenant approved_version_id. La version choisie affiche Voir mon abonnement ; une version différente conserve la confirmation de validation. Les repères distinguent version consultée et version choisie et indiquent la prochaine étape. Mes projets et le récapitulatif avant paiement reprennent l’illustration originale inline du parcours Fabrya. Les animations finies restent facultatives et ne masquent aucun contenu.

Le service existant efface approved_version_id lorsqu’une révision est demandée (product/service.mjs, UPDATE de création). Ce contrat est conservé : le rendu reflète l’absence de choix courant, puis permet de choisir V3. Aucune modification de Stripe, activation, service métier, Kévin, SEO ou logo. SHA-256 logo inchangé : 0d095d5bb726e7b35053f2fcfad22d711177398d104dce535ace4529985fc7e2. Prix 59 EUR/mois, renouvellement et exclusion de publication conservés.

## Sources et collisions

Git ls-remote et fetch en lecture : main b4aa307bff039df5146f2da9c149679c0a18dd51 ; branche Produit/PR 5f9d4e1633ee33d09339d105b31d92e27570e197 ; état durable 082e8ab6ebce3e2873b8e079af9fd1161f517034 ; preuves 58d88314691a93cbae8927479fc3eb274193f4a8.
Derniers commits Produit lus : 5f9d4e1633ee33d09339d105b31d92e27570e197, dff49d7b83c00b91ca957d77e69520c3eb8017a8, 37a6a57216b38192337506463ce511a10047f54d, 63874ecce979a6ba99d4733f9aa55123edfda8f5, 5a0efea2b6bea55f300a434c550f8cd7a062f3b3, 1ff66765548446fbd174357908d2ad405ede1335.

Sources locales consultées : AGENTS.md, README.md, package.json et lockfiles, product/package.json, vite.config.ts, supervisor/product/README.md, docs/product/supervisor-readiness.md, supervisor-gates.json, ownership.md, delivery.md, live-readiness.md (extraits historiques), trust-experience-mission.md ; code client/CSS, service et harnais QA pertinents. Sources Git distantes : state.json à la ref d’état ci-dessus ; receipt.json et report.json du dossier e5be3c7ffeb1f2db5e016ff0467c469dd822aac870fd16ae507535ed56c9dbee à la ref de preuves ci-dessus.

État durable observé : BLOCKED_HUMAN, current_action=null ; OWNER_AUTHENTICATION_GATE, run 38168458588. Deux tâches worker SUPERSEDED, aucune tâche QA RUNNING/CLAIMED dans cet instantané. Dernière QA consignée : run 38168275262, reprise 38168443574, effect_count=1, PASS synthétique 1440/390/320. Aucun inventaire indépendant des runs actifs : API GitHub refusée 403 par proxy. Ne pas confondre absence d’action dans cet instantané et absence globale de travail en cours.

Source externe fournie par Work dans cette conversation : PR #202 ouverte Draft, 26 commits, cinq checks réussis et deux neutres ; issue #204 ouverte ; source Sites privée existante 29a06450d7e089730c477173d595cb0ca31a5122, propriétaire seul. Cette vérification est attribuée à Work, pas à un accès API réussi ici. Aucune donnée ni capture de sa session n’est incluse. La lecture de la page issue #204 n’a pas pu être faite directement ici.

PRODUCT_QA_DISPATCH PASS, PRODUCT_WORKER_DISPATCH FAIL, PRODUCT_PERIODIC_WAKE FAIL et PRODUCT_SUPERVISOR_READY FAIL sont les verdicts consignés. Le raccordement autonome permanent reste hors mandat. Aucun Supervisor lancé, aucune file distante modifiée.

Les trois workflows .github/workflows/fabrya-product-{supervisor,watchdog,browser-qa}.yml ont été lus. Le push Produit réveille le Supervisor. L’absence de déploiement public dans ces fichiers ne prouve pas l’absence d’intégrations Vercel/Netlify. Aucun push, fusion, dispatch, déploiement, paiement LIVE ou appel fournisseur payant effectué.

## Validation et limites

Node 24.19.0, npm 11.9.0. Installation frozen npm ci --ignore-scripts, cache /tmp/signature-npm-cache (cache par défaut inaccessible). Builds racine et Worker PASS. 44 tests Produit + 15 Supervisor = 59 PASS, zéro échec, ignoré ou annulé. Vérification navigateur des styles : reduced-motion=reduce donne animationName=none ; no-preference donne fabrya-choice-arrive.

Chromium système 154.0.8037.57, Playwright verrouillé 1.64.0. Aucun navigateur nouvellement installé : le téléchargement initial a été refusé 403 avant le mandat interdisant une nouvelle installation ; utilisation exclusive du binaire préexistant /usr/bin/chromium. Réseau navigateur restreint au loopback, SQLite éphémère, comptes fictifs et facturation simulée. Aucun clic Checkout/portail réel.

Échecs intermédiaires du harnais corrigés : sélection DOM de l’onglet ; assertion incorrecte sur maintien du choix après révision (contrat serveur existant) ; sélecteur abonnement devenu ambigu ; attente approve inadaptée à une fixture déjà choisie ; capture mobile essayant de défiler l’iframe masquée (timeout 30 s). Les captures attendent maintenant le contenu des iframes visibles, évitant les aperçus vides dus au chargement lazy. Chaque reprise a suivi une correction concrète. Verdict et captures de la seule exécution finale : browser-report.json et capture-manifest.json.

## Transfert privé et démarrage

Le lot reste local, à transférer par Work vers la source Sites privée indiquée, sans mise à jour d’une ref GitHub susceptible de déployer. La preview Sites existante n’est pas mise à jour ici : aucun outil Managed Sites disponible. Aucun PASS UX global ou de readiness commerciale. Revue visuelle et parcours cloud connecté Work encore requis.

Depuis /workspace/signature-digital-core :

```sh
npm --prefix product run build
node --input-type=module -e 'import {startServer} from "./supervisor/product/browser/server.mjs"; const s=await startServer(); console.log(s.origin); process.on("SIGINT",async()=>{await s.close();process.exit(0)})'
```

Preview synthétique sur loopback avec port attribué, aucune publication ; pour la version déjà choisie, /interface-fixture?scenario=pending&project=fixture_project. Le parcours réel local peut être démarré depuis /produit avec un compte fictif. SQLite n’est pas conservée après arrêt. GET / et /api/product/auth/session vérifiés pendant setup.

```sh
PRODUCT_QA_CHROMIUM_PATH=/usr/bin/chromium PRODUCT_QA_OUTPUT=/tmp/signature-ux-browser node supervisor/product/browser/suite.mjs
```

Instructions install_script et start_skill sauvegardées dans le brouillon environnement, ainsi que le domaine api.github.com ; les domaines de téléchargement Chromium ajoutés pendant le diagnostic ont été retirés, le navigateur système suffisant. Sauvegarde confirmée, ni application runtime ni publication établie. Utiliser le checkout isolé existant, sans nouveau worktree. Les commits locaux ne sont pas une preuve de restauration dans une nouvelle tâche.

Exécution finale : PASS automatisé à 1440/390/320, 13 fixtures par largeur, 81 captures. Intervalle mesuré première capture → rapport : 82.96 s (hors démarrage). Aucun débordement horizontal supérieur à la tolérance de 1 px ; zéro erreur JS relevée. Ce résultat ne valide pas la qualité UX globale ni la version Sites distante.

## Suivi microcopie demandé par Work

Le texte trop large sur la conservation du choix est remplacé par « Consulter une autre version ne modifie pas votre choix. », dans le repère de version et son rappel adjacent. Sous le formulaire de modification : « Après une nouvelle demande de modification, vous devrez choisir à nouveau une version avant l’abonnement. » Le backend et son effacement du choix lors d’une révision sont inchangés.

Validation de ce suivi : node --test tests/product/client.test.mjs, 4 tests DOM réussis, zéro échec ; npm --prefix product run build réussi. Aucune nouvelle suite Chromium, capture ou installation. Les captures et le rapport navigateur ci-dessus portent sur le lot initial au commit 47ec3875130d6f0a9d26727250f3ef26989b71e4, avant cette correction de microcopie. Work inspectera le rendu final dans la source Sites privée cloud ; aucun PASS UX global déduit de ces preuves initiales.

Patch de suivi texte limité à product/client.mjs et au présent diagnostic. Aucun push, commit ni changement de ref pendant ce suivi.
