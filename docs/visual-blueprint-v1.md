# VisualBlueprint v1

VisualBlueprint v1 est le contrat officiel entre Lovable et Signature Digital.

Lovable decrit une intention visuelle. Signature Digital l'interprete avec ses propres composants. Le moteur ne lit jamais de code Lovable, ne copie jamais de HTML/CSS/React et ne cree jamais d'exception par agence.

## Structure generale

Un Blueprint valide commence toujours par :

```yaml
VisualBlueprint:
  version: v1
```

Les sections supportees sont :

- `brand`
- `layout`
- `hero`
- `header`
- `navigation`
- `footer`
- `sidebar`
- `container`
- `grid`
- `sections`
- `propertyCards`
- `buttons`
- `typography`
- `images`
- `forms`
- `dashboard`
- `mobileNavigation`
- `responsive`

Les sections inconnues sont ignorees et produisent un diagnostic non bloquant.

## Contenu libre et decisions visuelles

Les contenus libres restent libres :

- `hero.title`
- `hero.subtitle`
- `hero.cta`
- `hero.imageUrl`
- `brand.logoUrl`
- `brand.lightLogoUrl`
- `brand.darkLogoUrl`
- `sections.sectionOrder`

Les decisions visuelles sont normalisees :

- layout
- densite
- alignement
- surface
- ratio
- radius
- contraste
- traitement image
- style des boutons
- style des cartes
- style typographique

Une valeur inconnue ne bloque jamais le rendu. Elle est ignoree ou remplacee par un fallback documente.

## Proprietes supportees

### brand

- `logoUrl`: URL ou chemin image
- `lightLogoUrl`: URL ou chemin image
- `darkLogoUrl`: URL ou chemin image
- `primaryColor`: couleur `#RRGGBB`
- `accentColor`: couleur `#RRGGBB`
- `backgroundPalette`: variante visuelle
- `typographyMood`: variante visuelle ou `serif-premium`, `modern-sans`, `mixed-editorial`
- `generalMood`: variante visuelle
- `graphicStyle`: variante visuelle
- `themePreset`: variante visuelle historique

### layout

- `style`: variante visuelle
- `density`: `compact`, `balanced`, `airy`, `editorial`, `dense`, `luxury`, `premium`
- `composition`: `editorial-immersive`, `commercial-direct`, `institutional-trust`, `local-human`, `data-investment`

### hero

- `imageUrl`: URL ou chemin image
- `layout`: `full`, `split-left`, `split-right`, `centered`, `minimal`
- `surface`: `light`, `dark`, `transparent`
- `height`: `compact`, `standard`, `large`, `screen`, ou longueur CSS sure historique
- `overlay`: `dark`, `light`, `soft`, `none`, ou `linear-gradient(...)` simple
- `imageCrop`: traitement image
- `imagePosition`: texte CSS simple
- `contentWidth`: longueur CSS sure
- `titleAlignment`: `left`, `center`, `right`
- `titleWidth`: longueur CSS sure
- `titleSize`: longueur CSS sure
- `headlineScale`: `display`, `xl`, `lg`
- `titleStyle`: variante typographique
- `subtitleSize`: longueur CSS sure
- `subtitleStyle`: variante typographique
- `buttonStyle`: variante bouton
- `buttonPosition`: `left`, `center`, `right`, `inline`, `bottom`
- `secondaryCta`: `visible`, `hidden`
- `search`: `visible`, `hidden`
- `title`: texte libre
- `subtitle`: texte libre
- `cta`: texte libre

Les valeurs historiques `full-bleed`, `split`, `image-overlay`, `luxury` et `video-ready` restent acceptees comme alias ou valeurs de compatibilite, mais le Hero public officiel choisit toujours une des cinq dispositions supportees.

### navigation et header

`header` supporte `transparency`, `height`, `style`, `behavior`.

`navigation` supporte `style`, `mobileStyle`, `height`, `background`, `colors`, `linkColor`, `linkColors`, `spacing`, `transparency`.

La navigation publique officielle utilise aussi les champs controles suivants :

- `surface`: `light`, `dark`, `transparent`
- `density`: `compact`, `standard`
- `behavior`: `static`, `sticky`
- `logoMode`: `auto`, `light`, `dark`
- `primaryCta`: `visible`, `hidden`
- `privateAccess`: `visible`, `hidden`

Ces champs pilotent uniquement la navigation publique. Desktop et mobile consomment la meme configuration resolue. Les anciennes valeurs libres de `style` restent acceptees comme signaux de fallback lorsque les champs controles sont absents.

### sections

- `sectionOrder`: liste de sections separees par virgules
- `sectionSpacing`: `compact`, `balanced`, `airy`, `editorial`, `dense`, `luxury`, `premium`
- `defaultBackground`: couleur `#RRGGBB`
- `defaultMood`: variante visuelle
- `contentWidth`: longueur CSS sure
- `sectionBackgrounds`: texte CSS simple

### propertyCards

Noms pleinement qualifies supportes : `propertyCards.variant`, `propertyCards.imageRatio`, `propertyCards.density`, `propertyCards.pricePosition`, `propertyCards.badges`, `propertyCards.radius`, `propertyCards.border`, `propertyCards.shadow`, `propertyCards.hover`, `propertyCards.excerpt`.

- `variant`: `visual`, `editorial`, `compact`, `horizontal`, `investment`
- `imageRatio`: `portrait`, `landscape`, `square`, `cinematic`, ou ratio `4 / 5`, `16 / 9`, etc.
- `density`: `minimal`, `standard`, `compact`
- `pricePosition`: `top`, `content`, `footer`, `overlay`
- `badges`: `visible`, `hidden`
- `radius`: `none`, `subtle`, `rounded`
- `border`: `none`, `subtle`, `strong`
- `shadow`: `none`, `minimal`, `elevated`
- `hover`: `none`, `subtle`, `lift`, `image-zoom`
- `excerpt`: `visible`, `hidden`
- `cardStyle`: alias historique, encore accepte (`magazine`, `minimal`, `luxury-shadow`, `structured`, `editorial-grid`, `default`)
- `imageTreatment`: `natural`, `rounded`, `cinematic`, `editorial-crop`, `cover`, `contain`
- `cardRadius`: longueur CSS sure, conserve pour compatibilite
- `shadowStyle`: `none`, `soft`, `medium`, `deep`, `luxury`, ou ombre CSS simple, conserve pour compatibilite
- `spacing`: longueur CSS sure, conserve pour compatibilite
- `informationStyle`: variante visuelle
- `priceStyle`: variante visuelle
- `badgeStyle`: variante visuelle

### buttons

- `shape`: `pill`, `sharp`, `soft`, `luxury-gold`, `rounded`, `none`
- `background`: couleur `#RRGGBB`
- `textColor`: couleur `#RRGGBB`
- `size`: longueur CSS sure
- `borderStyle`: couleur `#RRGGBB`, `none`, `transparent`, ou bordure CSS simple
- `hoverStyle`: couleur `#RRGGBB`
- `generalStyle`: variante visuelle

### typography, images, forms, dashboard

`typography` supporte `titleStyle`, `subtitleStyle`, `bodyStyle`, `hierarchy`.

`images` supporte `heroImageStyle`, `sectionImageStyle`, `treatment`, `cropStyle`, `overlays`, `mood`.

`forms` supporte `style`, `density`, `fieldStyle`.

`dashboard` supporte `style`, `density`, `cardStyle`.

### responsive

- `heroMobileHeight`: longueur CSS sure
- `mobileSpacing`: `compact`, `balanced`, `airy`, `editorial`, `dense`, `luxury`, `premium`
- `mobileTypographyScale`: texte CSS simple
- `cardBehavior`: `stacked`, `carousel`, `grid`, `compact`

## Valeurs communes autorisees

Variantes visuelles :

- `minimal`
- `premium`
- `luxury`
- `modern`
- `editorial`
- `dark`
- `light`
- `warm`
- `institutional`
- `modern-premium`
- `editorial-luxury`
- `warm-local-trust`
- `minimal-prestige`
- `dark-prestige`

Compositions officielles :

- `editorial-immersive`
- `commercial-direct`
- `institutional-trust`
- `local-human`
- `data-investment`

## Alias historiques

Les alias suivants sont normalises :

- `fullbleed`, `full_bleed`, `fullscreen` -> `full-bleed`
- `split_left` -> `split-left`
- `split_right`, `splitright` -> `split-right`
- `image_overlay`, `imageoverlay` -> `image-overlay`
- `centre` -> `center`
- `luxury_shadow` -> `luxury-shadow`
- `editorial_grid` -> `editorial-grid`
- `editorial_crop` -> `editorial-crop`
- `luxury_gold` -> `luxury-gold`
- `bottom_bar` -> `bottom-bar`
- `full_screen` -> `fullscreen`
- `dark_mode`, `darkmode` -> `dark`
- `premium_light` -> `premium`
- `luxury_dark` -> `luxury`
- `local_trust` -> `warm-local-trust`
- `modern_minimal` -> `minimal`

## Fallbacks

Les fallbacks sont non bloquants :

- Blueprint absent: rendu par defaut.
- Racine ou version absente: Blueprint ignore.
- Section inconnue: section ignoree.
- Propriete inconnue: propriete ignoree.
- Couleur invalide: propriete ignoree.
- URL image invalide: propriete ignoree.
- Longueur invalide: propriete ignoree.
- Valeur visuelle inconnue avec fallback: fallback applique.
- Valeur visuelle inconnue sans fallback: propriete ignoree.

## Diagnostics

Chaque diagnostic contient :

- `level`: `info`, `warning` ou `error`
- `section`
- `property`
- `value`
- `fallback`
- `message`

Les diagnostics ne bloquent jamais le rendu public. Ils servent a comprendre pourquoi une valeur a ete ignoree, normalisee ou corrigee.

## Exemple valide

```yaml
VisualBlueprint:
  version: v1
  brand:
    primaryColor: "#0B1E4F"
    accentColor: "#D9B52C"
    typographyMood: serif-premium
  hero:
    layout: split-left
    height: 70vh
    overlay: dark
    titleAlignment: left
    title: "Vendez avec une agence qui inspire confiance."
    subtitle: "Une experience premium pour rendre votre valeur evidente."
    cta: "Estimer mon bien"
  propertyCards:
    cardStyle: magazine
    imageRatio: 4 / 5
  buttons:
    shape: pill
  sections:
    sectionOrder: hero,properties,trust,estimation,contact
    sectionSpacing: airy
```

## Exemple invalide mais compatible

```yaml
VisualBlueprint:
  version: v1
  hero:
    layout: unknown-layout
    height: enormous
  brand:
    primaryColor: blue
  customSection:
    anything: ignored
```

Le moteur ignore ou remplace les valeurs invalides, produit des diagnostics et conserve un rendu fonctionnel.

## Compatibilite v1

Le format v1 reste stable. Aucun champ n'est obligatoire en dehors de la racine `VisualBlueprint:` et de `version: v1`.

Les anciennes valeurs libres sont acceptees lorsqu'elles correspondent a un alias historique. Les autres valeurs sont ignorees ou remplacees par un fallback. Une future version v2 ne devra pas casser les agences qui stockent un Blueprint v1.
