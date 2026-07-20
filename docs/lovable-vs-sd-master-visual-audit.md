# Audit visuel maitre Lovable vs Signature Digital - PR 55

## Contexte

Objectif : mesurer objectivement les ecarts restants entre une demo Lovable et sa reproduction Signature Digital apres les PR de fidelite visuelle 49 a 54.

Cette PR ne cree pas de nouvelle architecture et ne corrige pas le renderer. Elle produit un diagnostic priorise.

## Versions et prerequis

Base audit : `origin/main` au demarrage de PR55.

Verification dans le code :

- PR49 boutons : `RenderContract.buttons`, tokens `--od-token-button-*`, classes `.od-public-cta-*`.
- PR50 typographie : `RenderContract.typography`, tokens `--od-render-heading-font`, `--od-render-body-font`, tracking, weights, `mobileTypographyScale`.
- PR51 layout : `RenderContract.layout`, tokens de largeur, padding, gaps, hero height.
- PR52 cartes/images : `RenderContract.propertyCards`, tokens de ratio, fit, position, badges, surfaces.
- PR53 navigation/footer : `RenderContract.navigation`, `RenderContract.footer`, tokens nav/footer.
- PR54 mobile : `.od-public-home`, `mobileOrder`, garde-fous 320-767 px, `mobileFidelityProofs`.

Conclusion prerequis : les capacites PR49 a PR54 sont presentes dans `origin/main`.

## Demos utilisees

### Demo A - premium editoriale reelle

Nom : Cote Particuliers Tarbes.

Source Lovable disponible : captures terrain fournies dans la conversation, versionnees ici :

- `docs/visual-audit/pr55/premium/lovable/mobile-reference-lovable.jpg`

Source SD terrain avant la fin des PR de fidelite :

- `docs/visual-audit/pr55/premium/sd/mobile-field-sd-before-pr49-54.jpg`

Limite : le depot ne contient pas le `LovableOutput` complet original ni une route SD reproductible correspondant exactement a Cote Particuliers Tarbes. La comparaison pixel-perfect est donc impossible dans cette PR sans inventer des donnees.

### Demo B - commerciale dense

Source disponible : fixture opposee existante `publicPageConfigProofFixtures.commercial` et preuves `layoutFidelityProofs`, `cardImageFidelityProofs`, `navigationFooterFidelityProofs`, `mobileFidelityProofs`.

Limite : il ne s'agit pas d'une demo Lovable reelle versionnee. Elle sert a verifier que le moteur peut conserver une carrosserie dense opposee a la premium.

## Routes et sources de verite

| Demo | Lovable original | LovableOutput | VisualBlueprint | VisualPack | PublicPageConfig | Route SD |
| --- | --- | --- | --- | --- | --- | --- |
| Premium Cote Particuliers | Capture mobile terrain | Non versionne | Decrit dans les prompts precedents, non versionne comme fixture complete | Non versionne | Non versionne | Non reproductible exactement |
| Template immobilier actuel | Non applicable | Non applicable | `src/data/realEstateTemplate.ts` / config statique | config statique | legacy/config actuelle | `/demo/template-immobilier` |
| Commercial dense | Fixture synthetique | Non applicable | strings de proof libs | Non applicable | `publicPageConfigProofFixtures.commercial` | Pas de route versionnee |

## Matrice de tailles

Tailles retenues :

- Desktop : 1440 px, 1280 px, 1024 px.
- Mobile/tablette : 768 px, 430 px, 390 px, 375 px, 320 px.

Etat des captures :

- Captures Lovable reelles disponibles uniquement pour la demo premium mobile.
- Captures SD actuelles non versionnees dans ce commit car le serveur local Vite/Node n'a pas repondu de facon fiable pendant la generation multi-viewports. Les captures PR54 locales restent reproductibles avec le script ci-dessous.

Commande de reproduction conseillee :

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4174
# Puis capturer /demo/template-immobilier avec Chrome headless aux largeurs 1440, 1280, 1024, 768, 430, 390, 375, 320.
```

## Methode

Chaque zone est classee selon :

- impact : P0, P1, P2, P3 ;
- nature : parsing, contrat, RenderContract, renderer, CSS, responsive, donnees, contenu different, limitation volontaire ;
- portee : globale, composant reutilisable, variante, section, demo, mobile, desktop ;
- traitement : correction immediate, prochaine PR ciblee, evolution future du contrat, accepte V1, non pertinent.

Registre structure : `docs/lovable-vs-sd-master-visual-audit.json`.

## Scores

### Demo A - Premium Cote Particuliers

Score desktop : non note factuellement, capture desktop Lovable absente.

Score mobile : 63 / 100.

Score global : 58 / 100, avec reserve forte sur l'absence de route SD exacte.

Justification :

- structure et composition : 10 / 20. Lovable montre une direction editoriale nette ; SD sait maintenant porter une structure configurable, mais la demo exacte n'est pas reproductible sans donnees versionnees.
- typographie : 11 / 15. Familles, poids et tracking sont supportes ; retours de ligne et largeur de titre restent partiellement implicites.
- couleurs et surfaces : 7 / 10. Palette et surfaces supportees, mais alternance exacte non verifiable sur cette demo.
- espacements et proportions : 8 / 15. Les tokens existent ; proportions fines par section encore insuffisantes.
- cartes et images : 9 / 15. Roles, ratios, cards fonctionnent ; images reelles et mappings de cette demo non versionnes.
- navigation/footer : 8 / 10. PR53 consomme les tokens principaux ; footer reste moins expressif.
- mobile : 7 / 10. PR54 corrige les debordements principaux ; hero editorial tres contraint a 320 px reste fragile.
- details/interactions : 3 / 5. CTA et routes existent, mais comparaison interaction Lovable impossible.

Elements empechant 100 : absence du LovableOutput complet, absence de screenshots desktop Lovable, proportions fines non exprimees, footer/preuves/sellerSpace encore partiellement Opus Domus.

### Demo B - Commerciale dense

Score desktop : 74 / 100.

Score mobile : 72 / 100.

Score global : 73 / 100.

Justification :

- structure et composition : 15 / 20. `PublicPageConfig` peut changer ordre, presence et variantes.
- typographie : 11 / 15. Hierarchie configurable mais pas une direction typographique complete par section.
- couleurs et surfaces : 8 / 10. Surfaces/tokens presents.
- espacements et proportions : 11 / 15. Rythme dense supporte ; proportions fines limitees.
- cartes et images : 12 / 15. Dense grid, badges, prix, ratios supportes.
- navigation/footer : 8 / 10. Navigation compacte/sticky et footer conversion supportes.
- mobile : 7 / 10. Empilement et CTA corriges ; pas encore de mobile variant par section.
- details/interactions : 4 / 5. Click map metier conservee.

Reserve : score base sur fixture, pas sur demo Lovable commerciale reelle.

## Tableau des ecarts prioritaires

| ID | Demo | Zone | Impact | Nature | Portee | Cause racine | Traitement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR55-P0-001 | Premium | Page globale | P0 | contenu different | globale | Pas de LovableOutput complet ni route SD exacte versionnee | Prochaine PR ciblee data/corpus |
| PR55-P1-001 | Premium | Hero | P1 | contrat | composant | Largeur titre, line breaks et position verticale pas assez decrits | Evolution bornee du contrat si recurrence |
| PR55-P1-002 | Premium | Images | P1 | donnees | globale | Mapping imageRole reel absent du depot | Versionner VisualPack complet |
| PR55-P1-003 | Commercial | Densite | P1 | limitation volontaire | variante | Demo commerciale reelle absente | Ajouter corpus commercial reel |
| PR55-P2-001 | Premium | Footer | P2 | renderer | composant | Footer moins configurable que home | PR ciblee si ecart recurrent |
| PR55-P2-002 | Toutes | Proof/SellerSpace | P2 | renderer | composant | Fallback metier public encore fort | PR ciblee contenu public |
| PR55-P3-001 | Toutes | Diagnostic | P3 | donnees | globale | Pas de score de fidelite par section dans admin | Report post V1 |

## Analyse par zone

1. Page globale : `PublicPageConfig` a supprime le template fixe, mais la fidelite depend maintenant de la presence d'une `publicPage.sections` reelle.
2. Navigation : tokens surface, density, behavior, layout, CTA, logo sont consommes. Pas de P0 observe.
3. Hero : la famille de Hero est supportee, mais Lovable encode visuellement des decisions fines que le contrat ne porte pas toujours.
4. Premier CTA : PR49/53 rendent les styles et presence pilotables ; ecarts restants surtout position/poids.
5. Typographie : familles et poids OK ; echelle par section et line-breaks restent limites.
6. Couleurs/surfaces : roles principaux OK ; alternance exacte Lovable pas toujours mesurable.
7. Rythme vertical : tokens OK ; proportion section par section limitee.
8. Largeur contenus : contentWidth/narrowWidth OK ; textWidth par section manque parfois.
9. Ordre sections : desktop/mobile supportes.
10. Sections texte/image : variantes presentes ; ratio texte/image encore borne globalement.
11. Cartes biens : variantes/ratios/badges/prix OK ; selection exacte du bien vedette par Lovable non garantie.
12. Cartes editoriales/services : variables mais encore proches si la section manque de contenu.
13. Badges/metadonnees : supportes par PR52.
14. Images/cadrage : roles supportes ; qualite depend des URLs publiques Lovable.
15. Formulaires publics : fonctionnels ; structure mobile bornee.
16. Contact : public et footer utilisent les donnees agence ; portrait depend des roles images.
17. Footer : tokens OK ; structure encore systeme.
18. Navigation mobile : PR54 corrige les bornes principales.
19. Mobile sections : mobileOrder et empilement OK ; pas de mobileVariant par section.
20. Debordements : garde-fous presents, a verifier sur vraies captures client.

## Corrections effectuees dans PR55

Aucune correction renderer/CSS/code runtime. Les corrections plus larges sont reportees. Cette PR ajoute uniquement :

- rapport maitre ;
- registre structure ;
- captures terrain referencees.

## Regressions metier

Controle documentaire base sur les routes et renderers publics :

- fiches de biens : route `/demo/:agencySlug/biens` et `/demo/:agencySlug/bien/:id` conservees ;
- CTA estimation : route `/demo/:agencySlug/estimation` conservee ;
- CTA contact : anchors et formulaire public conserves ;
- acces prives : `privateAccess` filtre par modules ;
- modules desactives : gardes `moduleEnabled` existants ;
- liens footer : mentions, confidentialite, cookies, contact ;
- annonces : cartes publiques lisent toujours les donnees communes ;
- isolation agence : routes basees sur `agencySlug`.

Aucun code metier modifie dans PR55.

## Test de personnalisation troisieme agence

Question : si Lovable change radicalement la carrosserie d'une troisieme agence, SD peut-il la reproduire sans modifier le code ?

Reponse : oui, mais avec limitations identifiees.

Decisions deja possibles :

- sections presentes/masquees ;
- ordre desktop/mobile ;
- variantes de hero/properties/sellerSpace/reviews/contact/estimate ;
- surfaces ;
- CTA ;
- roles images ;
- palette, typographies, boutons, cards, navigation/footer, rythme mobile.

Decisions manquantes observees :

- largeur/line breaks du Hero par viewport ;
- proportions fines texte/image par section ;
- contenu public complet de Proof/SellerSpace ;
- footer vraiment editorial par agence ;
- corpus Lovable reel versionne pour comparer.

## Decision V1

Decision : B. V1 vendable apres quelques corrections P1 ciblees.

Corrections bloquantes maximum :

1. Versionner au moins deux vrais `LovableOutput` complets avec routes SD et captures Lovable/SD reproductibles.
2. Garantir que chaque nouvelle demo qualifiee "fidele" possede `publicPage.sections` + `VisualPack.imageRoles`.
3. Ajouter un diagnostic admin indiquant quand la reproduction utilise un fallback legacy au lieu de Lovable.

Corrections importantes non bloquantes :

1. Hero : largeur/line breaks par viewport.
2. Proportions texte/image par section.
3. Proof/SellerSpace pilotables par section.
4. Footer configurable plus finement.
5. Selection/quantite de biens dans une section properties.

Details P2/P3 reportables :

- polish hover ;
- micro-espacements par section ;
- ordre des colonnes footer ;
- diagnostic de score par section.

## Chemins

- Rapport : `docs/lovable-vs-sd-master-visual-audit.md`
- Registre : `docs/lovable-vs-sd-master-visual-audit.json`
- Captures : `docs/visual-audit/pr55/`
