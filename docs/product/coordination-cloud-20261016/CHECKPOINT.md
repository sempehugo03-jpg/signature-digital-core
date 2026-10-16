# Delta Work2 consommé — 16 octobre 2026

Base QA113/source4ef51de vérifiée inchangée ; PR212/d65c115. Aucun autre auteur Produit ne modifie cette source lors de ce rapprochement. Le Work de recette a signalé son transport Cloud indisponible et n'a préparé aucun patch.

Livrable réel Work2 : commit891af3f90141158da55f942c755c605b21b7e92e, dossier docs/work2-contracts-20261016, reçu PR36/6219014662. Patch binding-reader-proposal examiné puis intégré dans product/work-intermediate-preview.mjs : les deux lecteurs relisent le lien request/job/projet/client et la version réservée. Un binding supprimé ou réaffecté ne laisse plus lire un snapshot orphelin. Les octets historiques restent immuables, sans suppression ou transfert.

Trois régressions ajoutées à tests/product/work-intermediate-preview.test.mjs : suppression du binding, autre job et changement de version réservée. Le propriétaire est refusé404 pour l'ancien artefact et l'historique devient vide, sans effacer les preuves. Les contrôles HTTP propriétaire/étranger/anonyme et le sandbox existants restent acquis dans la même suite.

Validation intégrée : neuf suites,62tests PASS/0FAIL/0skip ; npm run build et assertions privées PASS. Fixtures locales, aucun nouveau snapshot généré ni test de fuite hébergée revendiqué. Work2 n'a trouvé aucun snapshot intermédiaire réel dans l'inventaire QA113 : pas de progression inventée.

Seuls deux fichiers runtime/tests changent. Contrat site-change/v1.0.0, sessions, crédits, consentements, writer et schéma inchangés. DG007/78fff et anciens patches non rejoués. Aucun paiement, publication de site client, restauration ou appel payant.

Checkpoint avant publication privée ; relire le déploiement et les gestes Cloud de l'intégrateur avant de marquer la recette. Public et LIVE interdits sans nouvelle autorisation explicite.


## Publication et contrôle terminaux

Source39250db5f64f4b4f14b9da571a48c127555614f5, QA114, appgdep_6ad2478a4a5481918b26abb415f5b444 SUCCEEDED15:49:44Z/env16. Archive gzip/tar valide avant envoi. Le centre réel a été rechargé, site09:00/97crédits/quatre demandes relus ; format téléphone et abonnement ouverts puis refermés. Cadre390 rechargé : /produit→Mes projets8→Clair actif→Mon projet→Modifier mon site→abonnement, clientWidth=scrollWidth390, compositeur62px. Aucun nouveau cycle ou crédit consommé. Capture fabrya-qa114-mobile.jpg. TTFB2205ms/load3912ms observés : pas de PASS performance globale. Nouveau PASS A/B Cloud non établi dans le Work Produit, dont le navigateur dédié a expiré.

Natif privé76/source5a0b3b03981c7d060209f80bb85ae88e53db7320, source auteur a878349723e02078116e86dbc979460a5176a821 ; déploiement SUCCEEDED/env4. Composants distincts et copies importées non activées. Checkpoint consolidé PR36/7e6ba8b2ae89a8a3f90c6a3421fb11618ac8710e ; neuf scènes/parcours complet non certifiés. Public/LIVE interdits. Ne pas rejouer ce delta Work2.
