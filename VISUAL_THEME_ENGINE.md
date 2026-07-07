# Visual Theme Engine

## Objectif

Le Visual Theme Engine transforme un `VisualBlueprint v1` en theme visuel global pour le moteur immobilier Signature Digital.

Lovable donne une direction artistique. Signature Digital l'interprete avec ses propres composants, tokens et variantes. Le moteur ne lit jamais de code Lovable, ne cree jamais de page specifique et ne duplique jamais ses composants pour une agence.

Le role du Theme Engine est de donner une coherence globale a la demo :

- Hero
- Header et navigation
- Cartes biens
- Sections
- CTA
- Contact
- Footer
- Typographie
- Espacements
- Fonds

## Themes disponibles

### editorial_luxury

Theme premium editorial.

- grandes images
- typographie elegante
- fonds creme ou sombre premium
- sections aeriennes
- cartes magazine
- CTA sobres

### modern_premium

Theme propre et structure.

- contraste maitrise
- cartes nettes
- boutons forts
- sections lisibles
- rythme moderne

### warm_local_trust

Theme rassurant et local.

- couleurs chaudes
- ambiance humaine
- sections confiance
- CTA doux
- cartes accueillantes

### minimal_prestige

Theme sobre et prestigieux.

- peu d'elements
- beaucoup de vide
- typographie forte
- cartes minimales
- couleurs tres controlees

## Mapping Blueprint -> theme

Le Theme Engine lit les signaux du Blueprint :

- `brand.generalMood`
- `brand.graphicStyle`
- `brand.typographyMood`
- `hero.layout`
- `propertyCards.cardStyle`
- `sections.defaultMood`
- `buttons.generalStyle`
- `images.mood`

Regles principales :

- luxury / editorial / premium -> `editorial_luxury`
- modern / clean / sharp -> `modern_premium`
- trust / local / warm / human -> `warm_local_trust`
- minimal / prestige / sober -> `minimal_prestige`

Si aucun signal n'est clair, le fallback est `modern_premium`.

## Priorite des valeurs

Le Blueprint garde la priorite pour les valeurs explicites :

- `hero.imageUrl`
- `hero.title`
- `hero.subtitle`
- `buttons.background`
- `brand.primaryColor`
- `brand.accentColor`

Le Theme Engine complete uniquement ce qui manque ou ce qui serait trop incoherent sans theme global.

## Ajouter un nouveau theme

Un nouveau theme doit etre reutilisable pour plusieurs agences.

Pour l'ajouter :

1. Ajouter un nom generique dans `RealEstateVisualThemeName`.
2. Ajouter ses decisions globales dans `themes`.
3. Ajouter son mapping par signaux dans `resolveVisualTheme`.
4. Ajouter les classes CSS globales correspondantes.
5. Verifier le rendu mobile et les fallbacks.

Interdit :

- nom d'agence dans le theme
- condition client specifique
- page dediee
- composant duplique
- exception route ou role

## Regle permanente

Une nouvelle agence ne cree jamais une exception.

Elle passe uniquement par :

- configuration
- theme
- variante reusable
- tokens
- donnees isolees par `agencyId`


