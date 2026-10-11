# Fabrya — validation finale de l’interface privée

11 octobre 2026. Reprise du produit existant sur `work/fabrya-product-20261010`, PR #202. Aucun déploiement sur fabrya.fr public, aucun paiement réel, aucune modification du moteur Kévin, du SEO Supervisor ou du catalogue/webhook historique.

Validation : https://fabrya-product-live-validation.sempehugo03.chatgpt.site

## Ce qui a été fini

Landing et parcours cohérents avec l’offre existante ; navigation mobile sur deux rangées ; sauvegarde et reprise explicites ; progression et erreurs humaines ; aperçu avec chargement ; historique lisible et comparaison mobile à une version ; confirmation exacte de la version ; abonnement et régularisation distingués. Le focus reste cohérent après rendu, et une session expirée ne signale plus à tort des identifiants incorrects. L’utilisateur ne voit pas les termes de plomberie du serveur.

Checkout force le français et désactive Adaptive Pricing pour présenter **59,00 € par mois en EUR**. La conversion USD initialement observée dans le navigateur a été corrigée uniquement sur les nouvelles sessions Fabrya. Aucun changement des anciennes offres ou du webhook historique. La session précédente a été reprise avec le même identifiant, puis fermée explicitement avant l’ouverture de la session corrigée. Aucun code Link, carte ou autre moyen de paiement saisi.

Le paquet Sites compile désormais le Worker depuis les sources courantes avant packaging ; une ancienne compilation copiée par le script d’hébergement avait été détectée puis corrigée. Les dernières modifications ont été rouvertes dans le navigateur après publication privée.

## Preuves et limites

Deux projets de QA fictifs ont été créés via l’interface sur la vraie base privée : Atelier du Pic (V1, modification, V2, validation V2 et Checkout) et Studio des Rives (brief sauvegardé/repris). Le compte de Hugo reste authentifié. La génération existante reste une démonstration déterministe, conformément à la frontière Kévin demandée ; elle n’est pas une preuve du moteur final.

Le navigateur cloud ne fournit pas de réglage de fenêtre documenté. `/interface-review` affiche le **vrai client** dans des cadres CSS de 1440, 390 et 320 px. Les mesures DOM du document sont respectivement 1425/1425, 375/375 et 305/305 (clientWidth/scrollWidth ; barre verticale de 15 px). Les captures sont celles de la fenêtre cloud contenant ces cadres, pas une fausse annonce de résolution native de fenêtre. Chaque taille a été regardée et utilisée.

Les états après paiement, impayés, erreurs et expiration sont atteints par des fixtures privées explicitement marquées « simulé ». Elles exécutent le même client avec un transport en mémoire et des URLs distinctes, sans écrire en D1 ni appeler Stripe. Elles sont indisponibles hors de l’origine privée épinglée. Elles ne sont jamais une preuve de paiement, abonnement ou activation LIVE.

Captures livrées : `fabrya-final-1440.jpg` (landing, session visiteur simulée), `fabrya-final-390.jpg` (aperçu d’espace actif simulé), `fabrya-final-320.jpg` (comparaison mobile et V1 active simulée). Le sélecteur indique la taille et le caractère simulé. Les captures de paiement/compte réel restent internes.

Checkout LIVE réel : retour par le lien Stripe vers `payment=cancel`, utilisateur toujours connecté, même projet et même V2 validée. Une ouverture explicite de `payment=success` sans transaction conserve également l’identité et la version et n’active rien. Le retour success testé n’est pas une transaction réussie.

Portail : configuration LIVE existante (factures, mise à jour du moyen de paiement, annulation en fin de période) vérifiée lors de la reprise précédente. L’interface de gestion/régularisation et ses erreurs est vérifiée en QA ; aucune session portail d’un client effectivement abonné en LIVE n’a été créée puisqu’aucun abonnement réel n’est autorisé.

## Reprise Checkout longue : preuve reproductible

Au-delà de 23 h, une création dont l’identifiant Stripe a été perdu n’est jamais rejouée aveuglément par POST. La recherche parcourt jusqu’à 20 pages de 100 sessions à partir de la date durable moins 300 s, et termine le parcours avant de retenir un résultat unique. Absence, pluralité, pagination incomplète ou contexte incohérent : refus sans nouvelle session. La session retrouvée est relue ; compte, mode, EUR 5900, référence projet et cinq métadonnées sont contrôlés. Réparation compare-and-swap de l’identité durable ; ouverte = reprise, terminée = réconciliation, expiration confirmée = nouvelle tentative explicite permise.

**Stripe réel, lecture seule :** le contrôle privé authentifié a appelé la même fonction `findCheckout` sur le dernier Checkout existant. Résultat : `verified=true`, `mode=LIVE`, `same_session=true`, `session_status=open`, `payment_status=unpaid`, âge 0 h, aucune mutation du Checkout ni création de session. Il a retrouvé la version V2 du bon projet. La route de preuve est épinglée à la validation privée et contrôle le propriétaire ; elle ne répare pas la base et ne facture rien.

**Horloge contrôlée et vraie SQLite :** perte forcée de l’identité avant reprise à 25 h, sessions ouvertes/expirées/terminées, refus sûr sans résultat unique, deux reprises concurrentes. Les requêtes partagent la session retrouvée ; une session de remplacement n’existe qu’après expiration confirmée. Aucun double abonnement ni nouvelle session aveugle dans les assertions. La preuve LIVE de recherche et la preuve à 25 h sont distinctes : aucun vieillissement artificiel de la base LIVE et aucune revendication d’une session LIVE naturellement âgée de 25 h.

Commandes : `node --test tests/product/*.test.mjs` **32/32 PASS** ; `npm run build` **PASS** ; compilation Worker et validation ESM `default.fetch` **PASS**. Les avertissements de taille du bundle historique Vite ne sont pas des erreurs.

Contrastes contrôlés : accent/blanc 5,54:1 ; texte secondaire/fond 5,44:1 ; texte principal/blanc 15,19:1. Onglets mobiles : hauteur mesurée 46 px. Dialogues utilisables à 320 px, labels et erreurs associés, focus visible, clavier et Escape utilisés ; reduced motion préservé.

## Gates

PASS ci-dessous concerne l’interface et la préparation au premier paiement dans le périmètre existant. Cela ne valide pas un débit, un abonnement facturé, une livraison de webhook facturé, le moteur final ou la publication publique.

| Gate | État | Preuve |
|---|---|---|
| LANDING_UI | PASS | Landing ouverte, offre lue, CTA utilisé ; limites de démonstration et de publication explicites. |
| AUTH_UI | PASS | Compte créé/connexion réalisés par Hugo ; formulaires inscription/connexion et expiration ouverts, erreurs DOM vérifiées. |
| PROJECTS_UI | PASS | Compte vide puis deux projets réels ; reprise distincte du projet validé et du brief en cours. |
| BRIEF_UI | PASS | Quatre étapes utilisées ; facultatifs laissés vides, relecture, retour, rechargement et reprise avec saisie conservée. |
| GENERATION_UI | PASS | Proposition durable réelle ; états lente/échec/interruption/annulation et relance utilisés via scénarios privés. |
| PREVIEW_UI | PASS | V1/V2 ouvertes, trois tailles utilisées ; chargement explicite puis contenu réel de l’aperçu. |
| REVISION_UI | PASS | Demande réelle crée V2 durable ; demande et V1 conservées. Coupure réseau garde la demande. |
| HISTORY_UI | PASS | Dates, demande, V1/V2, comparaison desktop et bascule mobile ; V1 redevient active en scénario privé. |
| APPROVAL_UI | PASS | Dialogue identifie version/date/entreprise ; Escape annule V1, confirmation réelle de V2 ; retour V1 explicite en QA. |
| SUBSCRIPTION_UI | PASS | 59 EUR/mois, aucun frais d’installation ; Checkout LIVE ouvert, repris et abandonné sans payer. |
| CLIENT_SPACE_UI | PASS | Espace actif ouvert avec état simulé distinct ; version active, historique, compte, retour depuis abonnement. |
| BILLING_UI | PASS | Actif, impayé, à régulariser et annulé ouverts ; actions de gestion, refus QA, conservation et échéances cohérentes. |
| CHECKOUT_RETURN | PASS | Retour réel Stripe → Fabrya authentifié, même projet/V2. URL success sans paiement n’active rien. |
| CHECKOUT_LONG_RECOVERY | PASS | Recherche Stripe LIVE réelle de la session exacte ; perte d’identité à 25h et concurrence prouvées séparément sur SQLite. |
| FAILURE_STATES_UI | PASS | Chargement, vide, sauvegarde, hors ligne/retour réseau, réseau interrompu, session expirée, création et paiement incertain utilisés. |
| DESKTOP_1440 | PASS | Cadre du vrai produit de 1440 px ; landing, espace et comparaison côte à côte inspectés. |
| MOBILE_390 | PASS | Cadre 390 px ; aperçu, abonnement, compte et réseau inspectés. Document 375/375 px avec barre verticale de 15 px. |
| MOBILE_320 | PASS | Cadre 320 px ; formulaires, projets, états, confirmation et comparaison utilisés. Document 305/305 px, aucun débordement horizontal. |
| ACCESSIBILITY_UI | PASS | Actions au clavier, Escape, focus visible/restauré, labels/erreurs associés, onglets 46 px, contrastes et mouvement réduit contrôlés. |
| BRAND_COHERENCE | PASS | Logo officiel conservé ; typographie, violet, boutons, messages et navigation continus. Aucun habillage parallèle. |
| NO_PROTOTYPE_SEAMS | PASS | Parcours prévu parcouru ; navigation tronquée, comparaison identique, scroll de transition, prix USD et faux champs invalides corrigés. |

FABRYA_INTERFACE_READY = PASS
READY_FOR_FIRST_LIVE_PAYMENT = YES

Aucun blocage d’interface restant observé dans ce périmètre. Le prochain acte LIVE est le premier abonnement, exclusivement après nouvelle autorisation explicite de Hugo. STOP : ne pas payer, ne pas fusionner ni remplacer le fabrya.fr public.

Publication privée finale : source Sites `e004ba22cd797f7a7f1a287d526de4474783137a`, version `appgprj_6acac4a9d9808191b57085eb34fa06be~appgver_203cf025f6c88191b89fe264ca36e534`, déploiement `appgdep_6acbb83e604081918220203d30eded17` réussi, environnement révision 3 inchangé.
