# Audit PR 43 - Fidelite Lovable du renderer public

## Perimetre

Cet audit ne modifie pas le renderer. Il documente uniquement les informations Lovable encore perdues, simplifiees ou remplacees avant le rendu final Signature Digital.

Sources inspectees :

- `src/lib/lovableOutput.ts`
- `src/lib/publicPageConfig.ts`
- `src/lib/renderContract.ts`
- `src/components/admin/ProjectDetail.tsx`
- `src/data/realEstateAgencyConfig.ts`
- `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`
- `src/components/demo-template-immobilier/opus-domus-template.css`
- contrats `docs/lovable-output-contract.md`, `docs/visual-blueprint-v1.md`

Les comparaisons portent sur plusieurs familles de demos disponibles dans le depot et dans les contrats :

1. demo editoriale immersive, type Cote Particuliers, avec `editorial-immersive`, typographies serif/sans, hero image, sections agence et biens en editorial ;
2. demo commerciale directe, avec estimation visible tot, grille de biens dense, CTA plus nombreux et `sellerSpace` visible ;
3. demo locale humaine, avec image d'agence, ton de proximite, contact et preuve locale ;
4. demo institutionnelle confiance, avec preuves, avis et rassurance ;
5. demo data/investissement, avec cartes compactes, chiffres et lecture rationnelle.

## Resume executif

`PublicPageConfig` a supprime la cause principale de page fixe : la home peut maintenant choisir ses sections, leur ordre, leurs titres, leurs surfaces, leurs variantes et certains roles d'image. Le blocage restant n'est plus "Opus Domus impose toujours toute la page", mais "les informations transmises par Lovable sont encore trop souvent reduites a des variantes bornees et a des fallbacks".

Les prochaines PR doivent donc viser l'ingestion et la consommation des informations deja structurees, pas une refonte ni un page builder.

## Ecarts critiques

| Gravite | Difference | Fichier | Fonction | Information perdue | Impact visuel | Correction minimale |
| --- | --- | --- | --- | --- | --- | --- |
| Critique | Une reponse Lovable sans `publicPage.sections` retombe sur la home legacy, meme si le VisualBlueprint et le VisualPack sont valides. | `src/lib/lovableOutput.ts`, `src/components/demo-template-immobilier/OpusDomusTemplate.tsx` | `parseLovableOutput()`, `parsePublicPageSection()`, `TemplateLanding()` | Liste exacte des sections, ordre, titres publics, roles d'images, presence/absence des blocs. | La demo SD redevient une page Opus Domus reconstruite par fallback : hero + biens + methode + sellerSpace + reviews + contact. | Rendre `publicPage` obligatoire ou explicitement bloquant pour une reproduction fidele ; garder le fallback uniquement pour legacy et signaler "page publique non fournie". |
| Critique | Les roles d'images du VisualPack sont conserves surtout si `publicPage` existe deja. | `src/components/admin/ProjectDetail.tsx`, `src/lib/publicPageConfig.ts` | `mergeVisualPackImageRolesIntoPublicPage()`, `buildPublicPageImageRoles()` | Association image -> hero, agency, method, sellerSpace, proof, contact, portrait. | Les images Lovable peuvent etre sauvegardees mais ne pas apparaitre au bon endroit ; le rendu utilise les fallbacks ou l'ancien tableau `sectionImages`. | Persister le mapping `imageRoles` comme donnee de page publique, meme si le VisualPack arrive avant ou sans `publicPage`. |
| Critique | Le schema `PublicPageSectionConfig` ne represente pas les proportions fines d'une section Lovable. | `src/lib/publicPageConfig.ts`, `src/components/demo-template-immobilier/OpusDomusTemplate.tsx` | `normalizePublicPageSection()`, `renderPublicPageSectionContent()` | Largeur de texte, ratio image/texte, position media, focale, hauteur, densite verticale, nombre d'elements. | Deux demos Lovable differentes mais partageant la meme variante se rapprochent fortement dans SD. | Ajouter des champs bornes par section pour les proportions et les medias, puis les consommer dans les renderers existants. |
| Critique | Les avis/preuves Lovable ne pilotent pas les items rendus. | `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`, `src/lib/publicProofSystem.ts` | `renderReviewsSection()`, `resolvePublicProof()` | Citation, label, preuve choisie, ordre et ton editorial de la section. | La section avis peut rester generique ou derivee des biens/agents au lieu de reproduire les preuves de la demo Lovable. | Autoriser la section `reviews` a fournir des items bornes, avec `PublicProof` comme fallback metier. |
| Critique | Le mockup public `sellerSpace` garde une structure interne Opus Domus. | `src/components/demo-template-immobilier/OpusDomusTemplate.tsx` | `renderSellerSpaceSection()`, `SellerPanel()` | Type de promesse, contenu des cartes, niveau de detail, mise en scene du dashboard. | Les demos editoriales et commerciales affichent encore un bloc SaaS reconnaissable si la section est active. | Faire piloter le contenu public du `SellerPanel` par `section.title`, `description`, `emphasis`, CTA et quelques cards configurees ; garder le module prive intact. |

## Ecarts importants

| Gravite | Difference | Fichier | Fonction | Information perdue | Impact visuel | Correction minimale |
| --- | --- | --- | --- | --- | --- | --- |
| Important | `hero.variant = editorial-split` ne suffit pas a reproduire un hero Lovable. | `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`, `src/components/demo-template-immobilier/opus-domus-template.css` | `resolvePublicPageHeroConfig()`, CSS `.od-public-hero*` | Largeur du titre, retours de ligne intentionnels, position verticale, ratio texte/image, overlay exact, comportement de nav integree. | Le premier ecran peut etre correct en intention mais pas fidele en composition. | Ajouter des options bornees de hero : `textWidth`, `mediaRatio`, `verticalAlign`, `imageFocalPoint`, `overlayStrength`, `navTreatment`. |
| Important | Les surfaces existent mais ne portent pas toute la logique locale de palette Lovable. | `src/components/demo-template-immobilier/opus-domus-template.css` | classes `.od-public-page-section--surface-*` | Accent local, bordures, separations, couleur CTA locale, alternance exacte ivory/ink/bronze. | Les blocs ont une famille de couleur correcte mais l'alternance et les contrastes ne reproduisent pas la demo. | Mapper chaque surface a des roles de palette plus precis et autoriser un accent de section borne. |
| Important | La section biens reste limitee a une selection et une hierarchie internes. | `src/components/demo-template-immobilier/OpusDomusTemplate.tsx` | `renderPropertiesSection()` | Bien vedette choisi par Lovable, nombre de cartes, ordre, ratio image/carte, densite de chrome immobilier. | `featured-first` et `dense-grid` differencient le layout mais pas toujours la composition Lovable. | Ajouter `featuredPropertyId`, `maxItems`, `cardChrome` et `mediaRatio` bornes dans la section `properties`. |
| Important | Les CTA sont filtres proprement, mais leur emplacement et leur poids restent fortement limites. | `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`, `src/lib/publicPageConfig.ts` | `getRenderableCta()`, renderers de sections | Position CTA, separation visuelle, CTA secondaire contextuel, hierarchie entre actions. | Une demo commerciale avec beaucoup de CTA et une demo editoriale avec peu de CTA peuvent rester trop proches. | Ajouter une option bornee `ctaLayout` par section : inline, stacked, separated, footer. |
| Important | La composition mobile est surtout une pile responsive generique. | `src/components/demo-template-immobilier/opus-domus-template.css` | media queries public page | Ordre texte/image mobile, hauteur hero mobile, crop mobile, respiration specifique. | Les captures mobile Lovable perdent leur rythme ; SD donne une suite de blocs standardises. | Ajouter et consommer `mobileVariant`, `mobileMediaPosition`, `mobileImageRatio`, `mobileOrder` par section. |
| Important | Les typographies sont appliquees comme familles, pas comme direction typographique complete. | `src/lib/renderContract.ts`, `src/components/demo-template-immobilier/opus-domus-template.css` | `resolveTypography()`, variables `--od-render-*font` | Echelle de titres, graisse, interlignage, espacement, relation heading/body. | Cormorant/Inter peut etre visible sans retrouver la hierarchie premium Lovable. | Ajouter des tokens bornes de type scale et de heading treatment consommes par hero, sections et cartes. |
| Important | Les capacites non supportees sont parsees mais ne guident pas encore la decision de rendu. | `src/lib/lovableOutput.ts`, `src/components/admin/ProjectDetail.tsx` | `parseUnsupportedCapabilities()`, resume admin | Ecart connu par Lovable, categorie et importance. | Le moteur peut creer une demo en sachant qu'une partie visible ne sera pas reproduite, sans aide priorisee. | Afficher un diagnostic de fidelite par section et empecher de qualifier la reproduction de "complete" si des capacites high touchent la home. |

## Ecarts mineurs

| Gravite | Difference | Fichier | Fonction | Information perdue | Impact visuel | Correction minimale |
| --- | --- | --- | --- | --- | --- | --- |
| Mineur | Les textes legacy restent presents comme fallbacks. | `src/lib/publicPageConfig.ts`, `src/components/demo-template-immobilier/OpusDomusTemplate.tsx` | `createLegacyPublicPageConfig()`, renderers | Titres Lovable si la section n'est pas fournie. | Les textes "Nos exclusivites", "Vous savez tout..." peuvent reapparaitre sur une nouvelle agence mal ingestee. | Etiqueter clairement la source legacy et avertir avant creation d'une nouvelle demo sans `publicPage`. |
| Mineur | Les variantes inconnues sont normalisees vers un fallback sans diagnostic visible suffisant. | `src/lib/publicPageConfig.ts` | `normalizeSectionVariant()` | Intention Lovable proche d'une variante existante mais mal nommee. | Une section peut changer de rendu sans explication. | Ajouter un diagnostic "variante non reconnue, fallback applique" avec type de section et valeur recue. |
| Mineur | Le parseur `publicPage` accepte un format structure, mais pas une description libre de page. | `src/lib/lovableOutput.ts` | `parsePublicPageSection()` | Intentions exprimees en prose hors YAML. | Les reponses Lovable non conformes perdent la page publique et tombent en legacy. | Renforcer le prompt Lovable et les exemples ; ne pas inferer depuis prose libre. |
| Mineur | Le footer reste moins configurable que les sections de home. | `src/components/demo-template-immobilier/OpusDomusTemplate.tsx` | footer public | Densite, ordre des colonnes, niveau editorial des infos legales/contact. | Le bas de page peut rester plus generique que le reste. | Ajouter une configuration bornee de footer separee des sections, sans changer les donnees legales. |

## Causes racines

1. `publicPage` est la vraie donnee de carrosserie, mais elle n'est pas encore garantie dans le retour Lovable. Quand elle manque, SD retombe logiquement sur un fallback legacy qui ressemble a Opus Domus.
2. Les variantes visibles existent, mais elles restent des familles larges. Elles ne transportent pas encore les proportions fines qui font la fidelite Lovable.
3. Certaines sections continuent d'utiliser des composants metier comme source principale de contenu public (`PublicProof`, `SellerPanel`) au lieu d'utiliser d'abord la section Lovable et seulement ensuite les donnees metier.
4. Le VisualPack est bien parse, mais le mapping image par role peut etre perdu si la page publique structuree n'est pas presente ou si les roles ne correspondent pas exactement aux roles supportes.
5. Le systeme de rendu est maintenant configurable en presence, ordre et variantes, mais il ne dispose pas encore d'un diagnostic de fidelite qui separe "rendu possible", "fallback applique" et "information ignoree".

## Ordre recommande des prochaines PR

### PR suivante 1 - Durcir l'ingestion Lovable publicPage

Objectif : rendre impossible une nouvelle demo "fidele Lovable" sans `publicPage.sections` structure.

Corrections minimales :

- faire remonter un warning bloquant de fidelite si `publicPage` est absent sur un nouveau projet ;
- conserver `VisualPack.imageRoles` meme sans `publicPage` ;
- diagnostiquer les variantes et roles inconnus normalises ;
- documenter le format Lovable attendu avec un exemple `publicPage` complet.

### PR suivante 2 - Enrichir les tokens bornes des sections existantes

Objectif : ne pas ajouter de nouveau moteur, mais donner aux sections existantes assez d'informations pour reproduire les proportions Lovable.

Corrections minimales :

- ajouter des champs bornes par section : `textWidth`, `mediaPosition`, `imageRatio`, `imageFocalPoint`, `spacing`, `ctaLayout`, `maxItems`, `featuredPropertyId`, `mobileVariant` ;
- les consommer dans les renderers existants ;
- garder des fallbacks legacy stricts.

### PR suivante 3 - Rendre Proof et SellerSpace pilotables par section

Objectif : retirer les deux derniers blocs publics qui imposent trop de contenu Opus Domus.

Corrections minimales :

- `reviews` peut fournir des items publics bornes, sinon `PublicProof` reste fallback ;
- `sellerSpace` peut fournir ses cartes publiques ou sa promesse, sinon `SellerPanel` reste fallback ;
- les modules prives restent inchanges.

### PR suivante 4 - Ajouter des tests de structure/fidelite

Objectif : prouver que deux demos Lovable differentes produisent deux carrosseries differentes.

Corrections minimales :

- fixtures editorial, commercial, local, institutional, data ;
- assertions sur sections presentes, ordre, titres, variants, roles images, absence de textes legacy ;
- snapshot structurel ou tests DOM sans verification pixel.

## Decision

La branche actuelle a fait le bon deplacement : Opus Domus n'est plus oblige de decider seul de la home. Le verrou restant n'est pas une nouvelle architecture, mais la fidelite des donnees structurees : `publicPage` doit devenir obligatoire pour les nouvelles demos, les roles d'images doivent survivre independamment du fallback, et les sections existantes doivent consommer des tokens bornes de proportion, contenu et mobile.

