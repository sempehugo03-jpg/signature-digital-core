# Private Workspace System

Le Private Workspace System centralise l'interface des espaces vendeur, agent et patron.
Il ne cree aucune fonctionnalite metier et ne modifie pas les permissions.

## Architecture commune

Les trois espaces consomment :

- `AgencyIdentity`
- les tokens visuels calcules
- `VisualBlueprint.dashboard`
- les modules actifs
- les donnees du role

Le point d'entree est `resolvePrivateWorkspace()` dans `src/lib/privateWorkspaceSystem.ts`.

## PrivateWorkspaceConfig

La configuration contient :

- `role`: `seller`, `agent`, `owner`
- `density`: `compact`, `standard`, `airy`
- `surface`: `quiet`, `elevated`
- `navigation.mode`: `sidebar`, `topbar`
- `navigation.items`: entrees autorisees pour le role
- `primaryAction`: action principale disponible
- `availableSections`: sections autorisees
- `cardStyle`: `flat`, `bordered`, `elevated`
- `className`: classes stables appliquees a la page

## Differences par role

Vendeur :

- suit son mandat ;
- consulte visites, offres, documents et fiche du bien ;
- ne voit aucune action agent ou patron.

Agent :

- consulte ses mandats ;
- voit visites, offres et demandes autorisees ;
- utilise les actions de gestion deja existantes.

Patron :

- consulte l'activite agence ;
- gere agents et biens si les modules sont actifs ;
- conserve les actions existantes.

## Navigation

La navigation privee est resolue par role et par module.
Une entree n'apparait que si le module requis est actif.
Desktop et mobile utilisent la meme liste `navigation.items`.

## Propriete VisualBlueprint

La section `dashboard` supporte :

- `dashboard.style`: `minimal`, `modern`, `premium`
- `dashboard.density`: `compact`, `standard`, `airy`
- `dashboard.navigation`: `sidebar`, `topbar`
- `dashboard.cards`: `flat`, `bordered`, `elevated`

Les valeurs inconnues produisent un fallback non bloquant.

## Composants communs

Les primitives partagees restent :

- `PrivatePage`
- `PrivateWorkspaceNavigation`
- `Panel`
- `Stat`
- `SpaceCard`
- `MandateCard`
- `LineItem`
- `StatusBadge`
- `EmptyState`

## Etats vides

Un etat vide doit expliquer la situation et ne proposer une action que si le role peut agir.
Il ne doit jamais simuler une donnee.

## Formulaires prives

Les formulaires d'action utilisent le meme style de base que `PublicFormSystem`, avec le contexte `private-action`.
La validation, l'envoi et les repositories existants restent inchanges.

## Regles

Interdit :

- espace specifique a une agence ;
- condition basee sur un slug ou un nom d'agence ;
- statistique fictive ;
- navigation separee par role hors configuration centrale ;
- modification des permissions dans la couche visuelle.
