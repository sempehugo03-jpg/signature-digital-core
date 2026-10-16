# B5 — D1 strict et réception du job original interrompu

## Base, propriété, non-actions

Delta UNIQUEMENT sur B4 PR212/61f0d485fabfc616ef05052798970df920efdfc4, source locale2ebc9505b70429666f0a794b97384d6833e8aa95. B4 reste à intégrer par ee22dc8c2fb4 ; appliquer B4 puis B5, pas rejouer B1/B2/B3. Comparer les base_files SHA256 avant application si les modules cibles ont changé. Intégrateur unique conserve wrapper/natif/UI/private-integration/env/publications. Aucun de ces fichiers ou environnements partagé n'a été ouvert/modifié par B5.

La request réelle wrk_c4cf034b9c98bce622079e1a4c60bc4ffca39f55, projetprj_2c7d20e2ab1a47a381f13938a38b66ab, job_e3ab0bd53f9335fdca19d82f11f03211, ver_11bfa5ae3ffcb44e64688fef809fc8d5, owner7e26727c-e195-42bc-93ea-e9277e104fe0 n'a été ni lue, ni claimée, ni réémise, ni modifiée. Son état est celui du mandat, pas une observation distante de B5. Aucun accès D1 hébergé, donnée client, secret, env, MCP/WorkAppel/OpenAI, automation ou déploiement. Les seuls accès distants sont les sources publiques Cloudflare et cette livraison GitHub autorisée.

## Reproduction avant correction et preuve primaire

before.log conserve le test rouge lancé AVANT modification du backend B4. Même schéma Work déjà installé, vrais handlers/nativeWorkServer/productService/workProductAdapter, shim exec exécutant chaque ligne séparément. Le test attend queued ; obtient failed après le passage getJob/listWorkPreviews. Aucun appel hébergé.

original-shim.log exerce en supplément le code ORIGINAL du même initialiseur B4 extrait du commit de base, sans le réécrire : schéma Work préinstallé, exec découpé par newline. Résultat exact incomplete input sur la première ligne CREATE TABLE IF NOT EXISTS fp_work_intermediate_previews (. Cette seconde preuve ne dépend pas d'une interprétation du catch service.read.

Sources primaires lues : https://github.com/cloudflare/workerd/blob/main/src/cloudflare/internal/d1-api.ts , D1DatabaseSessionAlwaysPrimary.exec (query.trim().split('\n')), et https://developers.cloudflare.com/d1/worker-api/d1-database/#exec . Le shim reproduit le découpage du wrapper ; il ne prétend pas reproduire tout le service D1 distant.

## Correctif borné aux initialiseurs de ce chemin

product/work-schema.mjs est un petit utilitaire SQL interne, PAS un service ou schéma parallèle. Il reçoit les instructions CREATE canoniques déjà existantes, vérifie les noms dans sqlite_master, puis une instruction complète par prepare/batch UNIQUEMENT si un objet manque dans le mode legacy. Plus aucun db.exec sur ce chemin Work ; une instruction multiline reste entière dans son prepared statement, y compris les triggers BEGIN/END.

Les cinq initialiseurs réutilisent leur schéma exact : initializeWork, initializeWorkPreviews, initializeExperiences, initializeWorkRevisions, initializeWorkReviews. Aucune table/colonne/trigger nouveau. Le test compare leur création locale sans exec aux11tables/4triggers du lot native-work-schema.sql existant ; identité de schéma confirmée. Les objets déjà présents ne reçoivent aucun CREATE/ALTER/DROP. Un échec d'initialisation n'est pas conservé en cache.

nativeWorkServer marque son binding comme géré par migrations Sites dans ce même utilitaire. En contexte privé, un objet manquant produit WORK_MIGRATED_SCHEMA_MISSING au lieu d'une migration implicite pendant une lecture. Le mode historique hors cette composition garde sa compatibilité d'initialisation, sans déploiement QA114. Aucun paramètre env ni secret supplémentaire.

Writer examiné dans CE chemin : createSitesDataWorker initialise uniquement le baseline conservé par des prepared INSERT/batch ; les tables fs_data_* sont déjà sous migrations Sites. Aucun changement du writer nécessaire. Les tests stricts refusent tout DDL à la fois dans DB Produit migré et dans DB du vrai Sites data Worker en mémoire ; completion/readback/writer/preview passent sans DDL et sans commande publish.

## Réception authentique et récupération bornée

reconcileProductWorkDelivery, appelé par le callback authentifié existant de completion, peut maintenant réarmer les DEUX lignes job/version originales puis utiliser le MÊME productService.read/workProductAdapter/importeur de provenance. Pas de second importeur, nouvelle commande, version, request ou queue. Aucune réparation par un GET de client d'une request encore queued.

Conditions cumulatives pour réparer :

- projet native_work_ ; binding original exact request/project/user/job/version/site, même adapter_handle pointant déjà vers la request (pas pending), même attempt ; une seule commande et une seule version dans ce premier projet ; aucune autre version ou job de remplacement, même terminal ; état failed avec erreur JSON EXACTEMENT ADAPTER_UNAVAILABLE, recoverable1 ; version source work-mcp failed sans octets/hash préexistants ; aucune provenance déjà enregistrée.
- request completed, méthode pinée actuelle inchangée, artefact conservé dont les octets hachent au SHA annoncé ; receipt/proof/site binding cohérents pour user/project/request/site/version native/client hash et URL ; publisher_readback réel du pipeline existant verified avec même Site/SHA ; pour une qualification verified, release work_release_<version originale> exacte.
- aucune approbation, activation ou subscription ; aucun checkout creating/open/processing/paid ; projet pas active/approved. Un reçu preview_only peut importer l'aperçu réel, mais sa qualification n'est jamais convertie en verified.

Les identités, reçu complet, méthode, octets, hash, handle/attempt et exclusions commerciales sont recontrôlés dans les predicates SQL du MÊME db.batch qui réarme le job failed vers rendering et sa version originale failed vers rendering. Les clés, IDs, created_at et attempt ne changent pas. La transaction suivante est l'import canonique existant qui vérifie les octets, passe ready et inscrit une seule provenance immuable. Le réarmement n'est pas un PASS de livraison.

Si l'importeur échoue encore, le résultat ne prétend pas ready ; le receipt authentique est conservé et une reprise explicite du MÊME callback pourra réessayer les MÊMES lignes, sous les mêmes conditions. Une répétition après succès ne change plus job/version/provenance et n'envoie aucun événement.

Refus testés : remplacement job ou version, achat/approbation/activation/subscription/checkout, autre erreur, cancelled/nonrecoverable, handle ou binding étranger, méthode modifiée, octets altérés, mauvais owner/version/release du receipt, readback négatif et request non completed. Aucun réarmement ni import dans ces cas. Aucune règle de retry/génération générale n'est ouverte.

## Preuves finales et intégration

49 tests ciblés PASS/0FAIL : schéma D1, intake, source B4/HMAC/legacy, réception B3, récupération B5, connexion Work, révisions/aperçus et writer. Le test récupère via une vraie completion de FIXTURE après un échec réel du lecteur Produit, vérifie les mêmes IDs et leur idempotence, preview_only bloquée à l'approbation/Checkout, et le cas d'un import transitoire raté puis repris sans nouvelle commande. Toutes les notifications et lectures de Site sont interceptées en mémoire ; aucun Work hébergé exécuté, aucune preuve artistique inventée.

Bundle backend ESM browser/es2022 PASS, node --check PASS, git diff --check PASS, git apply --check PASS sur les contenus exacts B4. Fermeture transitive62fichiers (58dépôt+4fichiers de paquets déjà présents) : seul module ajouté product/work-schema.mjs, aucun package. Méthode work-creation-method.md byte-for-byte conservée, SHA2569d48a227333e9905c0d536e5fb0ea670cdf43265eb0cf8029da7abdbd9ae7d85 ; source_site_id/contrats B4 inchangés.

**Aucune migration B5.** Garder les migrations Work/Site déjà prévues. Le patch contient8fichiers backend (server, helper,5initialiseurs,adapter) et2tests ; aucun service.mjs, wrapper, natif ou UI modifié. Build complet de l'application non relancé ; bundle backend pertinent vérifié, comme le mandat ciblé B4/B5.

Après intégration privée par le seul intégrateur, il reste à reprendre explicitement la préflight de LA request existante dans LE Work existant et à observer son vrai résultat ; aucune requête de replay ou SQL de réparation distante n'est fournie ici. Le callback ne réparera le job qu'après une vraie réception authentifiée et toutes ses preuves. **Validation hébergée B5 NOT_VERIFIED,0/3 conservé.**
