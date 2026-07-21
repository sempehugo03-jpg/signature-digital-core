# Audit runtime/renderer - Cote Particuliers Tarbes

## Methode

Audit limite au segment valide en amont :

`RenderContract -> renderer React -> DOM -> CSS -> navigateur`

La fixture originale est conservee dans `src/golden-demos/cote-particuliers-tarbes/lovable-output.yaml`.

Hash attendu et verifie : `5dc016c192248161173ad2b545b2818a0c4cc6a6e3c8edd8f54d2f20dfc0930c`.

Prerequis verifies depuis la normalisation versionnee :

- VisualBlueprint reconnu.
- VisualPack reconnu.
- `publicPage.sections` contient 9 sections.
- 8 `imageRoles` sont presents.
- 5 `unsupportedCapabilities` sont presentes.
- 0 erreur de normalisation.

## Route testee

Route runtime : `/golden/cote-particuliers-tarbes`

La route execute le renderer public `OpusDomusTemplate` avec une configuration d'agence deterministe construite depuis la fixture et la normalisation. Elle ne depend pas d'un `agencyId` mutable ni d'un appel Supabase.

Deux modes ont ete captures :

- Mode A, source originale : `/golden/cote-particuliers-tarbes?auditProbe=1`
- Mode B, images locales d'audit : `/golden/cote-particuliers-tarbes?auditProbe=1&auditImages=local`

Le mode B remplace uniquement les URLs d'images dans le harness d'audit, en conservant les memes roles. Il ne modifie pas la fixture originale et ne change pas le parser.

## Snapshot RenderContract

Fichier : `docs/runtime-renderer-audit/cote-particuliers/render-contract-snapshot.json`

Decisions principales recues par le renderer :

| Zone | Valeur recue | Source | Token/classe attendu | Consommateur |
| --- | --- | --- | --- | --- |
| Hero layout | `full` | VisualBlueprint.hero | `od-hero-layout-full` | `OpusDomusTemplate` |
| Hero variant section | `editorial-split` | PublicPageConfig | `od-public-page-hero-variant-editorial-split` | `resolvePublicPageHeroConfig` |
| Hero surface | `dark` / section `ink` | VisualBlueprint + PublicPage | `od-hero-surface-dark`, `od-public-page-surface-ink` | Hero public |
| Hero height | `screen` | VisualBlueprint.hero | `od-hero-height-screen`, `--od-render-hero-height` | CSS hero |
| Navigation | `transparent`, `sticky`, `standard` | VisualBlueprint.navigation | `od-public-nav-surface-transparent`, `behavior-sticky` | Header public |
| Typography | `Cormorant Garamond` + `Inter` | VisualPack/Blueprint | `--od-render-heading-font`, `--od-render-body-font` | titres et corps publics |
| Property cards | `editorial`, `portrait`, no radius/border/shadow | VisualBlueprint.propertyCards | classes `od-property-card-*` | cartes biens |
| PublicPage | 9 sections configurees | PublicPageConfig | ids et ordre sections | renderer PublicPage |
| Images | 8 roles | VisualPack/PublicPage | `imageRoles.*` | sections publiques |

Limite observee : `RenderContract.sections.order` reste une liste legacy (`properties`, `method`, `sellerSpace`, `reviews`, `contact`). L'ordre reel de la page vient bien de `PublicPageConfig.sections`, mais le contrat de debug ne reflete pas la page concrete.

## Matrice de consommation

Fichier : `docs/runtime-renderer-audit/cote-particuliers/consumption-matrix.json`

Synthese :

| Decision | Valeur resolue | React/DOM | CSS final | Verdict |
| --- | --- | --- | --- | --- |
| Hero title | `L'immobilier signe, avec discretion.` | Present dans le DOM | visible en 1440 et 390 | OK |
| Hero image role | `hero` | `img` present | visible seulement en mode B | Source image KO en mode A |
| Hero section variant | `editorial-split` | classe de variant presente | classe layout reste `full` | Ecrase |
| Hero secondary CTA | visible | bouton present | couleur ink sur fond sombre | Ecrase par cascade/contraste |
| Navigation transparent/sticky | present | `position: fixed`, fond transparent | applique | OK |
| Typography heading/body | present | variables CSS presentes | titre hero en Cormorant Garamond | OK |
| Properties variant | `featured-first` + cards `editorial` | section et cartes presentes | cartes editorial portrait | OK |
| Reviews section | active dans PublicPage | absente du DOM | non appliquee | Perdue par gating proofConfig |
| Mobile order | 0..8 | ordre DOM identique | pas de duplication | OK pour cette fixture |

## Resultats DOM

Fichiers :

- `docs/runtime-renderer-audit/cote-particuliers/dom-1440.json`
- `docs/runtime-renderer-audit/cote-particuliers/dom-390.json`

### 1440 px

- Titre Hero dans le DOM : `L'immobilier signé, avec discrétion.`
- Eyebrow Hero present : `IMMOBILIER CONFIDENTIEL · TARBES & BIGORRE`
- Description Hero presente et complete.
- CTA principal : `Estimer mon bien`.
- CTA secondaire : `Découvrir nos biens`.
- Hero : 1440 x 960 px.
- Bloc titre : environ 544 px de large, position x 100, y 370.
- Police du titre : `"Cormorant Garamond", ui-serif, serif`.
- Taille calculee du titre : `80px`, line-height `74.4px`.
- Sections publiques rendues hors hero : 7.
- Section `reviews-editorial` configuree mais absente.
- Footer present.
- Aucun overflow horizontal detecte.

### 390 px

- Titre Hero complet dans le DOM.
- Titre calcule : environ `48.8px`, line-height `49.776px`.
- Largeur titre : 350 px.
- Navigation mobile presente.
- CTA presents.
- Footer present.
- Aucun overflow horizontal detecte.

## Cascades CSS responsables

Fichier : `docs/runtime-renderer-audit/cote-particuliers/css-cascade-inventory.json`

Points verifies :

- `.od-page .od-hero-layout-full .od-hero-content` applique une largeur large au contenu.
- `.od-page .od-hero-layout-split-left .od-hero-content` existe, mais ne gagne pas car la classe finale reste `od-hero-layout-full`.
- `.od-hero h1` applique une taille historique via `clamp(3.15rem, 8vw, 5rem)`. La famille de police est bien pilotee par `--od-render-heading-font`.
- `.od-public-cta-variant-outline` utilise `currentColor`; sur le CTA secondaire du hero, la couleur calculee reste `rgb(20, 23, 31)` sur une scene sombre.

## Analyse Hero

1. Composant : `OpusDomusTemplate`, rendu public hero via `resolvePublicPageHeroConfig`.
2. Variante section selectionnee : `editorial-split`.
3. `hero.layout: full` est utilise dans la classe finale.
4. `section.variant: editorial-split` est ajoute comme classe, mais ne remplace pas la classe de layout structurelle.
5. En contradiction, le layout VisualBlueprint deja classe gagne sur la variante PublicPage pour la structure CSS.
6. L'image Hero existe dans le DOM.
7. En mode B, l'image devient visible avec le role `hero`.
8. Le titre observe comme tiret n'est pas reproduit dans le runtime actuel : le titre complet est dans le DOM en 1440 et 390.
9. Le titre complet n'est ni remplace ni vide.
10. Sa largeur est determinee par `.od-hero-layout-full .od-hero-content`, pas par le split editorial attendu.
11. Sa position verticale vient de `.od-public-hero .od-hero-content` et des tokens hero.

Conclusion Hero : le contenu est correct, l'image source originale est invalide, et la structure `editorial-split` est partiellement neutralisee par une classe `full` conservee.

## Analyse Navigation

La navigation consomme bien :

- surface `transparent`;
- behavior `sticky`;
- density `standard`;
- logoMode `auto`;
- primaryCta visible;
- privateAccess visible.

Le logo distant Lovable est present comme URL, mais son chargement est soumis a la disponibilite externe. En mode B, un logo local d'audit valide le rendu du slot.

## Analyse Typographie

Les familles sont appliquees :

- heading : Cormorant Garamond;
- body : Inter.

Le rendu utilise les variables typographiques du rendu. Une limite reste visible : certaines tailles hero historiques existent encore en CSS, meme si elles produisent ici un rendu lisible et coherent.

## Analyse Layout

`PublicPageConfig` pilote bien l'ordre et les contenus principaux. La page n'est pas limitee au `sectionOrder` legacy du RenderContract.

Ecart principal : le hero conserve la classe structurelle `full`, ce qui limite la fidelite de `editorial-split`.

## Analyse Cartes

Les cartes publiques consomment :

- variant `editorial`;
- ratio `portrait`;
- density `standard`;
- pricePosition `content`;
- badges visibles;
- radius/border/shadow `none`;
- hover `image-zoom`;
- excerpt cache.

Les annonces et images de biens viennent des donnees metier figees SD. Cette difference de contenu n'est pas une perte renderer de VisualPack.

## Analyse Footer

Le footer est present et consomme une surface sombre/editoriale via le contrat. Aucun blocage P1 n'a ete observe dans le footer sur cette fixture.

## Warnings

La normalisation LovableOutput a 0 erreur bloquante. Les diagnostics RenderContract signalent surtout des proprietes VisualBlueprint conservees mais non reconnues dans le schema de rendu :

- `brand.tone`;
- `hero.alignment`;
- `header.surface`;
- certaines cles typographiques shorthand;
- `images.treatment`;
- `responsive.heroMobileHeight`;
- `mobileNavigation.surface` et `mobileNavigation.behavior`.

Impact : faible a moyen selon la propriete. `mobileNavigation.surface: light` est ignoree dans le contrat de navigation, qui resout `mobileSurface: transparent`.

## Captures

Mode A, source originale :

- `docs/runtime-renderer-audit/cote-particuliers/source-originale/desktop-1440-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/desktop-1440-properties.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/desktop-1440-full.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/mobile-390-navigation.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/mobile-390-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/mobile-390-properties.png`
- `docs/runtime-renderer-audit/cote-particuliers/source-originale/mobile-390-full.png`

Mode B, images locales d'audit :

- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/desktop-1440-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/desktop-1440-properties.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/desktop-1440-full.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/mobile-390-navigation.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/mobile-390-hero.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/mobile-390-properties.png`
- `docs/runtime-renderer-audit/cote-particuliers/images-locales-audit/mobile-390-full.png`

## Ecarts classes

| Id | Impact | Zone | Cause racine | Correction minimale |
| --- | --- | --- | --- | --- |
| RR-001 | P1 | Images | URLs Lovable `/src/assets/...` non exploitables | Exiger/importer des URLs publiques image stables |
| RR-002 | P1 | Hero | `editorial-split` ne remplace pas la classe structurelle `full` | Recalculer la className hero apres surcharge PublicPage |
| RR-003 | P1 | CTA Hero | CTA outline herite une couleur sombre sur hero sombre | Piloter le contraste CTA par surface |
| RR-004 | P1 | Reviews | Section active masquee si `proofConfig` absent | Rendre la coque PublicPage meme sans items |
| RR-005 | P2 | Debug sections | RenderContract expose l'ordre legacy, pas les ids PublicPage | Ajouter l'ordre PublicPage au debug |
| RR-006 | P2 | Properties | Donnees metier figees differentes de Lovable | Aligner les donnees golden, pas le renderer |
| RR-007 | P3 | Diagnostics | Proprietes conservees mais non consommees explicitement | Clarifier/consommer les proprietes utiles |

Registre complet : `docs/runtime-renderer-audit/cote-particuliers/issues.json`.

## Corrections recommandees

P1 bloquantes maximales :

1. Recalculer les classes Hero depuis la configuration finale PublicPage + VisualBlueprint.
2. Corriger les tokens de contraste des CTA outline sur surfaces sombres.
3. Ne pas supprimer une section reviews configuree uniquement parce que les items de preuve metier sont absents.

P2 non bloquantes :

1. Ajouter les sections PublicPage resolues au snapshot/debug RenderContract.
2. Aligner les donnees metier figees de la golden demo sur les contenus Lovable quand la source annonce est disponible.
3. Clarifier les warnings RenderContract entre proprietes ignorees et proprietes resolues ailleurs.

## Conclusion

Conclusion B : le renderer applique une partie importante des decisions, mais ignore ou ecrase quelques decisions precises. Des corrections ciblees sont necessaires.

Le renderer n'est pas totalement bloque par Opus Domus dans cette branche : `PublicPageConfig` pilote bien la presence, l'ordre et les textes principaux des sections. En revanche, la fidelite Lovable est degradee par quatre verrous concrets : images source non exploitables, hero variant partiellement neutralise, CTA secondaire mal contraste, et section reviews gatee par les donnees metier.

