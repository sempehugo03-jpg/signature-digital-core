# Fabrya — finition du parcours client, checkpoint du 11 octobre 2026

Travail poursuivi sur work/fabrya-product-20261010 et PR #202. Aucune reconstruction des fondations, aucune modification Kévin/SEO, aucun déploiement fabrya.fr public, aucun paiement réel.

## Changements

- Landing : proposition et parcours expliqués plus directement, marque officielle conservée, teinte violette cohérente avec le logo, offre et limites explicites.
- Espace : boutons, champs, navigation, projets, panneaux et messages homogénéisés. États d'abonnement traduits. Plus de libellé « actif en test » sur un projet LIVE.
- Validation : confirmation dédiée avec numéro de version, entreprise, date et conséquence exacte. Aucun paiement à la validation. La mutation ne part qu'après confirmation du même identifiant.
- Historique : numéros de versions dans la comparaison ; sur mobile une version visible à la fois, avec choix explicite de la vue. Les versions existantes restent conservées.
- Accès : lien d'évitement, focus visible, erreurs de connexion associées aux champs, sauvegarde locale avant expiration de session, mouvement réduit respecté.
- Contrôle privé /interface-review : cadres de 1440/390/320 px affichant le vrai produit, sans fixture de paiement ni authentification contournée. Route disponible uniquement sur l'origin de validation privée épinglée.

## Reprise Checkout longue

Au-delà de 23 h, un résultat de création incertain n'est plus rejoué par POST. Le serveur parcourt les pages de sessions Stripe à partir de la création de la demande (marge de 300 s), cherche le checkout_id durable et termine le parcours avant de choisir. Limite 20 pages de 100 sessions ; dépassement, liste invalide, absence ou pluralité de résultats = refus sans nouvelle création. La session unique est relue et ses cinq métadonnées, montant EUR 5900, mode, compte et référence client sont vérifiés. Son identifiant est réparé dans D1 avec compare-and-swap.

Session ouverte : réutilisation. Terminée : réconciliation serveur, sans nouvelle création. Expirée confirmée par Stripe : clôture de la tentative, puis nouvelle tentative explicite permise. État inconnu : refus sans POST. Le bouton de vérification répare aussi l'identifiant sans créer de session de remplacement.

29 tests passent, dont pagination, doublon, métadonnées erronées, perte d'identifiant, reprise après 25 h ouverte/expirée/terminée et refus sûr. Tests avec gateway contrôlée et vraie SQLite ; aucune preuve de paiement LIVE. Build Worker et npm run build passent.

## Gates à la reprise du navigateur

FAIL signifie non acquis ; cela distingue les preuves manquantes d'un défaut déjà observé. Les parcours connectés doivent être ouverts après création/connexion humaine du compte. Les contrôles d'identifiants du navigateur imposent la création du compte par Hugo ; aucune saisie automatisée de nouveaux identifiants.

| Gate | État | Preuve restant à acquérir |
|---|---|---|
| LANDING_UI | FAIL | Jury de la landing corrigée |
| AUTH_UI | FAIL | Inscription et connexion réelles |
| PROJECTS_UI | FAIL | Vide, plusieurs projets, reprise |
| BRIEF_UI | FAIL | Parcours et sauvegarde navigateur |
| GENERATION_UI | FAIL | Progression, retour, annulation |
| PREVIEW_UI | FAIL | Utilisation réelle des aperçus |
| REVISION_UI | FAIL | Modification et V2 navigateur |
| HISTORY_UI | FAIL | Comparaison et retour V1 |
| APPROVAL_UI | FAIL | Confirmation réelle de la version |
| SUBSCRIPTION_UI | FAIL | Parcours offre et abandon |
| CLIENT_SPACE_UI | FAIL | États actifs via QA privée distincte |
| BILLING_UI | FAIL | Annulation/impayé/régularisation via QA |
| CHECKOUT_RETURN | FAIL | Retour authentifié, même projet et version |
| CHECKOUT_LONG_RECOVERY | FAIL | Implémentation et tests acquis ; preuve Stripe réelle de récupération à compléter |
| FAILURE_STATES_UI | FAIL | États d'erreur réellement affichés |
| DESKTOP_1440 | FAIL | Contrôle du cadre réel 1440 |
| MOBILE_390 | FAIL | Contrôle du cadre réel 390 |
| MOBILE_320 | FAIL | Contrôle du cadre réel 320 |
| ACCESSIBILITY_UI | FAIL | Navigation clavier et erreurs navigateur |
| BRAND_COHERENCE | FAIL | Jury de l'ensemble des écrans |
| NO_PROTOTYPE_SEAMS | FAIL | Tous les parcours ouverts et jugés |

FABRYA_INTERFACE_READY = FAIL
READY_FOR_FIRST_LIVE_PAYMENT = NO

Aucun paiement autorisé. Ne pas fusionner ni remplacer fabrya.fr à ce stade.
