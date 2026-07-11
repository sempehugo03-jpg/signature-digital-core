# Responsive Contract

Le Responsive Contract definit les regles officielles de la template Signature Immobilier.
Il ne remplace pas l'Agency Identity, le VisualBlueprint ou les composants metier.
Il garantit que les memes composants restent lisibles sur mobile, tablette et desktop.

## Breakpoints

La source cote code est `src/lib/responsiveContract.ts`.

- Mobile : `0` a `767px`
- Tablette : `768px` a `1199px`
- Desktop : `1200px` et plus
- Securite etroite : `360px` et moins, uniquement pour eviter les debordements sur `320px`

Le CSS de la template applique ces modes dans `src/components/demo-template-immobilier/opus-domus-template.css`.

## Conteneurs et espacements

Les pages utilisent des paddings et espacements fluides :

- mobile : contenu non colle aux bords, sections raccourcies ;
- tablette : densite intermediaire, grilles en deux colonnes lorsque le contenu le permet ;
- desktop : largeur pilotee par les tokens existants de composition et d'Agency Identity.

Les variables principales sont :

- `--od-responsive-container-padding`
- `--od-responsive-section-spacing`
- `--od-responsive-card-gap`
- `--od-responsive-touch-target`
- `--od-responsive-modal-margin`

## Typographie

Les titres critiques utilisent `clamp()` pour conserver une hierarchie forte sans debordement.
Les titres Hero, collection, fiche bien et espaces prives sont reduits sur mobile et sur ecrans tres etroits.
Aucune regle ne depend d'un texte ou d'une agence precise.

## Navigation publique

La navigation publique conserve le systeme cree en PR 6.
Sur mobile, les liens ordinaires, le CTA et l'acces prive passent dans le panneau mobile existant.
Le sticky reste supporte, sans changement de comportement au scroll.

## Hero

Les variantes `full`, `split-left`, `split-right`, `centered` et `minimal` gardent le meme composant.
Sur mobile, les variantes split sont forcees dans une lecture verticale : titre, texte, CTA puis image utile.
Les hauteurs utilisent `svh` avec un maximum pour eviter les problemes de barres navigateur mobiles.

## Sections

Les sections publiques restent celles du moteur de sections :

- `properties`
- `method`
- `sellerSpace`
- `reviews`
- `contact`

Sur mobile, les grilles passent en une colonne et l'alternance image / texte ne change pas la logique metier.

## Cartes et collection

Les variantes de cartes de biens restent les cinq variantes officielles de PR 9.
Sur mobile, la variante horizontale redevient verticale.
La collection empile les filtres, rend les champs pleine largeur et garde la pagination accessible.

## Fiche bien

La fiche bien garde l'ordre public de PR 11.
Sur mobile :

- galerie pleine largeur ;
- prix visible rapidement ;
- caracteristiques en une colonne si necessaire ;
- demande de visite en formulaire simple ;
- similaires en une colonne.

## Preuves, CTA et formulaires

Les preuves et CTA suivent les systemes de PR 12.
Sur mobile, un seul CTA principal domine et les boutons peuvent prendre toute la largeur.
Les formulaires gardent labels, erreurs et etats d'envoi visibles.

## Espaces prives

Les espaces vendeur, agent et patron utilisent le systeme prive de PR 13.
Sur mobile :

- navigation privee scrollable de maniere controlee ;
- cartes en une colonne ;
- actions principales accessibles ;
- badges lisibles ;
- aucun tableau ne depasse silencieusement.

## Tableaux

La regle officielle est :

- transformer en lignes/cartes empilees quand le composant le permet ;
- sinon autoriser un scroll horizontal controle et visible.

Aucun tableau ne doit creer un scroll horizontal global de page.

## Modales

Les modales utilisent :

- largeur limitee a l'ecran ;
- hauteur maximum ;
- scroll interne ;
- bouton de fermeture visible ;
- protection contre le contenu inaccessible avec clavier mobile.

## VisualBlueprint

Les proprietes responsive existantes sont conservees :

- `responsive.heroMobileHeight`
- `responsive.mobileSpacing`
- `responsive.mobileTypographyScale`
- `mobileNavigation.style`

La PR 14 ne cree pas de CSS libre dans le Blueprint.
Les valeurs inconnues continuent de passer par la normalisation de `VisualBlueprint v1`.

## Validation minimale

Tester les largeurs :

- `320px`
- `375px`
- `430px`
- `768px`
- `1024px`
- `1280px`
- `1440px`

Verifier au minimum : navigation, Hero, sections, cartes, collection, fiche bien, estimation, connexion, espaces prives, modales et formulaires.
