# B7 — port achat/activation Stripe TEST natif, delta sur B6

Intégrateur unique : ee22dc8c2fb4. Backend isolé seulement. **Aucun déploiement, action client, paiement, génération, appel Stripe/Work/OpenAI/D1 hébergé, lecture de secret/env ou changement d'automation. Hébergé NOT_VERIFIED ; certification 0/3 inchangée.**

## Base et propriété

Base review B6 PR212 `e3a9e30f2f4f880f998f712adda836e499a753f5`, source exacte `d8a84ef914a61ace57bc416ac70ed4818062fe4a`. Source B7 locale `5e09b8721e3b1d2524140df22003fcbec80a2c32`. Patch SHA256 `47d88ed5ebbff0623aeb1d5c22d9e6c14a0f61596727bc943cf3889b3fd965d9`. Sept fichiers backend/test/migration ; adapter et overrides intégrateur HORS PATCH. Ne pas recopier mon adapter ou une arborescence complète sur private-integration. Runtime wrapper/natif/UI/env/hosting et publications réservés à l'intégrateur.

Privé87 et Work original completed preview_only, Site appgprj_6ad29707965c8191a73d804549061f4f/source584ce715… sont des informations du mandat B7, pas une vérification distante par cette exécution. La request wrk_c4cf034b9c98bce622079e1a4c60bc4ffca39f55 n'a pas été lue, claimée, rejouée, modifiée ou complétée ici. Aucune review réelle soumise. Les tests QA du dossier sont explicitement synthétiques en mémoire.

## Chemin livré

`nativeWorkServer` sélectionne toujours les projets native_work_ avant le handler historique. `nativeWorkProjects` ouvre seulement checkout/payment/abandon/portal en POST et checkout-recovery-proof en GET, sous opt-in serveur, préflight de migration et configuration TEST. Identité fabrya_session existante, propriétaire SQL, origine privée exacte et CSRF restent imposés. GET de reprise accepte l'absence normale d'Origin du navigateur ; un Origin étranger ou Sec-Fetch-Site cross-site est refusé. Autres mutations toujours fermées, notamment changes/credits/conversation/revisions/publish/restore. Le GET projet/preview reste le circuit B6.

`nativeWorkPayments` est un port de sécurité autour du stripeGateway EXISTANT : aucune implémentation de création/activation/ledger parallèle. `productHandler` et `productService` canoniques continuent de créer et conserver les checkouts, reprendre la même session, expirer, confirmer, activer et appeler creditService.grantPaidMonth. Les cinq metadata projet/owner/version/approval/checkout sont vérifiées en TEST aussi, sur abonnement ET session, avec le client_reference_id, les références client/abonnement et le binding local du checkout. Le portail reprend uniquement le customer/subscription du projet canonique.

Avant activation : même version approuvée et hash, gate B6 complète (receipt original inchangé, véritable review autorisée si preview_only, accès client, provenance Work, Site/readback/release exacts), abonnement actif conforme 5900 EUR/mois/quantité1/sans essai/remise, facture serveur paid/5900 EUR/aucun solde restant ni paiement hors Stripe, customer et subscription exacts, période mensuelle vérifiable. Le callback paymentGuard optionnel est invoqué par le service canonique avant son batch. Un guard SQL de migration referme la course approval/version/binding pendant l'insertion de l'activation. Le handler historique sans port sécurisé refuse désormais d'activer un native_work_, même si appelé par erreur sur le webhook.

LIVE refusé avant toute opération fournisseur : mode privé test obligatoire, paymentConfiguration refuse une clé LIVE dans l'emplacement TEST, événement live rejeté, objets fournisseur non-TEST rejetés. Aucun secret LIVE n'est utilisé ou recherché. Sans clé TEST officielle, webhook secret, migration, FABRYA_CREDITS_ENABLED=true et FABRYA_NATIVE_TEST_PAYMENTS_ENABLED=true, le commerce natif reste fermé. Aucun opt-in n'est ajouté dans un environnement par B7.

## Webhook global et isolation

POST /api/product/webhook entre dans nativeWorkServer AVANT l'ancien handler. Le handler canonique vérifie HMAC sur les octets exacts + fenêtre300s avant toute classification/écriture. La requête est clonée : en cas de fallback, l'ancien handler reçoit encore le corps original signé.

La classification a trois résultats :
- native canonique : délégation au même service/gateway sécurisé ; ledger fp_webhooks canonique.
- ancien projet identifié par checkout/subscription : null, fallback historique.
- événement étranger/non géré : HTTP200 ignored, AUCUNE écriture fp_webhooks et aucun fallback générique qui le marquerait processed.

Pour le premier invoice/subscription avant l'événement checkout, la lecture TEST fournisseur de l'abonnement retrouve le checkout enregistré via les cinq metadata ; son abonnement doit être celui de la session canonique. La liste large des sessions n'est pas utilisée pour réconcilier un projet étranger. Les événements suivants relisent la vérité fournisseur, pas l'ordre des messages. Une erreur de preuve/facture/transport n'est pas acknowledged processed. Le même événement peut être rejoué après réparation authentique, sans nouvel achat.

La création Stripe dont la réponse est perdue conserve le même fp_checkout ; la reprise longue existante retrouve sa session par metadata/idempotence, sans deuxième création. Aucun booléen/paramètre de retour URL ne peut activer. Abandon sur session déjà payée passe par la confirmation canonique, pas par une suppression de l'achat.

## Crédits et limites transactionnelles

La migration gérée ne crée que fp_credit_wallets + ses deux index + le trigger anti-suppression canonique ; ajoute aussi le trigger atomique de binding de l'activation native. Aucun fp_conversation*, fm_*, change request, seed, copie client/abonnement ou transfert QA. Le wallet conserve le schéma EXISTANT change-credits-schema.sql, avec unicité facture et période. Le service canonique crédite100 seulement depuis facture fournisseur validée, jamais depuis l'URL ou un webhook non vérifié.

Activation/subscription sont dans le batch canonique. Le crédit mensuel est ensuite enregistré par le ledger existant dans une opération séparée : un incident stockage peut laisser une activation conservée avec crédit encore en attente, réponse503 et événement received. Test réel de fixture de ce cas : même webhook rejoué, une activation et un wallet uniques, une seule création Stripe. B7 ne prétend pas une transaction globale entre Stripe et D1. Aucune route client de modifications/credits n'est ouverte par ce lot.

## Migration et compatibilité

`product/drizzle/0006_native_test_payments.sql` est préparée, non exécutée à distance. Intégrateur : l'enregistrer comme migration suivante du catalogue privé officiel après0005 (adapter uniquement numéro si déjà occupé), sans réappliquer0000..0005 ni importer QA114. Cinq instructions entières séparées par statement-breakpoint ; les triggers restent des instructions complètes. Ne jamais utiliser D1.exec multi-lignes, ne jamais migrer pendant une lecture.

Lecture locale seulement des six SQL private-integration/drizzle0000..0005 : leurs checksums figurent dans schema-compatibility.json. Le core0000 est byte-for-byte identique au core de fixture (SHA2563bef5ae3a2c910e1a03d67b82c9a0e676982d70998cdcd1e0d42b49c8adc721e). Les six migrations privées puis B7 sont applicables en mémoire ; B7 réapplicable sans effet secondaire. Aucun wallet initial n'était présumé. Toutes les requêtes runtime de tests stricts interdisent CREATE/ALTER/DROP ; le port vérifie sqlite_master seulement et refuse les objets absents.

## Preuves et reprise

77 tests PASS/0FAIL : réception/review B3-B6, vrai gateway Stripe avec fetch hermétique simulé, succès TEST + activation/crédits, retour forgé, reprise/abandon/portal, HMAC expirée/altérée/LIVE/replay, événements étrangers et legacy, ordre inversé, échec facture/owner/site/version/review, CSRF, migration absente, clé LIVE, course SQL et panne ledger après activation. Aucun test ne constitue un paiement Stripe hébergé ni une QA navigateur réelle.

Commande :
`node --test tests/product/native-work-reception.test.mjs tests/product/product.test.mjs tests/product/qa-payment.test.mjs tests/product/test-webhook-ingress.test.mjs tests/product/change-credits.test.mjs tests/product/work-d1-schema.test.mjs tests/product/work-event-source.test.mjs`

Bundle browser/es2022 PASS, fermeture63 fichiers (59 dépôt +4 fichiers de paquets déjà présents fflate0.8.2/jpeg-js0.4.4), seul module ajouté native-work-payments.mjs ; aucun package. Les hashes des quatre modules runtime modifiés et de chaque dépendance sont fournis. Adapter, méthode pinée SHA2569d48a227333e9905c0d536e5fb0ea670cdf43265eb0cf8029da7abdbd9ae7d85, gateway, creditService et review Work inchangés. Les hashes d'adapter dans la fermeture décrivent la copie B6, pas une instruction d'écraser les overrides intégrateur.

`git diff --check`, `git apply --check` sur B6 exact et reconstruction byte-for-byte PASS. Le dossier contient le delta seulement ; appliquer une seule fois en comparant les hashes avant/après. Ne pas rejouer B1–B6. Voir WRAPPER.md pour montage et prérequis officiels restants. Prochaine vérification réelle réservée à l'intégrateur : QA réelle + review exacte, migration officielle, raccordement du secret TEST dans le même privé, montage webhook, activation de l'opt-in, puis parcours TEST Cloud. Aucun de ces actes n'est revendiqué accompli par B7.
