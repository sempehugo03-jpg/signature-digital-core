# FABRYA — finition privée et tests client gratuits

Paquet de revue du patch exact appliqué au Produit privé QA67, base native e5d9ee9306f8f785db6e66f4f69cad2caf0ecbc9. Source finale d23efe533b3e4cb3778f120e6f9c95104aac1a8d. Main ne contient pas le Produit privé actuel ; le patch est conservé ici pour revue, pas pour une fusion automatique sur le public. La PR211 et ses raccordements sont conservés.

Finition des composants : nouvelle couche premium.css partagée entre conversation, compte, formulaires, menus, historique, abonnement, crédits et modifications. Scene, renderer, logo et actifs centraux inchangés. Pas de nouvelle image, font externe ou outil payant. Contraste, focus, surfaces légères, mobile320/390, reduced-motion, reduced-transparency, forced-colors. La navigation de confirmation après achat utilise un dialogue natif accessible ; les brouillons sont conservés par propriétaire/projet après vérification de la session et de l'accès.

Capacités : nouvel endpoint authentifié /api/product/capabilities expose les limites réelles. API limitée à l'import ISARA ; une entreprise nouvelle est refusée sur cette route plutôt que de recevoir silencieusement ISARA. Work historique inchangé. Audit gratuit de nouvelle conversation sans job de génération. Nouveau cycle gratuit A/B sur vrais sites TEST déjà payés ; pas de facture, paiement ou grant fabriqué. Aucun appel de génération nouveau.

Validation locale : 36 tests ciblés PASS (Product auth/isolation/provenance API, Work, crédits, conservation du brouillon, nouvelle conversation, renderer finite geometry320/390/1440 et reduced motion). npm run build et assertions privées PASS. CSS syntax PASS. Ces tests ne prouvent aucun pixel ni geste de navigateur.

QA browser desktop/mobile : NOT_VERIFIED, control-browser indisponible. La procédure Sites interdit le navigateur de substitution. La publication est une version pour examen privé, pas une certification artistique ou un parcours nouveau entièrement autonome.

Fichiers modifiés (19) : product/change-center.html, product/change-center.mjs, product/client.mjs, product/creation-capabilities.mjs, product/draft-storage.mjs, product/http.mjs, product/index.html, product/premium.css, product/presentation.mjs, product/qa-free-intake.mjs, product/qa-payment.mjs, product/qa-site-change.mjs, product/ui-runtime.mjs, product/work-mcp.mjs, product/worker-entry.mjs, tests/product/api-isara-import.test.mjs, tests/product/draft-storage.test.mjs, tests/product/qa-free-intake.test.mjs.


Preuves hébergées finales : nouveau client TEST RIVE, projet/conversation conservés après logout/login, zéro job/credit avant achat, anonyme401 et étranger404. ISARA est toujours openai-api. Nouveau cycle A horaire09:15 et B texte de prestation : aperçu200, véritable publication privée, contrôle des octets, restauration aux SHA initiaux, réserve0 et une seule charge TEST de1crédit chacun. Soldes finaux A97/B98. Aucun paiement ou appel de génération. Le conflit de clé de restauration de l'ancien test a été corrigé avant restauration ; la création de nouveaux projets après initialisation de la table API a été corrigée et testée. Le parcours complet nouveau client→nouvelle démo demeure NON : Work BLOCKED_RUNTIME ; API automatique nouvelle entreprise/publication/non-ISARA non raccordée. Ces preuves HTTP ne sont pas des tests browser desktop/mobile.

Fichier supplémentaire : product/api-isara-import.mjs (protection contre un projet absent lors d'une création nouvelle).
