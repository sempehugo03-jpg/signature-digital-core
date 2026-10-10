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

Le rapport live-hosted-http-qa.json distingue le parcours D1 réel du Checkout indisponible. Une première exécution a rencontré une erreur réseau après validation. La seconde exécution complète prouve les reprises, la V2, la V1 immuable, la validation, l’isolation entre comptes et l’absence d’activation sans clé LIVE ; le Checkout LIVE reste explicitement FAIL.

## Blocages précis avant READY_FOR_FIRST_LIVE_PAYMENT

1. Créer/valider sous contrôle humain la clé serveur LIVE restreinte, puis la configurer uniquement dans le runtime privé. Le formulaire Stripe est préparé, la création finale n'a pas été soumise.
2. Créer le nouveau webhook LIVE dédié aux cinq événements demandés et configurer son secret côté ingress et produit ; l'ancien webhook reste intact. L'ingress renvoie 503 tant que son secret est absent.
3. Prouver un Checkout LIVE serveur avec la bonne version et les bonnes métadonnées, les retours, l'absence d'activation sans paiement, la réception réelle et la réconciliation.
4. QA navigateur du parcours complet et compositions 1440/390/320, gestion Customer Portal, reçus et emails.
5. Résoudre la récupération d'une création Checkout incertaine dépassant la rétention d'idempotence Stripe et vérifier l'activité commerciale déclarée.

READY_FOR_FIRST_LIVE_PAYMENT = NO
FABRYA_PRODUCT_READY = FAIL

LIVE_PAYMENT, LIVE_SUBSCRIPTION, LIVE_ACTIVATION et CLIENT_SPACE_LIVE ne seront validés qu'après autorisation finale explicite de Hugo et preuve serveur. STRIPE_DESCRIPTOR_SENT n'est pas encore démontré : aucun paiement n'a été effectué.
