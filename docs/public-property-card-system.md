# Public Property Card System

Le Public Property Card System est la couche officielle de rendu des cartes de biens publiques Signature Immobilier.

Il ne cree pas plusieurs cartes metier. Le composant public reste unique et lit une configuration resolue depuis :

- VisualBlueprint v1
- Agency Identity
- Composition System
- fallbacks du moteur

## Variantes officielles

Le moteur supporte exactement 5 variantes :

- `visual` : immersive, emotionnelle, photographie dominante, informations minimales.
- `editorial` : haut de gamme, magazine, hierarchie typographique forte.
- `compact` : efficace, dense, comparaison rapide.
- `horizontal` : structuree, image et informations cote a cote sur desktop, verticale sur mobile.
- `investment` : rationnelle, orientee chiffres, donnees principales prioritaires.

Aucune variante ne doit porter le nom d'une agence.

## Configuration

`resolvePublicPropertyCardConfig()` retourne une configuration deterministe :

- `variant`
- `orientation`
- `imageRatio`
- `informationDensity`
- `pricePosition`
- `showBadges`
- `radius`
- `border`
- `shadow`
- `spacing`
- `hover`
- `maxFeatures`
- `showExcerpt`
- `className`

## VisualBlueprint v1

La section `propertyCards` peut selectionner :

```yaml
propertyCards:
  variant: editorial
  imageRatio: portrait
  density: minimal
  pricePosition: content
  badges: hidden
  radius: subtle
  border: none
  shadow: minimal
  hover: image-zoom
  excerpt: visible
```

Valeurs autorisees :

- `variant`: `visual`, `editorial`, `compact`, `horizontal`, `investment`
- `imageRatio`: `portrait`, `landscape`, `square`, `cinematic`
- `density`: `minimal`, `standard`, `compact`
- `pricePosition`: `top`, `content`, `footer`, `overlay`
- `badges`: `visible`, `hidden`
- `radius`: `none`, `subtle`, `rounded`
- `border`: `none`, `subtle`, `strong`
- `shadow`: `none`, `minimal`, `elevated`
- `hover`: `none`, `subtle`, `lift`, `image-zoom`
- `excerpt`: `visible`, `hidden`

## Compatibilite

Les anciens champs restent acceptes :

- `cardStyle`
- `imageRatio` avec ratio CSS numerique
- `cardRadius`
- `shadowStyle`
- `spacing`

Ils alimentent les fallbacks lorsqu'une propriete officielle n'est pas fournie.

## Informations obligatoires

La carte conserve toujours les informations disponibles suivantes :

- photographie ou fallback image
- titre ou type du bien
- localisation
- prix
- caracteristiques principales

Les caracteristiques sont limitees aux donnees utiles : surface, pieces, chambres et type.

## Photographie

Les images sont toujours contenues dans un ratio stable. Le carrousel reste le meme composant et conserve son comportement. Le swipe ne doit pas declencher l'ouverture du bien grace au seuil de deplacement gere dans la carte.

## Responsive

Sur mobile, la variante `horizontal` redevient verticale. Aucune carte ne doit creer d'overflow horizontal. Les titres, localisations et prix longs doivent revenir a la ligne proprement.

## Regle d'extension

Une nouvelle agence ne justifie jamais une nouvelle carte ou une exception. Si un besoin revient pour plusieurs agences, ajouter une variante reutilisable ou enrichir la configuration centrale.
