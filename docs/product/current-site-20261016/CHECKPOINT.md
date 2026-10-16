# FABRYA — checkpoint après achat, 16 octobre 2026

Statut : travail livré en QA privée, PAS livraison finale FABRYA.

## Intention
Entrepreneurs sans connaissances techniques ; voir son vrai site avant de discuter ; distinguer version publiée et proposition ; vérifier, publier ou revenir en arrière ; conserver la conversation comme cœur de l’espace existant.

## Code et déploiement
Base QA104 `dc9f1159ba543060a582ed7ba5645abba5c17198`.
Dernière source native privée poussée `5cd3957142bc14b268ea635fe99a7b4f22a92976`.
Site existant `appgprj_6acaa0a0fc588191b73beeb33eb23f88` exclusivement propriétaire ; environnement16 inchangé.
Déploiement `appgdep_6ad21ec6dad881919c15f8c34e2ec707` SUCCEEDED, env16, contrôlé après déploiement.
Version exacte `appgprj_6acaa0a0fc588191b73beeb33eb23f88~appgver_9dfc2a74f1ac8191b7621150e4c305f5`.
URL privée https://fabrya-product-qa.sempehugo03.chatgpt.site

Le bridge Engine existant expose une lecture propriétaire de sa release courante. Contrôle de hash, artefact et reçu publisher avant de servir le véritable HTML, route authentifiée, iframe isolée sans same-origin. En cas d’indisponibilité : écran compréhensible de reprise, aucune fausse réussite. Aucun nouveau moteur, contrat site-change/v1.0.0 inchangé.
Le centre existant montre le site et la conversation côte à côte sur ordinateur, et une page défilante sur mobile ; format téléphone, agrandissement et Échap. Ajout d’un état immédiat pendant publication/restauration/rejet, blocage des clics concurrents. Les réserves ne sont plus affichées sur un état terminal rejeté.

## Validation réelle
`npm run build` et assertions de release privée PASS ; 41 tests ciblés PASS, 0 FAIL, 0 skip. Voir tests.log/build.log et browser-evidence.json.
Cloud Clair actif, compte existant : demande 10:15 envoyée UNE fois ; aperçu 10:15 et site courant09:00 distingués ; rechargement conserve la demande ; validation publie10:15 dans current-preview ; restauration confirmée rétablit09:00. Un crédit TEST débité :98→97. Aucune dépense euro.
Deuxième demande10:20 : aperçu prêt, rejet confirmé, réserve libérée, solde97 conservé, site09:00. Aucun aperçu en attente laissé par ce Work.
Mobile réel dans outil de contrôle existant :390×844, clientWidth=scrollWidth=390 ; centre atteint par la navigation normale du compte. Historique accessible au clavier et au défilement (main780/1522, scrollTop742). Ce n’est pas un contrôle sur téléphone physique ni tout le checkout mobile.
Un libellé de réserve périmée après rejet a été découvert dans le navigateur, corrigé dans5cd3957 ; rendu final relu dans Cloud : « Aperçu refusé · crédits libérés », sans réserve périmée ; site courant09:00.

## Autres travaux et coordination
PR36 fabrya-engine : patch conversation/reprise native au commit78fff5b8, base nativeaff8b903, 15 tests ciblés et build PASS, instructions dans commentaire6215326874. Réutilise understand/applyOperations existants, propose avant confirmation ; conserve brouillons et requestId, rejoue avant de débiter. Ce patch n’a pas été déployé sur live-validation par ce Work : propriétaire design actif `design-3735fe3da8e1-1210`, lease constatée jusqu’à13:24UTC, candidat71. Ne pas écraser son checkout ni son déploiement. Coordonné par commentaires PR36 ; aucune réponse ni intégration confirmée.
ChatGPT Cloud est déconnecté : aucune conversation Work lue ou instruction envoyée par ce canal. Ne pas prétendre à une délégation exécutée.
Vérifications hébergées des comptes TEST originaux A/B :25 contrôles chacun PASS, soldes97/98 alors inchangés. Les free_cycle A/B sont des relectures idempotentes historiques, PAS de nouvelles publications. Preuves dans PR36 execution-20261016-pm au commit78fff5b8.

## Limites et reprise directe
La fidélité des neuf scènes, une nouvelle génération Work et sa livraison automatique, les demandes complexes et tous les parcours d’erreur ne sont pas certifiés globalement. Le wrapper privé bloque /api/ai-intake ; aucun appel fournisseur payant autorisé. Aucun snapshot intermédiaire Work authentique disponible dans les checkpoints design ; ne jamais simuler une génération pour obtenir PASS.
Public507 conservé ; public508 sauvegardé reste non déployé. Aucun paiement LIVE, aucune migration destructive, aucune automatisation ou nouveau Work.
Reprendre par l’état du déploiement ci-dessus et le dernier DESIGN-CURRENT de PR36. QA source5cd contient déjà ces changements : ne pas réappliquer le patch QA104. Intégrer le patch natif78fff seulement après coordination du propriétaire design, puis tester la proposition avant/après et la restauration sans nouvelle génération payante. Les deux sources sont différentes : ne pas appliquer le patch QA sur le code natif du candidat design.
