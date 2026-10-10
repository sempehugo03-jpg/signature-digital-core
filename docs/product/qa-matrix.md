# Matrice de vérification — état exact

HTTP hébergé signifie : requêtes réelles à un Worker privé et à sa vraie base D1, avec des comptes synthétiques distincts. DOM signifie : interaction des éléments avec Linkedom, sans navigateur ni calcul de layout. Les fixtures Stripe locales ne sont jamais une preuve de paiement Stripe réel, même en mode TEST.

| # | Scénario | Preuve / limite |
|---|---|---|
| 1 | Nouvel utilisateur | PASS API D1 hébergée + DOM inscription |
| 2 | Utilisateur existant | PASS connexion API D1 et DOM |
| 3 | Session expirée | PASS HTTP local, session expirée réellement selon horloge injectée |
| 4 | Brief partiel | PASS sauvegarde côté D1 et SQLite |
| 5 | Refresh pendant brief | PASS relecture API D1 ; vrai refresh navigateur non vérifié |
| 6 | Refresh pendant génération | PASS relecture durable / disque ; navigateur non vérifié |
| 7 | Fermeture pendant génération | PASS interruption/reconnexion HTTP hébergée ; fermeture navigateur non vérifiée |
| 8 | Retour 1 h plus tard | PASS horloge + fermeture/réouverture réelle SQLite sur disque ; pas d'attente artificielle d'une heure |
| 9 | Job lent | PASS adapter MOCK_SLOW avec étapes connues |
| 10 | Timeout | PASS HTTP D1 hébergé, erreur durable récupérable |
| 11 | Job failed | PASS MOCK_FAILED local + crash d'adapter |
| 12 | Retry | PASS HTTP D1 hébergé, même version et tentative incrémentée une seule fois |
| 13 | Double clic génération | PASS HTTP D1 hébergé et concurrence locale |
| 14 | Deux onglets | PASS concurrence/CAS API ; deux vrais onglets navigateur non vérifiés |
| 15 | Perte réseau | PASS DOM, copie locale gardée et erreur humaine ; navigateur non vérifié |
| 16 | Retour réseau | PASS DOM, reprise de la sauvegarde serveur |
| 17 | Démo ready | PASS HTTP D1 + DOM preview sandboxée |
| 18 | Modification | PASS HTTP D1 et DOM |
| 19 | Nouvelle version | PASS HTTP D1, V1 conservée et V2 différente |
| 20 | Validation | PASS HTTP D1 et DOM ; identifiants, utilisateur, timestamp et empreinte figés |
| 21 | Checkout | FAIL hébergé : clé TEST absente, HTTP 503 récupérable |
| 22 | Paiement TEST réussi | NON PROUVÉ avec Stripe ; PASS uniquement gateway-fixture local |
| 23 | Carte refusée | NON PROUVÉ dans Stripe Checkout ; fixture impayée n'active rien |
| 24 | Checkout abandonné | PASS logique locale avec expiration de la session fixture ; Stripe réel non vérifié |
| 25 | Webhook répété | PASS HMAC/SQL local, doublons et événements désordonnés ; vrai webhook Stripe non vérifié |
| 26 | Activation | PASS local après confirmation de gateway-fixture, FAIL preuve Stripe/D1 hébergée |
| 27 | Refresh post-activation | PASS relecture locale, callback répété ne remplace pas la version active |
| 28 | Reconnexion | PASS HTTP D1 après validation ; PASS local après activation fixture |
| 29 | Mobile 390 | NON VÉRIFIÉ : aucun navigateur de QA pris en charge disponible |
| 30 | Mobile 320 | NON VÉRIFIÉ : aucun navigateur de QA pris en charge disponible |

21 tests automatisés passent : 18 tests HTTP/contrat/SQL et 3 tests DOM. La preuve hébergée initiale contient 15 vérifications réussies et le checkout bloqué. Les captures 1440/390/320 n'existent pas ; aucun rendu, redimensionnement ou screenshot n'a été fabriqué pour les remplacer.
