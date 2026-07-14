# Production Readiness Contract

PR 39 centralise les controles necessaires avant une vraie mise en ligne d'agence.

## Source

Le contrat est dans `src/lib/productionReadiness.ts`.

Il produit :

- `AgencySeoConfig` : title, description, favicon, Open Graph image, canonical, robots.
- `resolveAgencySitemap()` et `formatAgencySitemapXml()` : sitemap agence.
- `resolveAgencyRobotsTxt()` : robots demo ou production.
- `resolveProductionReadiness()` : score, warnings, blockers et checks.

## SEO

Les donnees viennent uniquement de la configuration agence, du VisualBlueprint et des biens publics deja presents :

- nom agence ;
- ville ;
- hero subtitle ou objectif ;
- logo / favicon agence ;
- image hero ou premiere image de bien ;
- domaine principal resolu par `resolveAgencyPublicUrls()`.

Une agence est indexable seulement si elle est en mode `live`, statut `active`, et n'est pas `internal-test`.
Les demos restent en `noindex,nofollow`.

## Sitemap

Le sitemap expose :

- accueil ;
- contact ;
- biens si le module publicProperties est actif ;
- fiches biens si le module propertyDetail est actif ;
- mentions legales ;
- confidentialite ;
- cookies.

Les routes `/demo/:agencySlug/sitemap.xml` et `/sitemap.xml` sur domaine personnalise affichent le meme contenu logique.

## Robots

Les agences demo ou test retournent :

```txt
User-agent: *
Disallow: /
```

Les agences production retournent une politique indexable avec le lien sitemap et les exclusions admin/activation/paiement.

## Favicon

Priorite :

1. `faviconUrl` agence ;
2. favicon public configure ;
3. logo Blueprint ;
4. logo agence ;
5. fallback Signature Digital.

## Readiness

Checks centralises :

- domaine ;
- coordonnees ;
- pages legales ;
- SEO ;
- favicon ;
- sitemap ;
- robots ;
- VisualBlueprint ;
- SSL ;
- CTA.

Le resultat contient `ready`, `score`, `warnings`, `blockers` et `checks`.

## Limites

Cette PR ne branche pas Analytics, Search Console, API Vercel, DNS automatique ou rendu serveur. Les documents `sitemap.xml` et `robots.txt` sont resolus par le routeur existant et restent compatibles avec les domaines personnalises prepares en PR 34.
