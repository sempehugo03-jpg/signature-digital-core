# Signature Digital — Règles permanentes Codex

## Repo cible obligatoire

Toujours travailler uniquement sur :

sempehugo03-jpg/signature-digital-core

Ne jamais travailler sur :

sempehugo03-jpg/signature-immobilier-app

Ce repo est un ancien projet et ne doit pas être utilisé pour Signature Digital.

## Projet actif

Le projet actif correspond à :

signature-digital-core-git

Le projet contient notamment :

- cockpit admin
- projets
- moteur
- templates
- connexion admin
- plateforme Signature Digital

## Stack technique

Le projet utilise :

- React
- Vite
- routing centralisé dans src/App.tsx
- composants dans src/components
- données dans src/data
- logique dans src/lib

Avant toute modification importante, vérifier la structure existante.

## Interdictions strictes

Ne jamais modifier sans demande explicite :

- la page racine /
- l’admin
- le cockpit
- les projets
- le moteur
- la connexion admin
- les API existantes
- les routes principales Signature Digital

Ne jamais remplacer Signature Digital par Signature Immobilier.

Ne jamais transformer l’app Signature Digital en site immobilier public.

## Template immobilier

La template immobilière doit toujours être isolée dans :

/demo/template-immobilier
/demo/template-immobilier/*

Fichiers autorisés pour la template :

- src/components/demo-template-immobilier/*
- src/data/realEstateTemplate.ts
- src/App.tsx uniquement pour ajouter les routes nécessaires
- src/styles.css ou CSS dédié uniquement si nécessaire

La template Opus Domus ne doit jamais remplacer la page racine /.

## Architecture moteur / habillage / donnees

Le moteur immobilier commun ne doit jamais etre duplique pour une agence.

Une agence doit etre une instance configuree du moteur.

Les habillages Lovable doivent etre integres comme skins compatibles, jamais comme nouvelles applications independantes.

Pour une agence, modifier uniquement :

- agencyConfig
- themeConfig
- contentConfig
- dataConfig
- assets agence
- skin agence

Toute donnee agence doit etre isolee par agencyId.

La template mere /demo/template-immobilier doit rester intacte.

Toute integration agence doit confirmer :

- moteur non modifie
- template mere intacte
- agence isolee par agencyId
- / non modifiee
- admin non casse

Interdiction de dupliquer le moteur par agence.

Interdiction de creer une app parallele pour une agence.

Si une agence demande une variation, elle doit passer par :

- variant
- feature flags
- theme tokens
- sectionOrder
- contentConfig

Elle ne doit pas passer par une copie de composants moteur.

## Connexions

Ne jamais mélanger :

- connexion admin Signature Digital
- connexion template immobilier vendeur / agent / patron

Connexion admin :
réservée à Hugo et à l’espace Signature Digital.

Connexion template immobilier :
doit être isolée sur :

/demo/template-immobilier/connexion

## Lovable / Opus Domus

Quand il faut intégrer Opus Domus :

Repo Lovable source :
https://github.com/sempehugo03-jpg/opus-domus

Objectif :
utiliser le code Lovable comme source de vérité.

Ne pas recréer le design à la main.
Ne pas faire une version inspirée.
Ne pas utiliser une ancienne version Signature Immobilier.
Ne pas dégrader la direction artistique Lovable.

Priorité :
fidélité visuelle.

## Règle de livraison obligatoire

À la fin de chaque tâche qui modifie le code, toujours fournir :

1. lien exact de la branche GitHub
2. lien exact de la Pull Request GitHub vers main
3. commit SHA
4. résultat de npm run build
5. liste des fichiers modifiés

Pas de PR = travail non terminé.
Pas de lien PR = travail incomplet.

Si la PR ne peut pas être créée automatiquement, expliquer précisément pourquoi et fournir au minimum le lien GitHub de comparaison permettant d’ouvrir la PR.

## Build

Toujours tester :

npm run build

Si le build échoue, corriger avant de livrer.

## Méthode de travail

Avant toute grosse modification :

1. confirmer le repo exact
2. confirmer les fichiers qui seront touchés
3. limiter le scope
4. ne pas modifier plus large que nécessaire
