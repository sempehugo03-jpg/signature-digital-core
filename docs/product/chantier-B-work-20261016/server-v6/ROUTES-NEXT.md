# B6 — montage canonique restant, sans ouverture ni déploiement

Ce document est un contrat d'intégration, pas une annonce de raccordement exécuté. Aucun wrapper/runtime/UI/env n'est modifié par B6. Les routes fermées ne sont pas débloquées par le patch. ee22dc8c2fb4 garde l'intégration, les sources gelées et les publications. Même DB Produit, mêmes sd_platform_users/sessions/fabrya_session, fp_projects natifs ; aucun sd_project, clone QA, nouvelle identité ou crédit transféré.

## Première barrière : aucun nouveau montage requis

Conserver nativeWorkServer.fetch AVANT le fallback historique pour /mcp, /api/product/native-work-intake, /api/product/projects/:id... et /p/:version ; poursuivre fallback seulement sur null. Le correctif B6 se trouve dans le vérificateur déjà injecté dans intake et productHandler natifs. Ne pas injecter Work globalement dans le Product historique déterministe. Le garde B5/produit reste applicable aux appels indirects.

Review reste opération serveur/Work authentifiée sur /mcp déjà exposé. Le client ne reçoit pas un endpoint pour déclarer sa QA, signer un publisher_readback ou modifier fp_work_delivery_reviews. Le Site réel en construction et sa configuration autorisée ne font l'objet d'aucune action B6.

## Routes exactes à monter ensuite — toutes restent fermées ici

| Fonction | Route / méthode canonique | Composition et garde indispensables |
| --- | --- | --- |
| Consultation / preview / approval | GET /api/product/projects/:id ; GET /api/product/projects/:id/versions/:version/preview ; GET /api/product/projects/:id/work-previews ; GET /api/product/projects/:id/work-previews/:preview/preview ; POST /api/product/projects/:id/approve ; GET /p/:version | Déjà sur le port natif ; mêmes IDs et propriétaire. B6 reconnaît uniquement la review exacte de la version originale. |
| Auth client | GET /api/product/auth/session ; POST /api/product/auth/login ; POST /api/product/auth/logout | Garder les handlers existants et la session sd_* normale du même hôte/DB ; pas de proxy QA ni nouveau compte pour l'activation. |
| Conversation | GET/POST /api/product/projects/:id/conversation | productHandler/conversationService avec service Work explicite ; schéma conversation migré avant lecture ; distinguer message, start et revise. Ne pas ouvrir start/revise en ouvrant simplement les messages. |
| Révision avant achat | POST /api/product/projects/:id/revisions ; POST /api/product/projects/:id/jobs/:job/retry ; POST /api/product/projects/:id/jobs/:job/cancel selon contrats existants | Réutiliser requestDemo/Work existants uniquement après consentement et règles de concurrence ; pas un second moteur. Ces mutations créent/reprennent réellement une création et restent hors B6. |
| Paiement TEST | POST /api/product/projects/:id/checkout | productHandler/service avec Work, nativeWorkDeliveryVerifier et stripeGateway TEST ; approval exacte, prix5900eur/mois, vérité fournisseur/idempotence canonique. Refuser LIVE avant tout appel. |
| Retour paiement / reprise | POST /api/product/projects/:id/payment ; POST /api/product/projects/:id/abandon ; GET /api/product/projects/:id/checkout-recovery-proof | Même service Work, même session/projet et checkout. Un retour URL success ne constitue pas paid/active ; relire Stripe TEST par le gateway existant. |
| Abonnement | POST /api/product/projects/:id/portal | Même owner/subscription TEST ; aucun customer Stripe fourni par le client. |
| Notifications Stripe | POST /api/product/webhook | Corps brut, verifyWebhook existant et secret TEST du bon endpoint ; signature avant mutation. Dispatch serveur vers le projet natif à partir des contextes vérifiés de Checkout/subscription/invoice ; garder les événements legacy sur leur handler. Pas de bascule globale vers un handler différent qui marquerait des événements étrangers processed. |
| Solde / historique après achat | GET /api/product/projects/:id/credits | changeCreditsHttp/creditService ; owner, activation et abonnement réel TEST ; lire solde sans initialiser le moteur. Les crédits ne sont octroyés que par facture payée vérifiée/idempotente. |
| Site acheté | GET /api/product/projects/:id/current-preview | Même changeCreditsHttp + modifier du vrai Site Work acheté ; bytes/release du writer, sandbox existante. Pas l'ancien sd_project ni une démo remplacée. |
| Message de modification | POST /api/product/projects/:id/changes | changeCreditsHttp/creditService + postpurchaseFactory scoped ; request_key stable, attachment IDs propres au client, baseline/version actuelle signée, site-change/v1.0.0, une seule demande en cours. |
| Pièces jointes | POST /api/product/projects/:id/change-files ; GET /api/product/projects/:id/change-files/:file | Handler existant, limite8Mo, quarantaine/scan/owner ; content-type et x-fabrya-filename, upload non JSON. storagePortsForRequest + stockage/scanner existants ; vérifier réellement les MIME supportés avant d'afficher « tous documents ». |
| Prévisualisation de modification | GET /api/product/projects/:id/changes/:change/preview | Reçu immuable PREVIEW_READY non publié, même base/owner/site/hash, privatePreviewPresentation et assets autorisés. |
| Ajuster/refuser | POST /api/product/projects/:id/changes/:change/reject | Rejet canonique, libération contrôlée de réserve ; réemploi d'une clé ne doit pas remplacer silencieusement un autre contenu. |
| Accord + publication privée autorisée | POST /api/product/projects/:id/changes/:change/acknowledge | La route réelle publie après accord version_id ; productApprovalReader vérifie le consentement exact. Ne pas créer un second /publish. Conflit baseline/release, reprise de commande et coût réel vérifié restent ceux du moteur existant. |
| Retour arrière | POST /api/product/projects/:id/changes/:change/restore | Consentement de restauration exact, target_release_ref/base_sha et expected_release_ref du site courant ; utiliser acknowledgeRestore/rollbackPublished, pas de rollback sur une URL fournie par le client. |

Pour chaque /api/product/projects/:id..., la sélection par request_key native_work_ et l'ownership doivent précéder toute délégation ; la mutation native interdite ne doit jamais retomber vers le déterministe. Les routes globales /api/product/projects (liste), /api/product/events (body.project_id), auth et webhook demandent une stratégie de portée explicite pour préserver le legacy. La liste canonique ne réconcilie pas les jobs ; events peut appeler service.read et doit employer Work pour un ID natif. Ne pas monter le worker-entry QA complet ni ouvrir POST /projects comme nouveau point de création natif.

## Ports existants à réutiliser et prérequis

- product/http.mjs + product/service.mjs ; workProductAdapter avec source constante privée B4, nativeWorkDeliveryVerifier B6 et workDeliveryVerifier. Conserver le callback et overrides de l'intégrateur dans l'adapter B5.
- product/stripe-gateway.mjs : stripeGateway/paymentConfiguration/verifyWebhook. FABRYA_PRODUCT_QA=true et FABRYA_STRIPE_MODE=test, origine privée exacte. Le gateway refuse une clé de mode LIVE dans le slot TEST ; il faut en plus une composition native TEST fermée avant tous les endpoints globaux. Aucun contournement par un booléen frontend, numéro de session ou marqueur paid fourni par le client.
- Activation/100crédits : completeSession et grantPaidMonth existants, metadata exacts checkout/project/user/approval/version, montant et abonnement vérifiés, facture payée et unicité source_ref ; pas de seed de fp_activations/fp_credit_wallets. completeSession/webhook effectuent de vraies lectures Stripe : leur chemin natif doit être testé avec fixtures avant activation. B6 ne les a pas exécutés en hébergé.
- Après achat : postpurchaseFactory({db,env}) et FABRYA_POSTPURCHASE_ENGINE_FACTORY vers qaSitesModifier EXISTANT avec le vrai writer Work ; createProductModifier/productApprovalReader et createSitesDataPublisher inchangés. La factory retenue sait reconnaître un site Work nouvellement livré par son binding/review/activation ; ne pas employer un fallback déterministe si elle retourne publication_available=false. Aucun fm_site du client ne doit être importé depuis QA.
- Stockage : FABRYA_POSTPURCHASE_STORAGE_FACTORY vers storagePortsForRequest existant, puis FABRYA_CLIENT_PRIVATE_R2 et FABRYA_CLIENT_FILE_SCANNER comme ports fonctionnels. La réalisation existante de ce stockage utilise les objets/images D1 ; le nom du port n'autorise ni n'impose un nouvel abonnement R2. Quarantaine et scanner réels obligatoires, pas une fixture « clean » en hébergé.
- Coût/crédits : politique TEST existante explicitement autorisée, qaCreditPolicy/approvedCreditUnit ; paramètres FABRYA_QA_CREDIT_POLICY, FABRYA_QA_CREDIT_UNIT_MICROEUR, FABRYA_QA_COST_BASE_MICROEUR, FABRYA_QA_COST_KIB_MICROEUR. Ne pas faire passer une mesure QA en facture ou tarification commerciale réelle. L'autre chemin d'approbation de politique conserve FABRYA_CREDIT_POLICY_STATE/APPROVAL_REF et FABRYA_CREDIT_UNIT_MICROEUR.

## Secrets — noms uniquement, aucune valeur lue ou préparée

- FABRYA_PRODUCT_STRIPE_TEST_KEY (alias existant STRIPE_SECRET_KEY_TEST), FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET. Catalogue/configuration non secrets : FABRYA_PRODUCT_STRIPE_TEST_PRICE et FABRYA_PRODUCT_STRIPE_TEST_PRODUCT. Aucune clé LIVE, aucun fallback vers un compte LIVE.
- FABRYA_WORK_SITE_<site_project_id>_READ pour la lecture du Site livré ; FABRYA_ENGINE_SITE_<site_project_id>_WRITE_SECRET et FABRYA_ENGINE_SITE_<site_project_id>_READ côté Produit du MÊME événement ; FABRYA_SITE_WRITER_SECRET sur le Site Work du client. Les obtenir uniquement par le circuit officiel autorisé de CE Site, pas par copie d'un autre environnement.
- Aucun nouveau secret MCP, aucune nouvelle subscription/automation/consumer demandé par B6. Les hooks de factory sont des fonctions serveur, pas des valeurs à collecter auprès du client.

## Schémas et risque bloquant de montage général

Aucune migration B6. Avant d'ouvrir les autres routes sur le natif, établir les migrations gérées du MÊME DB : core fp_* et provenance, schéma Work B2, fp_conversation_messages (SQL canonique initializeConversation), product/change-credits-schema.sql + change-restore-schema.sql, engine/postpurchase/durable-store.mjs migration (fm_*), et les quatre tables images de engine/postpurchase/images.mjs. Conserver le schéma Sites data du Site livré dans son propre DB, pas celui du Produit.

initializePrivateChanges est actuellement limité à l'origine QA historique ; le monter tel quel dans le natif ne prouve pas l'installation des crédits. storagePortsForRequest appelle migrateImages ; ne pas l'activer sur un GET privé en supposant des migrations déjà appliquées. Ces points exigent un raccordement de migration explicite et tests D1 stricts avant ouverture, sous propriété de l'intégrateur. Aucun inventaire ni SQL distant effectué par B6.

Demandes complexes : une ligne awaiting_engine est une demande conservée, PAS une preuve d'exécution Work. Le moteur site-change existant et son contrat restent la base ; un raccordement vérifié au Work après achat doit préserver owner/site/baseline/lease et ses responsabilités. Ne pas convertir cette attente en faux statut « Work lancé », ne pas rejouer l'événement de création ni créer un consumer pour masquer ce raccordement non vérifié. Ce port complexe n'est pas livré dans B6.

## Delta UI réservé à l'intégrateur

Conserver project/job/version originaux du contrat natif v1. « Aperçu disponible » pour preview_only ; bouton ouvrir et conversation au centre. Le client ne déclenche pas une review QA en cochant une case. Une réponse409 DELIVERY_NOT_VALIDATED conserve la version et signifie vérification encore requise. Une approval200 avec delivery PASS ne signifie pas Stripe actif : B6 conserve Checkout409.

Quand le raccordement TEST suivant sera réellement validé, la confirmation d'achat vient de payment/webhook/activation canonique, pas de l'URL de retour. Afficher alors le vrai current-preview, crédit canonique et dialogue de modifications ; pièces jointes lorsqu'utiles ; aperçu avant consentement ; confirmation après readback publié ; retour arrière sur la version liée. Les demandes complexes restent « demande enregistrée » tant que l'exécution Work n'est pas attestée. Aucun écran, CSS ou bouton n'est modifié par ce livrable.

**Checkpoint : B6 livre seulement la première barrière review→approval. Stripe TEST/activation, conversation/révisions natives, modification/attachment/publication/restauration et Work complexe restent fermés et NOT_VERIFIED sur ce parcours.**
