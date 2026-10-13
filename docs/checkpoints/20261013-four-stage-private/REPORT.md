# FABRYA — checkpoint séquentiel privé, 2026-10-13

Étape 1 FAIL (partielle). Étapes 2, 3, 4 NON EXÉCUTÉES, donc FAIL. Parcours complet FAIL. Ouverture ventes NON.

## Preuves hébergées acquises
QA privée https://fabrya-product-qa.sempehugo03.chatgpt.site ; version27, source72f76a4d9c3fa4ed28e138feeb1adaec4c13fe4a.
Deux livraisons Work originales completed, liées aux deux sites natifs v1 et aux propriétaires d'origine. Les démos n'ont pas été recréées.
A a réellement ouvert sa version ver_694383e22ccb570cd064d697b7d2c9c3 dans son espace Produit. Capture client-a-space.jpg ; lecture indépendante fp_work_client_previews à 2026-10-13T17:05:39.517Z, hash09e2612241991aa59cf8d5f936f3d40c9ccd82b4aa505d04c189a16609c98064.
Un compte fictif distinct tentant de recevoir le site A a été refusé SITE_OWNER_CONFLICT. Ceci prouve le refus de réattribution, PAS le contrôle complet des routes avec le compte B.
QA source desktop et iframes390/320 : images chargées, menus, accordéons, carte locale. Aucun test physique téléphone revendiqué.
Emballage HTML autonome 2.66Mo →1.81Mo par WebP lossless : pixels RGBA identiques. Sources natives A/B v1 inchangées. Artefacts conservés dans le Git privé Sites private-release/work-artifacts/{a,b}.html.

## Blocage immédiat
Les mots de passe des comptes A/B originaux ont été perdus par le banc précédent. La source QA27 concurrente fournit la récupération MCP administrateur à usage unique suivie d'une connexion normale, révoquant les sessions. Elle est conservée ; le raccourci de session QA26 est supprimé.
La session outillée expose encore seulement les anciennes opérations Work : fabrya_qa_access_issue, fabrya_qa_access_redeem et fabrya_qa_delivery_verify sont absentes de son registre. Aucune capacité native de rafraîchissement disponible. Elles n'ont donc PAS été exécutées. Pas d'usurpation d'en-tête administrateur, injection de cookie, changement de propriétaire, ni contournement.
Action nécessaire : actualiser le schéma du connecteur Produit Client QA existant afin d'exposer les trois opérations déjà déployées ; ensuite normal login B, refus projet/aperçu A, interruption/relogin et preuve enregistrée. L'étape2 reste fermée tant que cette preuve manque.

## Validations et limites
Build réel QA27 npm run build + assertions PASS.
Tests ciblés Work/private-admin/QA recovery :12 PASS.
Suite locale étendue :27 PASS,14 FAIL. client.test nécessite linkedom non installé dans ce checkout Sites ; tests historiques product.test reposent sur livraisons mock qui ne franchissent plus les barrières réelles de livraison, plus une assertion de texte configuration TEST. Ne pas présenter la suite étendue comme verte ni ces fixtures comme paiement hébergé.
Aucun paiement Stripe TEST effectué pendant cette étape ; aucune activation, consommation de crédits ni publication/restauration démontrée. Les blocages antérieurs Stripe TEST runtime et transport du publieur demeurent non résolus et doivent être revérifiés à leurs étapes, sans déclaration PASS.
Contrat site-change/v1.0.0 conservé, blob392a79e06a07fe7a1cd46ff28132b3ffba5054a1. Engine13d4f2cebaaf37965c6d6d8f078c0da0a660510b inchangé.
Aucun changement fabrya.fr, Stripe LIVE, facture, recharge ni nouveau service payant.

## Fichiers
Product auth.mjs, client.mjs, http.mjs, private-composition.mjs, work-mcp.mjs, work-product-adapter.mjs ; nouveaux work-client-preview.mjs et qa-access-recovery.mjs ; tests Work/private-admin/QA recovery. Overlays privés worker.ts/review.mjs conservés en Git Sites ; les fixtures 1.81Mo restent privées, pas copiées vers le dépôt Produit.
Les preuves JSON et logs voisins sont les lectures natives et sorties de commandes, sans secrets.
