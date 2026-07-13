# Agency Deletion And Export Contract

PR 38 ajoute un cycle de fin de vie securise pour les agences Signature Immobilier.

## Etats

Statuts metier supportes :

- `active`
- `paused`
- `archived`
- `deletion-requested`
- `deletion-scheduled`
- `deleted`

Les statuts historiques `draft`, `demo_ready`, `sent` et `validated` restent compatibles.

## Pause

La pause bloque les ecritures via le mode d'acces existant, conserve toutes les donnees et garde l'acces admin. Elle est reversible par reactivation.

La pause ne supprime jamais :

- domaine ;
- comptes ;
- annonces ;
- demandes ;
- documents ;
- paiements ;
- conformite.

## Archive

L'archive retire l'agence des vues actives, bloque public/prive, conserve les donnees et permet une restauration admin. Les agences archivees ne doivent pas compter comme agences actives.

## Export

L'action `Exporter les donnees de l'agence` produit un JSON versionne.

Perimetre :

- configuration agence ;
- VisualBlueprint ;
- coordonnees et identite legale ;
- modules ;
- annonces ;
- comptes sanitizes ;
- demandes ;
- documents sous forme de metadonnees/references ;
- domaines ;
- conformite ;
- historique de configuration ;
- lifecycle/audit.

Exclusions :

- secrets ;
- cles API ;
- mots de passe ;
- tokens actifs non necessaires ;
- donnees bancaires.

## Suppression planifiee

La suppression definitive est une action separee :

1. conseiller un export ;
2. retaper le slug agence ;
3. enregistrer `requestedAt`, `requestedBy`, `scheduledDeletionAt` ;
4. passer l'agence en `deletion-scheduled` ;
5. attendre le delai de securite.

Delai par defaut : 30 jours. Minimum local : 14 jours.

Pendant le delai :

- acces public normal bloque ;
- ecritures bloquees ;
- donnees conservees ;
- export toujours disponible ;
- annulation possible.

## Suppression finale

`executeRealEstateAgencyDeletion()` execute uniquement les suppressions locales sures quand le delai est atteint.

Le projet commercial lie est conserve pour audit, avec retrait du lien agence. Il n'est pas supprime silencieusement.

## Ressources externes

Les ressources suivantes sont suivies mais non nettoyees automatiquement dans cette PR :

- domaine/DNS/Vercel ;
- Stripe ;
- stockage fichiers ;
- Supabase/backend futur ;
- emails deja remis au fournisseur.

Elles sont marquees `pending-external-cleanup` dans le plan. L'interface ne doit pas afficher une suppression totalement terminee tant que ces points restent a traiter.

## Audit

Actions journalisees :

- pause ;
- reactivation ;
- archivage ;
- restauration ;
- export ;
- demande suppression ;
- annulation ;
- suppression finale ;
- changement de statut.

Chaque entree contient action, actor, timestamp, reason facultative et result.

## Limites

Le stockage actuel est local au navigateur. Cette PR prepare le contrat et execute uniquement les nettoyages locaux fiables. La procedure backend future devra appliquer le meme plan sur les ressources persistantes serveur.
