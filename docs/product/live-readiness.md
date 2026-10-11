# Fabrya — raccordement LIVE avant le premier paiement

Aucun débit réel n'a été effectué. Aucun déploiement ni changement de source sur fabrya.fr. Kévin, les références v115 et le SEO ne sont pas modifiés.

## Stripe vérifié dans le navigateur authentifié

Compte Fabrya, contexte LIVE confirmé par get_dashboard_context. Nouveau produit autonome Fabrya et prix EUR 59/mois créés, actifs, sans essai. Les identifiants LIVE sont conservés dans les variables serveur privées du runtime. L'ancien catalogue et l'ancien webhook ne sont pas réutilisés ni supprimés.

Logo officiel exact : https://fabrya.fr/assets/fabrya-logo.svg. SVG récupéré depuis l'image réellement utilisée par fabrya.fr ; PNG Stripe obtenu par rasterisation, sans redessin. SHA-256 du SVG : 0d095d5bb726e7b35053f2fcfad22d711177398d104dce535ace4529985fc7e2. Icône, logo Stripe et image du nouveau produit utilisent ce fichier. Fond blanc et accent violet #7047EB. Le descriptor du compte et celui du nouveau produit sont FABRYA. Le site commercial Stripe est https://fabrya.fr ; les données juridiques restent inchangées.

Attention : le formulaire d'activité existant indique encore « Clothing and accessories » / « vetement seconde mains ». Cette déclaration historique doit être vérifiée par Hugo ; elle n'a pas été corrigée arbitrairement.

## Hébergement isolé

- QA existante : https://fabrya-product-qa.sempehugo03.chatgpt.site — audience privée et mode TEST conservés.
- Validation LIVE : https://fabrya-product-live-validation.sempehugo03.chatgpt.site — privée, base D1 propre, catalogue LIVE configuré côté serveur, aucun client débité.
- Ingress : https://fabrya-stripe-live-ingress.sempehugo03.chatgpt.site/stripe/webhook — POST signé uniquement, toutes les autres routes refusées. Il ne rend aucun écran produit public.

L'ingress vérifie le corps brut, Stripe-Signature, timestamp ±300 s, livemode et account lorsqu'il est fourni. Destination privée fixe, transmission serveur du jeton Sites en en-tête, redirections interdites. Le produit vérifie à nouveau la signature, puis déduplique durablement l'event_id dans D1. Aucun secret dans l'URL.

## Protection du paiement

Mode LIVE refusé sur QA, compte et origin serveur épinglés, clés/objets TEST et LIVE séparés, anciens produits refusés, prix/product/currency/amount/cadence vérifiés. Checkout uniquement après validation durable. Métadonnées : project_id, user_id, version_id, approval_id, checkout_id, copiées sur la souscription. Session et souscription relues auprès de Stripe avant activation. Une URL success ne crée aucun droit. Les identifiants de prix Stripe restent dans la configuration serveur et ne sont pas renvoyés dans l’état d’abonnement au navigateur.

L'idempotence utilise le checkout D1 existant. Le payload Stripe reste identique sur une reprise. Une réponse perdue après création est récupérée par la même clé d'idempotence ; au-delà de 23 h sans session enregistrée, le serveur refuse de créer une nouvelle session incertaine. Cette récupération longue reste un blocage à améliorer avant le gate de reprise complet.

La réconciliation relit aussi l'état actuel de la souscription et de sa dernière facture. Annulation et impayé conservent le projet, le brief, les versions et l'historique. La version active ne peut pas être remplacée par un ancien callback.

## Vérification et limites

26 tests locaux utiles passent : frontière LIVE, compte/offre erronés, métadonnées, reprise Checkout, signatures, ingress, doublons, ordre des événements, annulation sans webhook, facture impayée/régularisée, persistance, isolation et versions. Ces tests utilisent une gateway contrôlée ; ils ne prouvent aucun paiement Stripe réel.

Build Worker produit et npm run build du dépôt passent. La landing LIVE privée est ouverte et inspectée dans le navigateur cloud. Ce navigateur ne fournit pas de contrôle de viewport documenté ; 1440/390/320 ne sont pas prouvés. MOBILE_PASS reste FAIL.

Le rapport live-hosted-http-qa.json distingue le parcours D1 réel du Checkout indisponible. Une première exécution a rencontré une erreur réseau après validation. La seconde exécution complète prouve les reprises, la V2, la V1 immuable, la validation, l’isolation entre comptes et l’absence d’activation sans clé LIVE ; le Checkout LIVE était explicitement FAIL à cette étape. Le checkpoint suivant contient les vérifications plus récentes.

## Blocages précis avant READY_FOR_FIRST_LIVE_PAYMENT

Clé LIVE et secret webhook configurés, Checkout réel ouvert sans paiement et métadonnées vérifiées ; voir le dernier checkpoint.

1. Vérifier/corriger avec Hugo l'activité commerciale déclarée, actuellement « Clothing and accessories » / « vetement seconde mains ».
2. Compléter la QA navigateur du parcours complet et compositions 1440/390/320 ; le navigateur disponible n'expose pas de réglage de viewport documenté.
3. Compléter la récupération d'une création Checkout incertaine au-delà de 23 h. Le refus actuel protège d'un doublon, mais ne satisfait pas le gate de reprise complet.
4. Livraison par Stripe des événements facturés, réconciliation LIVE, portail lié à un client abonné, reçus et emails : les tests simulés restent distincts de ces preuves. Aucun paiement réel n'a été autorisé.

READY_FOR_FIRST_LIVE_PAYMENT = NO
FABRYA_PRODUCT_READY = FAIL

LIVE_PAYMENT, LIVE_SUBSCRIPTION, LIVE_ACTIVATION et CLIENT_SPACE_LIVE ne seront validés qu'après autorisation finale explicite de Hugo et preuve serveur. STRIPE_DESCRIPTOR_SENT n'est pas encore démontré : aucun paiement n'a été effectué.

## Reprise du 11 octobre 2026 — webhook créé et raccordé

Destination Stripe LIVE confirmée active : `we_1UPAGZA4NzNcjm7qPjkD0IzC`, nom « Fabrya Product LIVE ». Endpoint dédié conservé. Scope Your account, payload Snapshot, API 2026-06-24.dahlia disponible dans Stripe. Cinq événements : checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted. L'ancien webhook n'a pas été modifié.

Secret de signature configuré comme secret serveur sur l'ingress et le produit privé, révision d'environnement 2, puis appliqué en redéployant exactement leurs versions sauvegardées existantes (ingress v2 et produit v4). Les deux déploiements ont réussi. Aucun secret enregistré dans ce document, le code ou un fichier local.

Vérification HTTP réelle : route racine 404, GET webhook 405, POST non signé 400. Un probe signé de type fabrya.webhook.connectivity_probe (événement technique synthétique, aucun paiement ni activation) atteint bien POST /api/product/webhook sur le produit privé ; réponse 503. La route appelle requireStripe() avant traitement et FABRYA_PRODUCT_STRIPE_LIVE_KEY est absente. Cette vérification ne prouve pas encore une livraison réelle Stripe ni la déduplication.

Dashboard LIVE : aucune clé restreinte existante. Formulaire préparé « Fabrya Product LIVE — serveur privé » : Customers, Products, Invoices, Prices, Subscriptions et Accounts en Read ; Customer Portal et Checkout Sessions en Write ; autres ressources None. Création finale non soumise, en attente de confirmation humaine. La clé sera configurée uniquement dans le produit privé, puis le probe signé et Checkout LIVE devront être revérifiés.

READY_FOR_FIRST_LIVE_PAYMENT = NO
Aucun paiement réel déclenché. Tous les autres gates non prouvés restent ouverts.

## Reprise du 11 octobre 2026 — clé LIVE appliquée, vérifications sans débit

Hugo a créé et validé la clé restreinte « Fabrya Product LIVE — serveur privé ». Stockée comme secret serveur FABRYA_PRODUCT_STRIPE_LIVE_KEY uniquement sur le produit privé, révision d'environnement 3. Le GET Stripe account répond HTTP 200 et correspond au compte Fabrya épinglé. Aucun secret n'est enregistré dans le code ou ce rapport.

Après redéploiement, le probe signé fabrya.webhook.connectivity_probe et sa répétition avec le même event_id répondent HTTP 200 via l'ingress public et le produit privé (« Événement reçu. »). Cela prouve le transport signé et l'acceptation de la répétition d'un événement technique synthétique ; cela ne prouve pas une livraison envoyée par Stripe d'un événement facturé.

Parcours HTTP réel sur D1 privée : inscription 201, projet 201, génération 202, validation 200, Checkout 200, reprise 200 avec la même session. GET Stripe confirme livemode=true, mode=subscription, status=open, payment_status=unpaid, 5900 EUR mensuel, sans essai, et les métadonnées project_id/user_id/version_id/approval_id/checkout_id correspondant à la version validée. Une requête de retour success n'active pas le projet : activation absente, statut approved. Aucun moyen de paiement saisi et aucun débit.

Checkout ouvert dans le navigateur : Fabrya et description de l'offre exactes ; après choix EUR, €59.00 par mois affichés. La conversion locale USD proposée initialement par Stripe est une option de présentation de Checkout ; le prix source reste EUR. Le lien Back to Fabrya revient vers la route produit avec payment=cancel. Le compte synthétique n'étant pas connecté dans le navigateur, ce retour affiche la connexion ; le retour authentifié reste à vérifier.

Configuration Customer Portal active existante vérifiée par API : factures, mise à jour du moyen de paiement et annulation en fin de période activées. Pas de session portail liée à un abonnement créée, car aucun abonnement réel n'est autorisé.

Correction isolée du démarrage : attente neutre pendant le chargement de configuration, validation explicite test/live, et erreur neutre si la configuration est indisponible. Plus de faux libellé TEST pendant le démarrage LIVE. Fichiers : product/client.mjs et fixture tests/product/client.test.mjs. 26 tests passent ; build Worker et npm run build du dépôt passent.

Version privée v5 déployée avec succès, env revision 3. Source Sites commit 1f12f7f25a767a5843f907924b7a42f3c61e24a6. Aucun déploiement sur fabrya.fr, aucune modification de l'ancien webhook ni du catalogue historique.

READY_FOR_FIRST_LIVE_PAYMENT = NO
Aucun paiement réel déclenché. Les gates ci-dessus restent ouverts.
