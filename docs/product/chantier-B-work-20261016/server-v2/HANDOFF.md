# Chantier B — Produit / Work, livraison isolée pour ee22dc8c2fb4

## Périmètre et base

Mandat direct de Hugo transmis par intégrateur unique Work3 ee22dc8c2fb4. Produit seul : aucune CSS, front, route native, flag commercial, configuration, secret, déploiement ou appel fournisseur. Lease integration-ee22dc8c2fb4-atelier conservé, DESIGN-CURRENT non écrit. Aucune reprise ORBE ni nouvelle demande hébergée.

Base exacte locale Sites QA114 **39250db5f64f4b4f14b9da571a48c127555614f5**, checkout original propre conservé ; copie détachée product-work-B. PR212 revue a9fc450353539193d0d2095571a64d4315b5d5db à la lecture. Natif81/29449a3dff8f14ac280dfbaca99903e4740a4d56 et wrapper8dcacf381bf3779dddaa90c406ceb5794b624a11/env7 sont les références du mandat intégrateur, pas une source native modifiée par B. Lecture du contrat natif disponible au c1c9bcad, pas recertification des nouveaux pixels81.

## Diagnostic borné et preuve officielle

Le refus COMMERCIAL_LAUNCH est celui reproduit Cloud par l'intégrateur. L'enlever seul ferait repartir la route native vers sd_projects/generated-sites, pas vers Work.

Lecture officielle Sites read_database_overview du candidat privé, bindingDB : fp_projects/fp_jobs/fp_versions présents ; fp_work_mcp_subscriptions/requests/product_links/artifacts/deliveries/site_bindings ABSENTS, omitted_tables=0. Le même inventaire QA114 contient fp_work_* ; ce circuit existe donc dans un AUTRE binding. Aucun contenu de session, secret de webhook ou ligne client n'a été lu pour cette preuve.

Product productAuth utilise DÉJÀ sd_platform_users/sd_platform_sessions, fabrya_session et SHA256 encodé base64url, comme platformAuth/hashToken natifs. Réutiliser le même DB permet la même identité ; partager un nom de cookie entre hôtes ne permet pas de partager des sessions. Aucun transfert d'identité/crédit/abonnement autorisé ou réalisé.

## Correctif préparé, non monté / non déployé

Deux nouveaux fichiers seulement : product/native-work-intake.mjs et tests/product/native-work-intake.test.mjs.

Factory serveur nativeWorkIntake({db,env,clock}) :

- Fermée par défaut. Exige le domaine privé exact, FABRYA_NATIVE_WORK_ENABLED=true et FABRYA_NATIVE_WORK_ORIGIN égal à ce domaine. POST même origine, session sd_* normale, conversation liée au même propriétaire. Pas d'auth navigateur vers /mcp ni d'identity header forgé.
- Relit le brief confirmé dans sd_platform_conversations.messages_json. Ignore propriétaire/job/projet/solde/callback et entreprise injectés dans le POST. Le POST utilise seulement project.trackingToken et startGeneration=true.
- Preflight avant tout fp_project/job : schéma existant et abonnement Work actif du seul opérateur explicitement attendu FABRYA_WORK_OPERATOR_ID. Ne crée pas des tables pour cacher leur absence. Aucun secret de QA114 recopié.
- Réutilise productService, workProductAdapter, workDeliveryVerifier et enqueueWorkRequest/fabrya.demo.requested existants. Une clé déterministe propriétaire+conversation garde le même fp_project/job/request ; brief changé demande ajustement explicite. Les anciens jobs/sites/comptes restent intacts. Nouveau fp_project est le seul dossier canonique Produit de CE brief natif, dans le même DB, pas une copie d'un projet QA d'un autre environnement.
- GET trackingToken relit seulement la demande existante, sans créer de commande. Une subscription expirée ne masque pas une demande déjà liée.
- Retour distingue Workqueued, event_delivered et execution_status NOT_VERIFIED ; succès du callback ne prouve pas Work exécuté. Callback échoué garde une seule demande pending, sans nouvelle génération automatique ou faux PASS.

**Contrat réponse fabrya.native-work-intake/v1** : trackingToken, product (état canonique productService), work.request_id/status/event_delivered/execution_status. Ce n'est PAS le format {project:sd_project} attendu actuellement par AutonomousSiteBuilder ; ne pas monter aveuglément ce port sur POST /api/client-projects. L'intégrateur garde seul l'adaptation native du statut et de la lecture du résultat, selon ce contrat.

## Dépendance officielle restante — ne pas fabriquer une queue utile

Dans le MÊME binding privé : exposer le transport /mcp Work existant par la composition officielle et établir un abonnement vérifié du consommateur Work existant au bon Site/événement. La présence des tables seule ne suffit pas. Ne pas copier les abonnements ou secrets de QA114, couper une tâche originale/ORBE ou créer un nouveau consumer/automation en doublon. La capacité de raccorder ce consommateur sans nouveau Work reste à établir par les outils officiels.

Le callback de completion doit garder FABRYA_WORK_PRODUCT_RECONCILE vers reconcileProductWorkDelivery et les vérifications de bytes/propriétaire/writer existantes. Ne pas substituer generated-sites ni une API payante à la création Work. Les copies importées et leur ancien abonnement ne deviennent jamais des sites achetés.

## Validation et limites

27tests ciblés PASS/0FAIL/0skip : nouveau port7cas + suites Work connexion/livraison/snapshots/progression. Vraies fonctions et SQLite locales, auth cookie normale et refus étranger, absence de schéma sans mutation, abonnement absent/expiré/mauvais/ambigu, un seul événement signé et job sur replay, polling sans création, brief non confirmé et changé, callback503 non présenté comme exécution. Réseau webhook remplacé en mémoire par fixture ; aucun appel OpenAI, Work hébergé ou paiement. node --check PASS ; npm run build/assertions privées PASS. Aucun coût engagé.

**EXÉCUTION WORK HÉBERGÉE = NOT_VERIFIED.** Pas de requête client créée sur81, pas de génération, aucune recette A→I ou fidélité visuelle revendiquée. Ce patch donne le raccordement serveur isolé et ses gardes ; il ne lève pas la dépendance de transport MCP Events.

## Reprise

Relire PR212/PR36 et bases réelles ; git apply --check du patch puis intégrer les deux fichiers une fois sur une copie Produit compatible. Ne pas appliquer sur QA114 en production ni copier son ancien worker sur81. L'intégrateur décide du montage serveur natif, raccorde d'abord les capacités officielles du même DB, puis vérifie vrais owner/request/job/version, callback, démo bon client. Tant que ces preuves manquent : NON CONNECTÉ/NOT_VERIFIED. Aucun nouveau coût fournisseur, public ouLIVE autorisé pour ce chantier.


## Mise à jour B2 cumulative après checkpoint82

Le livrable B2 remplace intégralement le patch B1 (ne pas empiler). Il ajoute product/native-work-server.mjs (composition backend existante MCP/intake/reconcile), product/native-work-schema.sql (11 tables Work/4 triggers exacts, non appliqué), renforce native-work-intake.mjs (préflight GET sans création, ancien job non dispatché au GET, préflight tables core) et étend tests/product/native-work-intake.test.mjs. Voir DEPENDENCIES.md et backend-closure.json pour montage, auth officielle, migrations, opérateur et fermeture transitive36fichiers existants.

33 tests ciblés PASS, build PASS, bundle backend browser/es2022 PASS, contrôle application du patch sur QA114 propre PASS. Tests core ancien et schéma append-only locaux uniquement. Toute exécution hébergée demeure NOT_VERIFIED.82, QA114, natif/UI, env, secrets, abonnement, tâche création et publish non touchés.
