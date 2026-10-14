# FABRYA — livraison privée de l’atelier continu

## Périmètre et décision
Refonte intégrée au Produit existant, QA version de départ 50. Pas de nouvelle application, pas de nouveau circuit Work, pas de nouvelle couche créative obligatoire. Aucun déploiement sur fabrya.fr, aucun paiement LIVE, aucune génération payante. Aucun nouvel achat ni prestation externe.

La mission de finition exceptionnelle n’est **pas entièrement validée** : aucun contrôle de pixels ou d’interactions dans un navigateur réel n’a pu être effectué dans cette session. La version est livrée pour examen privé ; elle ne doit pas être considérée prête à la production.

## Architecture retenue
Un environnement fixe indépendant du rendu de l’application garde sa place lorsque la conversation et les vues changent. CSS perspective, plans architecturaux, sol, lumière violet #7047EB, présence sphérique et matériaux transparents. L’image validée est conservée sans transformation de ses octets et utilisée comme source diffuse de lumière architecturale via CSS ; elle ne sert pas de faux site interactif. Le fichier fourni sous extension PNG est réellement un JPEG ; le type servi a été corrigé à image/jpeg.

La sphère reste une interprétation graphique, pas une reconstruction photoréaliste de l’objet de référence. Le photoréalisme et la valeur perçue de l’ensemble restent à juger sur le rendu réel. Aucun moteur WebGL ni bibliothèque supplémentaire d’animation. Les surfaces fonctionnelles restent planes ; aucune transformation, coloration ou substitution vidéo des sites clients. Aucun son ni accès capteur.

L’accueil donne la place à l’univers. Après connexion, l’atelier se retire vers la périphérie pour conserver la concentration. Une lumière très lente accompagne uniquement un travail déclaré en cours ; elle ne mesure ni ne simule son avancement. Les repères spatiaux expriment la vue ouverte, pas une preuve de réalisation des étapes précédentes. Le rendu respecte la préférence de mouvement réduit, prévoit un mode de transparence réduite et supprime le décor en couleurs forcées.

## Composants modifiés
- product/index.html : charge le même environnement sur le parcours Produit.
- product/client.mjs : positionne les repères selon l’écran et les données disponibles.
- product/conversation-view.mjs : accueil, état confirmé Work, authentique démo interactive, choix de version.
- product/change-center.html et product/change-center.mjs : même atelier, aperçu de modification intégré, texte conservé lors des rendus provoqués par ajout de fichiers. La conservation du texte après fermeture complète n’a pas été ajoutée ici.
- product/worker-entry.mjs : livraison des ressources spatiales et repères du rendu serveur.
- product/spatial.mjs, product/spatial-runtime.mjs, product/spatial.css et product/assets/immersive-reference.txt : environnement continu.
- vite.config.ts : retrait d’un chargeur manuel qui retournait du JavaScript comme CSS ; utilisation du traitement natif ?raw. Le premier build a échoué sur ce chargeur ; le build corrigé passe.
- tests/product/immersive-continuity.test.mjs et docs/immersive/* : preuves locales et limites.

Les API, auth, Stripe, crédits, contrat site-change/v1.0.0, moteur, publieur et SEO existants ne sont pas réécrits. Les pages SEO historiques conservent leur rendu : leur transition depuis ou vers le nouvel atelier n’est pas encore harmonisée. Stripe reste externe avec le mécanisme de retour existant.

## Fonctionnement prouvé dans cette session
**LOCAL_PASS** : conversation conservée, reprise de commande et unicité du job ; isolation des accès et contrôles des crédits couverts par la suite Produit ; aperçu Work authentique dans iframe ; sélection explicite d’une ancienne version et ouverture de la nouvelle livraison par défaut ; statut queued sans étapes supposées ; qualification preview_only qui maintient le paiement fermé. Les contrôles de crédit, publication et restauration de la suite restent locaux avec leurs fournisseurs de test ; ils ne prouvent pas un nouveau parcours hébergé complet.

**HTTP_LOCAL_PASS** : /, /produit, /modifications et les ressources spatiales répondent 200 dans le bundle Produit. Validation du type réel de l’image. Build npm run build PASS et assertions de QA privée PASS : DB QA uniquement, aucun SQL/migration automatique dans l’artefact, aucun nouveau R2/workflow/cron.

**NON VÉRIFIÉ HÉBERGÉ** : inscription, reprise de session, nouveau job Work réellement exécuté, nouveau cycle Stripe TEST, changement réellement publié et restauration après cette refonte. Aucune nouvelle commande Work ni transaction n’a été engagée pour les prouver.

## Tests et performance
Source de départ : 83 tests, 65 réussites, 18 échecs. Candidate finale : 91 tests, 73 réussites, les mêmes 18 échecs. Aucun nouvel intitulé en échec. Les tests DOM historiques et certains scénarios HTTP/mock échouent déjà dans la source ; ils ne sont pas des preuves positives du parcours actuel. Les détails figurent dans tests-comparison.json. Les huit tests de présentation et les cinq tests arrivés en QA51 passent.

Ressources spatiales : Les tailles exactes actualisées figurent dans local-http.json ; la référence JPEG contient 326 247 octets. Ces tailles ne constituent pas une mesure de fluidité. Aucun FPS, INP, LCP, consommation GPU, temps réseau ou score Lighthouse disponible. Le flou du fond et la géométrie CSS demandent encore un contrôle sur appareils modestes.

## Matrice de validation
PASS requiert ici la preuve réelle demandée, pas seulement la présence du code. FAIL — non vérifié ne signifie pas qu’un défaut visuel a été observé.

| Critère | Validation demandée | Preuve disponible / manque |
|---|---|---|
| IMMERSIVE_HOMEPAGE | FAIL — non vérifié visuellement | HTML et ressources 200 local ; atelier intégré |
| IMMERSIVE_SIGNUP | FAIL — non vérifié | Habillage du formulaire existant ; aucune nouvelle inscription hébergée |
| IMMERSIVE_CLIENT_BRIEF | FAIL — non vérifié | Conversation et sauvegarde conservées ; tests conversation locaux PASS |
| IMMERSIVE_WORK_GENERATION | FAIL — non vérifié hébergé | Test queued honnête PASS ; aucun nouveau job réel lancé |
| IMMERSIVE_DEMO_DELIVERY | FAIL — non vérifié hébergé | Livraison existante conservée ; pas de nouvelle livraison |
| IMMERSIVE_PREVIEW | FAIL — non vérifié visuellement | Iframe authentique et sélection de version testées localement |
| IMMERSIVE_REVISIONS | FAIL — non vérifié visuellement | Conversation, historique et comparaison existants habillés |
| IMMERSIVE_CHECKOUT_TRANSITION | FAIL — non vérifié | Offre inchangée et gates conservés ; aucun passage Stripe récent |
| IMMERSIVE_CLIENT_DASHBOARD | FAIL — non vérifié | Projet, historique, compte et abonnement intégrés |
| IMMERSIVE_POST_PURCHASE_CHANGES | FAIL — non vérifié hébergé | Atelier et aperçu intégrés ; contrats préservés et tests locaux |
| VISUAL_COHERENCE | FAIL — non vérifié | Tokens communs ; pages SEO et fenêtres de confirmation natives à contrôler |
| REAL_3D_OR_SPATIAL_DEPTH | FAIL — non vérifié visuellement | Géométrie CSS perspective réelle ; pas de WebGL ni de déplacement libre |
| DESKTOP_QA | FAIL — indisponible | Aucun navigateur réel de cette session |
| MOBILE_QA | FAIL — indisponible | Media queries 720/1100 px ; aucun appareil physique ni émulation testée |
| ACCESSIBILITY | FAIL — audit réel manquant | Labels, skiplinks, focus, reduced-motion et forced-colors conservés ou ajoutés |
| PERFORMANCE | FAIL — mesures réelles manquantes | Tailles des ressources disponibles uniquement |
| EXISTING_PRODUCT_INTEGRITY | PASS local limité / FAIL hébergé | Build PASS, aucune nouvelle défaillance locale ; parcours hébergé non rejoué |

## Corrections suivantes
1. Examiner le rendu réel à 1440, 390 et 320 px ; tester tactile, clavier, contraste, mouvement réduit et réseau lent.
2. Ajuster les compositions et matières sur ces pixels. La qualité artistique exceptionnelle ne peut pas être certifiée par le code seul.
3. Rejouer le parcours avec des comptes isolés : brief, Work réel, livraison, versions, Stripe TEST, crédits, modification, publication et retour arrière, sans lancer de dépense non autorisée.
4. Harmoniser les transitions vers les pages SEO, Stripe et les confirmations de publication/restauration. Les confirmations natives existantes restent une rupture possible d’immersion.
5. Compléter les pièces jointes du brief initial seulement via le stockage privé et les validations du Produit existant ; cette refonte ne prétend pas avoir rendu opérationnelle cette fonctionnalité manquante.

## Reconciliation du travail concurrent
La source a avancé en QA51 (6495b08f90ba5875116059240366e1840c8a0890) pendant cette mission. Le premier push a été refusé sans écrasement. Fusion du travail : messages Work confirmés, contrôle du format téléphone, aperçu de modification ouvrable dans son contexte, préservation du texte à l’ajout de fichiers et dégradation pour saveData/2G/faible mémoire. Les anciens rapports datés sont conservés comme checkpoints ; ce rapport décrit la candidate finale. La PR #210 existante est reprise, sans deuxième PR ni fusion sur main.
