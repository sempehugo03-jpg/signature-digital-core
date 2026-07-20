# PR 54 - Rapport de fidelite mobile

Perimetre controle : rendu public entre 320 px et 767 px, avec 768 px comme frontiere.

Largeurs retenues : 320 px, 375 px, 390 px, 430 px, 768 px.

## Preuve A - agence premium aeree

- Donnees : fixture `publicPageConfigProofFixtures.editorial`.
- Intention mobile : Hero haut, titres editoriaux, sections espacees, navigation minimale, footer editorial.
- Resultat attendu apres correction : `mobileOrder` place les biens avant le bloc agence, le Hero conserve `screen/display`, les sections restent espacees via `responsive.mobileSpacing`, le footer conserve sa surface sombre/editoriale.

## Preuve B - agence commerciale dense

- Donnees : fixture `publicPageConfigProofFixtures.commercial`.
- Intention mobile : Hero compact, CTA visibles, estimation rapide, cartes denses, navigation compacte/sticky, footer conversion.
- Resultat attendu apres correction : ordre mobile identique au parcours conversion, Hero compact, sections plus resserrees via `responsive.mobileSpacing`, CTA pleine largeur sans style generique impose.

## Comparaison des zones

| Zone | Defaut observe | Cause racine | Correction | Resultat |
| --- | --- | --- | --- | --- |
| Ordre des sections | `mobileOrder` etait stocke mais pouvait ne pas piloter le rendu reel | Le parent de home n'etait pas explicitement flex/grid pour appliquer `order` | `.od-public-home` devient `flex-column`; tri stable en fallback | Ordre desktop et ordre mobile peuvent diverger sans dupliquer les sections |
| Hero | Le mobile imposait des tailles et hauteurs SD fixes | Media queries historiques apres les tokens | Les tailles utilisent `mobileTypographyScale`, `headlineScale`, `hero.height` et les fallbacks restent bornes | Hero premium et commercial gardent une identite differente |
| Typographie | Titres longs pouvaient deborder ou perdre les retours ligne | Retours ligne et wrapping non garantis en mobile | `white-space: pre-line`, `text-wrap: balance`, `overflow-wrap: break-word` | Titres lisibles de 320 a 767 px |
| CTA | Groupes de boutons et libelles longs pouvaient deborder | Largeurs et white-space desktop conserves | CTA publics en mobile passent a largeur exploitable, hauteur tactile minimale | CTA utilisables sans style visuel SD nouveau |
| Cartes et grilles | Featured/stack horizontal pouvait rester trop large | Colonnes avec minima desktop | Sections publiques a une colonne en mobile, ratios conserves | Pas de debordement horizontal attendu |
| Texte/image | Split desktop trop large sur mobile | Grilles texte/image non centralisees en mobile | Toutes les variantes texte/image publiques passent en une colonne | Identite conservee, composition empilee |
| Navigation mobile | Panneau pouvait depasser avec beaucoup de liens | Largeur et hauteur non bornees | `max-width`, `max-height`, scroll interne, cible tactile | Menu utilisable a 320, 375, 390, 430 px |
| Footer | Footer mobile aplati en flex unique | Override historique `.od-footer` | `.od-agency-footer` reprend grid une colonne avec gap/surface du contrat | Footer editorial et commercial restent distincts |
| Formulaires publics | Champs et boutons pouvaient conserver une structure trop large | Groupes desktop sur mobile | Les grilles publiques tombent en une colonne et les boutons gardent 44 px minimum | Estimation/contact restent lisibles |

## Fallbacks

- Sections sans `mobileOrder` : ordre desktop puis ordre d'origine.
- Ordres invalides ou dupliques : tri stable par ordre d'origine puis identifiant.
- Absence de donnees responsive Lovable : `RenderContract.layout` conserve les presets de composition existants.
- Images sans role : aucun fallback index ajoute dans cette PR.
