# PR57 - Correctifs P1 runtime renderer

## Perimetre

Corrections limitees aux trois P1 confirmes par l'audit runtime Cote Particuliers :

1. conflit Hero `layout: full` et section `variant: editorial-split`;
2. CTA secondaire illisible sur Hero sombre;
3. section `reviews` active mais absente du DOM.

Les URLs Lovable `/src/assets/...` restent volontairement non corrigees dans cette PR.

## Matrice de compatibilite Hero

| Combinaison | Enveloppe | Composition interne | Classes attendues | Fallback |
| --- | --- | --- | --- | --- |
| `layout full` + `variant editorial-split` | Hero plein ecran, surface et image globales conservees | largeur de texte editoriale, alignement gauche, imageRole hero conserve | `od-hero-layout-full` + `od-public-page-hero-variant-editorial-split` | aucun si variant supporte |
| `layout full` + `variant legacy` | Hero plein ecran classique | structure interne du layout full | `od-hero-layout-full` + `od-public-page-hero-variant-legacy` | legacy |
| `layout split-left` + `variant editorial-split` | enveloppe split-left issue du Blueprint | meme largeur editoriale, pas de neutralisation | `od-hero-layout-split-left` + `od-public-page-hero-variant-editorial-split` | aucun si variant supporte |
| `layout full` + `variant compact` | enveloppe conservee | Hero plus court, CTA secondaire masque si besoin | `od-hero-layout-full` + `od-public-page-hero-variant-compact` | compact |

Regle appliquee : `VisualBlueprint.hero.layout` garde l'enveloppe globale. `publicPage.sections[hero].variant` pilote la composition interne. La classe de variante ne remplace plus silencieusement l'enveloppe et l'enveloppe ne neutralise plus la variante.

## Classes Hero avant/apres

Avant audit :

`od-hero-layout-full ... od-public-page-hero-variant-editorial-split`

La classe `full` gagnait sur la largeur interne, donc la variante editoriale etait seulement signalee.

Apres PR57 :

`od-hero-layout-full ... od-public-page-hero-variant-editorial-split`

Les deux classes coexistent toujours, mais la regle CSS de variante definit maintenant la largeur interne editoriale. La hauteur `screen`, la surface sombre, l'alignement gauche et l'image `hero` restent conserves.

## CTA secondaire

Le CTA secondaire utilise toujours la variante de bouton du contrat. La correction porte uniquement sur les tokens de contraste pour les surfaces sombres :

- surface Hero dark;
- overlay dark;
- section surface ink.

Preuve DOM apres correction : le CTA `Decouvrir nos biens` est calcule en `rgb(255, 255, 255)` sur le Hero sombre.

## Reviews

Cause : `renderReviewsSection()` retournait `null` quand `runtime.proofConfig` etait absent. Pour `proofVariant: testimonial`, le moteur peut ne pas avoir d'items metier, mais la section PublicPage contient quand meme un titre, une description, une image et un CTA.

Correction : la section `reviews` active rend maintenant sa coque configuree. `PublicProof` reste rendu uniquement quand des donnees metier existent.

## Click map

Les CTA restent routes par `toPublicPageTarget()` :

- `estimate` -> `/estimation`;
- `properties` -> `/biens`;
- `sellerSpace` -> `/vendeur`;
- `privateSpace` -> `/connexion`;
- `contact` -> ancre contact.

Aucune logique metier n'a ete dupliquee.

## Captures

Avant :

- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/desktop-1440-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/mobile-390-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/desktop-1440-hero.png`

Apres :

- `docs/runtime-renderer-audit/cote-particuliers/pr57-after/images-locales-audit/desktop-1440-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-after/images-locales-audit/desktop-1440-full.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-after/images-locales-audit/mobile-390-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-after/images-locales-audit/mobile-390-full.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-after/source-originale/desktop-1440-hero.png`

Preuve opposee :

- `docs/runtime-renderer-audit/cote-particuliers/pr57-opposite/images-locales-audit/desktop-1440-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-opposite/images-locales-audit/desktop-1440-full.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-opposite/images-locales-audit/mobile-390-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/pr57-opposite/images-locales-audit/mobile-390-full.png`

## Tests

Script cible :

`node scripts/verify-runtime-renderer-p1-fixes.mjs`

Assertions couvertes :

- `layout: full` conserve la classe d'enveloppe;
- `variant: editorial-split` conserve sa classe et pilote la largeur interne;
- titre Hero complet present;
- image Hero presente et chargee en mode images locales d'audit;
- image source Lovable toujours indisponible, volontairement hors PR57;
- CTA secondaire rendu et lisible sur Hero sombre;
- section reviews rendue en desktop et mobile quand active;
- preuve opposee conservee en Hero compact, sans classe `editorial-split`;
- reviews desactivee absente du DOM dans la preuve opposee;
- CTA Hero estimate/properties conserves.
