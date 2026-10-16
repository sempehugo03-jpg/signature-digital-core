# B4 — discriminant serveur de l'événement Work existant

Propriété intégration/publication : ee22dc8c2fb4. Port backend isolé seulement ; aucun private-integration, wrapper, natif, UI, env, secret, consumer, automatisation ou déploiement touché. Aucun MCP/Work/OpenAI distant appelé. Livraison GitHub de revue uniquement.

## Delta exact sur B3

Base de revue B3 : PR2128260f0bc70755a85e8e715dde540421d86a0e2f2 ; source locale correspondante f36807c01182187d721990b11efef14baf930fe2. Candidat rapporté par l'intégrateur privé85/e1110e57e968bf8b4926caa6524e6cc25c5b426c/env10, natif71e5 : non modifiés ni relus à distance. Appliquer B4 SEULEMENT sur les modules B3 compatibles, vérifier les base_files SHA256 dans checksums.json ; ne rejouer aucune livraison B1/B2/B3.

Six fichiers du delta : product/work-mcp.mjs, product/work-product-adapter.mjs, product/native-work-server.mjs, product/native-work-intake.mjs, product/native-work-projects.mjs et tests/product/work-event-source.test.mjs. Aucun service ni table ajouté.

## Contrat événement privé

Nom conservé : fabrya.demo.requested. Son data exact pour ce privé devient :

```json
{"request_id":"<ID existant fourni par le serveur>","attempt":1,"source_site_id":"appgprj_6acac4a9d9808191b57085eb34fa06be"}
```

Découverte events/list du même MCP : payloadSchema object, propriétés request_id:string, attempt:integer minimum1, source_site_id:string const appgprj_6acac4a9d9808191b57085eb34fa06be ; required=[request_id,attempt,source_site_id], additionalProperties=false. inputSchema, nom d'événement, souscription et protocole MCP conservés.

La constante NATIVE_WORK_SOURCE_SITE_ID vit dans work-mcp.mjs. nativeWorkServer la fixe dans SA copie du contexte serveur après les valeurs env fournies ; aucun env partagé n'est modifié ni nouveau paramètre d'environnement à provisionner. nativeWorkIntake et nativeWorkProjects la transmettent au workProductAdapter ; reconcile reçoit le même contexte. workProductAdapter propage sourceSiteId à l'appel enqueueWorkRequest existant. L'outil MCP fabrya_work_request_create utilise le contexte serveur pour enqueue ET deliver. Ces deux points d'émission sont les seuls existants ; les branches QA historiques qui relaient vers des routes QA gardent leurs gardes propres et ne deviennent pas des appels natifs.

Le contexte optionnel de transport est le sixième argument interne enqueueWorkRequest(db,owner,brief,idem,link,sourceSiteId). Il n'est jamais lu dans le brief, body client, champ projet, arguments RPC, paramètres d'événement ou idempotency_key. Seule la constante exacte est admise quand une source est fournie ; une valeur différente est refusée avant écriture. Aucun champ source n'est ajouté au brief, aux tables, aux clés ou à la méthode pinée.

## QA legacy conservé

Sans contexte serveur de source, le workMcp/workProductAdapter existant garde le payload EXACT {request_id,attempt}, et son payloadSchema EXACT à deux propriétés requises. Un brief QA contenant source_site_id ne l'ajoute pas au transport. Le code QA114 n'est pas déployé ; aucune connexion QA ni souscription déplacée. Le choix privé sur source explicite / QA sur événement historique demeure la responsabilité du consommateur existant, non modifié ici.

## Conservation et reprise unique

EventId reste evt_<request_id>, attempt reste1 dans le data selon le contrat existant ; webhooks signés avec les mêmes headers/HMAC sur le JSON COMPLET incluant source. Les écritures de receipt/status/attempts et les règles de replay sont inchangées. Même owner/idem/brief donnent le même request_id et binding de job/version ; aucun ID recalculé selon la source. La méthode work-creation-method.md est byte-for-byte identique à B3, SHA2569d48a227333e9905c0d536e5fb0ea670cdf43265eb0cf8029da7abdbd9ae7d85. Aucun hash déjà stocké modifié.

**Une receipt déjà delivered ne se réémet PAS pour acquérir source_site_id.** Le patch n'ajoute aucune reprise automatique ni backfill. Une livraison locale pending suit seulement le comportement existant si un appel explicite enqueue est effectué ; test local uniquement, pas une commande à exécuter sur le vrai job.

La demande réelle wrk_c4cf034b9c98bce622079e1a4c60bc4ffca39f55 (projetprj_2c7d20e2ab1a47a381f13938a38b66ab, job_e3ab0bd53f9335fdca19d82f11f03211, ver_11bfa5ae3ffcb44e64688fef809fc8d5, owner7e26727c-e195-42bc-93ea-e9277e104fe0) n'a été ni lue, ni claimée, ni réémise, ni altérée. Son état queued/leaseNULL/delivery1 est celui rapporté dans le mandat, non une observation B4 distante. La reprise de SA seule préflight est réservée à l'intégrateur après correction ; aucune nouvelle création, notification ou démonstration certifiée n'est revendiquée.

## Preuves locales

29 tests ciblés PASS/0FAIL : cinq cas source + suites intake, réception B3 et connexion Work. Tests payload/schema privé exacts, source non usurpable par body/draft/brief/RPC/env, legacy QA exact, HMAC vérifiée et falsification de source rejetée, replay sans doublon ni nouvel envoi, méthode pinée conservée, pending retry local gardant ID et signature, refus source arbitraire avant écriture. Toutes les notifications sont interceptées en mémoire ; aucune tâche Work hébergée lancée.

Bundle de native-work-server.mjs ESM browser/es2022 PASS ; fermeture transitive61fichiers identique à B3 (57fichiers dépôt et4fichiers des paquets déjà installés), aucun module ajouté/retiré. Les cinq hashes backend changent, inventaire exact dans backend-closure.json. Aucune migration, aucune installation. git diff --check PASS, git apply --check PASS sur contenus exacts B3. Pas de build complet long relancé, conformément au mandat B4 ciblé.

Exécution après intégration hébergée : NOT_VERIFIED. Montage/publication/découverte officielle et préflight de la demande existante appartiennent exclusivement à l'intégrateur. Ce livrable n'établit ni démo créée ni lecture Work réelle.
