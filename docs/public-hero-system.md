# Public Hero System

Le Public Hero System est le Hero officiel de Signature Immobilier.
Il ne doit jamais etre duplique par agence, par theme ou par demo.

## Source

Le Hero est resolu depuis :

- Agency Identity ;
- VisualBlueprint v1 ;
- Composition System ;
- modules publics disponibles.

Le moteur ne lit jamais du code Lovable. Il traduit une intention en configuration.

## Configuration

`PublicHeroConfig` contient :

- `layout`: `full`, `split-left`, `split-right`, `centered`, `minimal`
- `surface`: `light`, `dark`, `transparent`
- `height`: `compact`, `standard`, `large`, `screen`
- `alignment`: `left`, `center`
- `headlineScale`: `display`, `xl`, `lg`
- `imageDominance`: `strong`, `medium`, `balanced`, `human`, `data`
- `overlay`: `soft`, `dark`, `light`, `none`
- `search`: `visible`, `hidden`
- `secondaryCta`: `visible`, `hidden`
- contenus : eyebrow, title, subtitle, image
- actions : CTA principal, CTA secondaire, recherche
- `className`: classes stables de rendu

## VisualBlueprint v1

La section `hero` peut piloter :

```yaml
hero:
  layout: full
  surface: dark
  height: screen
  titleAlignment: left
  headlineScale: display
  secondaryCta: visible
  search: hidden
```

Les anciennes valeurs historiques restent compatibles, mais elles sont normalisees vers les variantes officielles du Hero.

## Agency Identity

Le Hero lit dans l'Agency Identity :

- nom agence ;
- ville ;
- image principale ;
- titre ;
- sous-titre ;
- libelle CTA ;
- couleurs et tokens.

Une page ne doit pas reconstruire ces valeurs directement depuis la configuration brute.

## Composition

La composition influence les fallbacks :

- `editorial-immersive` favorise une image dominante et un Hero `screen` ;
- `data-investment` favorise un Hero plus structure ;
- les autres compositions utilisent des fallbacks premium stables.

La composition ne cree pas un autre Hero.

## Regles

Interdit :

- `HeroLuxury`
- `HeroPrestige`
- `HeroModern`
- `HeroEditorial`
- `HeroCitya`
- condition `agencyId`, `agencySlug` ou nom d'agence
- Hero specifique client

Autorise :

- une nouvelle valeur de configuration reutilisable ;
- un token central ;
- un style CSS du Hero officiel.

## Responsive

Le Hero doit toujours :

- tenir sans overflow horizontal ;
- garder un CTA visible ;
- conserver une image contenue ;
- limiter la hauteur mobile ;
- garder un titre lisible.
