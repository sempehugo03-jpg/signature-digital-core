# Audit final avant commercialisation

## Verdict

Decision : **GO controle**.

Le parcours complet est testable de bout en bout dans l'architecture locale actuelle. Aucun blocker majeur non traite n'a ete identifie apres correction des textes client trop techniques sur le retour paiement et la page demo prete.

Le GO reste controle car plusieurs etapes demeurent volontairement manuelles : Lovable, controle qualite, validation client, verification juridique, domaines et activation finale.

## Parcours actuel audite

1. Tunnel client : `/analyser-mon-site` cree uniquement un `Project` et un `ClientBrief`.
2. Projet : `/admin/projects/:id` reste la source principale de production.
3. ClientBrief : resolu par `resolveProjectClientBrief()` avec compatibilite anciens projets.
4. Prompt Lovable : genere par `generateLovablePromptFromProject()`.
5. Retour Lovable : colle, interprete et valide depuis ProjectDetail.
6. Validation Blueprint : auto-validee si le retour Lovable et le Blueprint sont conformes.
7. Import annonces : centralise dans ProjectDetail avec statut `listingImportStatus`.
8. Creation demo moteur : action unique `Creer / Mettre a jour la demo moteur`.
9. Controle qualite : checks automatiques + 3 confirmations humaines.
10. Preparation lien client : action unique `Preparer le lien client`, passage en `client-review`.
11. Mode demo public : consultation complete, ecritures verrouillees, CTA activation.
12. Espaces vendeur / agent / patron : lecture en demo, auth normale en active.
13. CTA activation : centralise via le mode demo et les URLs agence/projet.
14. Offre commerciale : source centrale + snapshot projet.
15. Comptes et invitations : provisioning local, liens d'invitation, emails via outbox.
16. Emails : evenements centraux, simulation/live, retry, idempotence.
17. Domaine personnalise : contrat, fallback, statut honnete, instructions DNS.
18. Coordonnees et identite legale : source centrale agence.
19. Pages legales : mentions, confidentialite, cookies et consentements.
20. Cycle de vie : pause, archive, export, suppression planifiee.
21. Production : SEO, favicon, sitemap, robots, 404/500, readiness.
22. Experience dynamique : salutations, CTA, etats vides et emails contextualises.

## Tests effectues

Tests statiques par inspection de code et recherches ciblees :

- Routes admin : cockpit, projets, emails, moteur, templates, fiche projet.
- Routes publiques : accueil, tunnel, suivi, demo-ready, activation, paiement succes/annule, invitations, 404/500.
- Routes agence : public, estimation, connexion, vendeur, agent, patron, biens, fiche bien, mentions legales, confidentialite, cookies, sitemap, robots.
- Projets conceptuels : `client`, `pilot`, `internal-test`.
- Scenarios : agence avec site, sans site, sans logo, sans annonce, plusieurs annonces, Blueprint valide/invalide, retour Lovable avec warnings, ancien projet, ancienne agence.
- Etats agence : demo, active, paused, archived, deletion-scheduled.
- Domaines : fallback non configure, custom verifie, SSL non pret.
- Responsive : contrat existant mobile/tablette/desktop audite par presence des regles centralisees PR39 et des routes.

Commandes d'audit principales :

```bash
rg -n "Route|path=|navigate|onNavigate|activation|demo|admin|sitemap|robots|404|500" src/App.tsx src/components src/lib
rg -n "undefined|lorem|Lorem|Betty|Citya|Blueprint|runtime|LovableOutput|ProjectDetail|agencyId|slug" src/components src/lib src/data
rg -n "button|onClick|disabled|Activer|Créer|Valider|Préparer|Envoyer|Supprimer|Archiver|Pause|Réactiver" src/components/admin src/components/demo-template-immobilier src/components/public
rg -n "clientBrief|lovableOutput|listingImportStatus|demoReviewStatus|generatedAgencyId|projectType|agencyType|domain|compliance|lifecycle|productionReadiness|experienceCopy" src/data src/lib src/components/admin src/components/demo-template-immobilier
rg -n "webhook|serveur|Stripe Checkout|modules sensibles|LovableOutput|ProjectDetail|Blueprint" src/App.tsx src/components/public src/components/demo-template-immobilier/OpusDomusTemplate.tsx
```

## Resultats par zone

### Admin

- Cockpit : pilotage uniquement, pas de creation agence directe.
- Projets : creation projet et production agence centralisees.
- ProjectDetail : parcours principal coherent, prerequisites centralises, boutons critiques desactives si non prets.
- Templates : maintenance agences existantes, pas de workflow principal concurrent de creation.
- Moteur : reste technique/admin, sans incidence directe sur le parcours client.

### Public client

- Tunnel : ne cree pas d'agence.
- Suivi client : reste compatible ancien parcours, ouvre la demo moteur quand `liveRepoLink` est pret.
- Demo-ready : encore utilisable pour anciens projets, mais le parcours cible reste ProjectDetail puis lien client.
- Activation : tarif snapshot, paiement securise, pas d'activation sans confirmation.
- Paiement retour : ne pretend pas activer l'agence.

### Agence demo/active

- Demo : consultation possible, ecritures redirigees vers activation.
- Active : auth et permissions conservees.
- Paused/archived/deletion-scheduled : routes bloquees par page statut.
- Isolation : les donnees locales sont filtrees par `agencyId` / `agencySlug`.

### Emails

- Evenements et outbox centralises.
- Destinataires resolus depuis ClientBrief, compte, demande ou coordonnees agence.
- En cas de configuration absente, simulation au lieu de crash.
- Echec email ne bloque pas l'action metier.

### Production

- URLs agence resolues par `resolveAgencyPublicUrls()`.
- `sitemap.xml` et `robots.txt` disponibles par agence.
- SEO centralise par agence.
- Production readiness signale domaines, SSL, conformite, favicon et routes.

## Problemes corriges

1. Page retour paiement : suppression du terme visible `webhook Stripe`.
2. Activation : suppression des formulations visibles `Stripe Checkout` et `cote serveur`.
3. Page demo-ready : remplacement de `modules sensibles` par une formulation client.
4. Page 500 : remplacement de `Erreur serveur` par `Erreur temporaire`.

## Problemes restants

### Warnings non bloquants

- Les pages `/suivi/:token` et `/demo-ready/:token` restent des compatibilites historiques. Elles ne bloquent pas le nouveau parcours, mais devront etre simplifiees si le suivi client devient un produit commercial public.
- Certains labels admin affichent encore des termes techniques utiles a l'operateur : Blueprint, Lovable, slug, statut domaine. Ce n'est pas expose au client final hors admin.
- Les tests responsive finaux restent essentiellement contractuels dans cette PR ; aucune capture automatique n'a ete ajoutee.
- La verification DNS, SSL et suppression externe restent honnetement manuelles/simulees, comme prevu par les PR precedentes.

### Blockers

- Aucun blocker majeur restant identifie dans le perimetre de cette PR.

## Doublons et sources de verite

- Creation agence : source principale ProjectDetail, via `generatedAgencyId`.
- Retour Lovable : source principale `lovableOutput`, avec `visualBlueprint` synchronise.
- Annonces : source principale ProjectDetail, statut `listingImportStatus`.
- Offre : source centrale `commercialOfferStore`, snapshot projet pour le client.
- Coordonnees : source centrale `AgencyContactAndLegalIdentity`.
- Domaines : source centrale `AgencyDomainConfig`.
- Emails : source centrale `emailEventSystem` + outbox.
- Experience dynamique : source centrale `experienceCopy`.

Doublons encore presents mais compatibles :

- `demoLink`, `lovableLink`, `liveRepoLink` restent pour compatibilite historique.
- Champs historiques Project (`pain`, `goal`, `desiredFeeling`, etc.) restent lisibles via `ClientBrief`.

## Boutons critiques

- `Interpreter et valider` : agit sur LovableOutput et Blueprint.
- `Valider toutes les annonces` : agit sur les annonces importees sans inventer de donnees.
- `Creer / Mettre a jour la demo moteur` : bloque si prerequisites absents.
- `Preparer le lien client` : bloque sans QA complete et agence creee.
- `Activer l'agence` : bloque sans validation commerciale et readiness.
- Actions demo privees : redirigent vers activation au lieu de faux succes.
- Suppression definitive : separee, planifiee, avec confirmation forte et delai.

## Mesure operationnelle

Estimation pour une agence standard avec site et 3 annonces :

- Clics operateur hors Lovable : environ 28 a 38.
- Temps hors Lovable : 35 a 60 minutes.
- Temps avec Lovable : 60 a 120 minutes selon iterations.
- Etapes manuelles utiles : controle retour Lovable, controle annonces, QA visuelle, validation client, activation.
- Risques humains principaux : coller un retour Lovable incomplet, oublier de valider une annonce, confirmer trop vite la QA mobile, activer avant accord client.

## Go / no-go commercial

GO controle pour rendez-vous terrain et pilotes internes.

Conditions avant vente large :

- Utiliser un projet `internal-test` pour repeter le parcours complet avec vraies adresses email.
- Verifier manuellement une agence avec domaine custom et une agence sans domaine.
- Faire une revue juridique reelle des documents generes avant toute mise en production client.
- Ne pas promettre automatisation DNS, SSL, suppression externe ou paiement confirme sans webhook.

## Checklist rendez-vous terrain

1. Creer un projet client depuis le tunnel.
2. Creer un projet `internal-test` depuis Admin / Projets.
3. Verifier ClientBrief et prompt Lovable.
4. Coller un retour Lovable valide avec warnings.
5. Corriger un retour Lovable invalide.
6. Importer une annonce, la corriger, la marquer prete.
7. Valider toutes les annonces.
8. Creer la demo moteur.
9. Tester public, estimation, fiche bien, connexion.
10. Tester vendeur, agent, patron en mode demo.
11. Verifier que chaque ecriture demo ouvre l'activation.
12. Completer les 3 confirmations QA.
13. Preparer le lien client.
14. Verifier page activation et snapshot tarifaire.
15. Creer patron/agent/vendeur, verifier les liens d'invitation.
16. Verifier outbox email, simulation/live, retry.
17. Configurer un domaine custom fictif et lire les instructions DNS.
18. Verifier footer, contact, mentions, confidentialite, cookies.
19. Exporter l'agence.
20. Tester pause, reactiver, archiver, restaurer, demander suppression, annuler.
21. Verifier sitemap, robots, favicon, 404 et 500.
