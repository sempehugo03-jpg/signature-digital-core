# Audit de regression PR49 a PR54

## Verdict court

La premiere cause bloquante n'est pas une PR 49 a 54 : la fixture exacte demandee, `LovableOutput` complet Cote Particuliers Tarbes, n'est pas versionnee dans `origin/main`.

Sans cette entree, il est impossible de tester proprement les etats pre-PR49, PR49, PR50, PR51, PR52, PR53, PR54 et current avec le meme YAML, les memes images, les memes annonces et la meme route. L'audit ci-dessous separe donc :

- les faits confirmes par l'historique Git ;
- les suspects techniques visibles dans les diffs ;
- les regressions non attribuables sans fixture.

Aucune correction runtime n'a ete introduite.

## Historique reel des commits

| Etat | Commit main teste | Commit PR connu | Sujet |
| --- | --- | --- | --- |
| pre-pr49 | `9eec8d7b0db67d7963ae2748d268d0d47cace5a6` | n/a | Merge PR48 |
| PR49 | `6434117c03f25a6eb7a3c464e9fc462024acddbb` | `ab6133815f343c21a4456d4f88cba76863a39b54` | boutons Lovable |
| PR50 | `c0f4f7f354f67754c3a19fff499cece1baf8b1bb` | `d215e733462668d9df2cc4b63e4944b08886ff62` | typographie Lovable |
| PR51 | `898c803b946cc5e205002437f323dc590ff44e51` | `b1562c634a03b93c69e8186df5f0bdf55446b056` | layout / rythme |
| PR52 | `ec1ba0e16ebe2a144b157bf16df76b9ec823937c` | `e18c7881a9322171c03484d9a132ae4923090325` | cartes / images |
| PR53 | `01667d5dc77f170662d6d9c7099f14a1f2dfdd45` | `4a82b071baa6169bfea4ba9490355a4775692973` | navigation / footer |
| PR54 | `2042dddc2897f46fc4212a1a9ac7577a47887a90` | `57e62afab03d059bf7892e2f30417eb112593a97` | mobile |
| current | `eba9801ee9435fe086e6a501da9f6546d44d000a` | n/a | origin/main avec PR55 et PR56 |

Les SHAs fournis sont les commits de branches PR. Dans l'historique main, ils ont ete merges par commits de merge.

## Fixture utilisee

Fixture exacte Cote Particuliers Tarbes : non disponible dans le depot.

Recherche effectuee :

- `rg "Cote|Côté|Particuliers|Tarbes|LovableOutput:|Sora|Instrument Serif" src docs`
- verification des golden demos PR56 ;
- verification des captures PR55.

Faits trouves :

- captures Cote Particuliers disponibles ;
- aucune sortie `LovableOutput` Cote Particuliers complete ;
- aucune route SD deterministe correspondante ;
- la seule fixture `LovableOutput` complete est Sora, synthetique.

Conclusion : la matrice visuelle demandee ne peut pas etre executee sans inventer le YAML, ce qui est interdit.

## Etats testes

Les etats Git ont ete identifies et les diffs techniques ont ete analyses. La verification visuelle/DOM sur la meme entree n'a pas ete executee faute de fixture.

| Etat | Parser | Hero | Sections | Images | Cartes | Nav/footer | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pre-pr49 | non testable sans fixture | non testable | non testable | non testable | non testable | non testable | non testable |
| PR49 | non testable sans fixture | non testable | non testable | non testable | non testable | non testable | non testable |
| PR50 | non testable sans fixture | suspect typo si titre fragmenté, non confirme | non testable | non testable | non testable | non testable | non testable |
| PR51 | non testable sans fixture | suspect layout hauteur/largeur, non confirme | non testable | non testable | non testable | non testable | non testable |
| PR52 | non testable sans fixture | non testable | non testable | suspect cartes/images, non confirme | suspect tokens carte, non confirme | non testable | non testable |
| PR53 | non testable sans fixture | non testable | non testable | non testable | non testable | suspect nav/footer, non confirme | non testable |
| PR54 | non testable sans fixture | suspect mobile titre/hero, non confirme | suspect ordre mobile, non confirme | non testable | suspect grille mobile, non confirme | suspect footer mobile, non confirme | principal suspect CSS mobile |
| current | build/lint OK | non testable sur Cote sans source | non testable | non testable | non testable | non testable | non testable |

## Captures

Captures existantes reutilisables :

- `docs/visual-audit/golden/cote-particuliers-tarbes/lovable/mobile-390-reference-lovable.jpg`
- `docs/visual-audit/golden/cote-particuliers-tarbes/sd/mobile-field-sd-before-pr49-54.jpg`

Captures par etat PR49-54 : non produites, car elles exigent la fixture Cote Particuliers complete et une route deterministe equivalente sur chaque commit.

Arborescence reservee pour la prochaine execution :

- `docs/regression-audit/pr49-54/pre-pr49/`
- `docs/regression-audit/pr49-54/pr49/`
- `docs/regression-audit/pr49-54/pr50/`
- `docs/regression-audit/pr49-54/pr51/`
- `docs/regression-audit/pr49-54/pr52/`
- `docs/regression-audit/pr49-54/pr53/`
- `docs/regression-audit/pr49-54/pr54/`
- `docs/regression-audit/pr49-54/current/`

## Diffs techniques par PR

### PR49 - boutons

Fichiers modifies :

- `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`
- `src/components/demo-template-immobilier/opus-domus-template.css`
- `src/lib/publicCtaSystem.ts`
- `src/lib/renderContract.ts`

Responsabilite probable : non responsable des images cassees ni du titre Hero vide. Peut seulement affecter l'apparence CTA.

Recommandation : conserver telle quelle sauf si la fixture montre une regression CTA.

### PR50 - typographie

Fichiers modifies :

- `src/components/admin/ProjectDetail.tsx`
- `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`
- `src/components/demo-template-immobilier/opus-domus-template.css`
- `src/data/realEstateAgencyConfig.ts`
- `src/data/realEstateTemplate.ts`
- `src/lib/agencyIdentity.ts`
- `src/lib/lovableOutput.ts`
- `src/lib/publicHeroSystem.ts`
- `src/lib/renderContract.ts`
- `src/lib/typographyFidelityProofs.ts`

Faits diff :

- remplacement massif de polices hardcodees par `--od-render-heading-font` et `--od-render-body-font` ;
- ajout de `displayWeight`, `displayTracking`, `bodySize`, `headlineScale`, `verticalRhythm` ;
- extraction typographique depuis le YAML brut.

Responsabilite probable : candidat secondaire pour une hierarchie typographique degradee si un token vide ou mal parse arrive au CSS. Non responsable direct des images cassees.

Recommandation : conserver avec correction ciblee seulement si le test fixture montre un token vide a partir de PR50.

### PR51 - layout

Fichiers modifies :

- `src/components/demo-template-immobilier/opus-domus-template.css`
- `src/lib/layoutFidelityProofs.ts`
- `src/lib/renderContract.ts`

Responsabilite probable : candidat pour hauteurs, paddings, gaps, largeurs et rythme. Non responsable direct d'un titre reduit a un caractere sans confirmation CSS.

Recommandation : conserver avec correction ciblee si la regression apparait a PR51.

### PR52 - cartes/images

Fichiers modifies :

- `src/components/demo-template-immobilier/opus-domus-template.css`
- `src/lib/cardImageFidelityProofs.ts`
- `src/lib/renderContract.ts`

Faits diff :

- `object-fit` passe sur `--od-render-card-image-fit` ;
- `object-position` passe sur `--od-render-card-image-position` ;
- ratios cartes passent sur `--od-token-image-ratio` ;
- surfaces, badges, shadows et backgrounds passent sur tokens.

Responsabilite probable : candidat pour cadrage ou presentation de cartes. Pas responsable d'URL absente si `VisualPack.imageRoles` manque deja.

Recommandation : conserver avec correction ciblee si le DOM montre que les URLs sont presentes mais masquees/cadrees incorrectement a partir de PR52.

### PR53 - navigation/footer

Fichiers modifies :

- `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`
- `src/components/demo-template-immobilier/opus-domus-template.css`
- `src/lib/navigationFooterFidelityProofs.ts`
- `src/lib/publicNavigationSystem.ts`
- `src/lib/renderContract.ts`

Responsabilite probable : candidat uniquement pour logo/navigation/footer. Non responsable des sections properties ou images cartes hors cascade CSS globale.

Recommandation : conserver avec correction ciblee si le footer ou la nav regresse.

### PR54 - mobile

Fichiers modifies :

- `docs/mobile-fidelity-proof-report.md`
- `src/components/demo-template-immobilier/OpusDomusTemplate.tsx`
- `src/components/demo-template-immobilier/opus-domus-template.css`
- `src/lib/mobileFidelityProofs.ts`
- `src/lib/publicPageConfig.ts`

Faits diff :

- `mobileOrder` est rendu plus deterministe ;
- `.od-public-home > .od-public-section` utilise `order` mobile ;
- ajout de `overflow-wrap:anywhere` sur titres et contenus ;
- sous petits ecrans, le Hero editorial force `max-width: min(100%, 6.5ch) !important` ;
- plusieurs grilles passent a une colonne.

Responsabilite probable : premier candidat pour titre Hero tronque/fragmenté et certains changements mobiles. C'est la seule PR qui touche explicitement le comportement 320-767 px.

Recommandation : conserver avec correction ciblee des regles mobiles si la fixture confirme que le defaut apparait a PR54.

## Problemes source independants

1. `LovableOutput` Cote Particuliers absent : regression non attribuable.
2. Images Lovable non versionnees par role : une image absente ou `/src/assets/...` inaccessible n'est pas une regression PR49-54.
3. Route SD Cote Particuliers absente : impossible de comparer le meme contenu entre commits.

## Regressions confirmees

Aucune regression visuelle PR49-54 n'est confirmee par execution sur la fixture Cote Particuliers, car la fixture exacte est absente.

Regressions candidates :

- PR54 : Hero/titres mobiles fragmentes par `max-width` et `overflow-wrap:anywhere` ;
- PR52 : cadrage cartes/images si les URLs sont bien presentes mais mal affichees ;
- PR50/PR51 : hierarchie typo/layout si les tokens resolus deviennent vides ou trop contraints.

## Recommandation par PR

| PR | Recommendation |
| --- | --- |
| PR49 | non responsable probable ; conserver |
| PR50 | conserver avec verification token typo |
| PR51 | conserver avec verification layout Hero |
| PR52 | conserver avec verification images/cartes |
| PR53 | non responsable probable hors nav/footer ; conserver |
| PR54 | suspect principal mobile ; conserver avec correction ciblee si confirme |

## Bissection automatisee recommandee

Un test `git bisect` fiable doit attendre la fixture exacte. Signaux DOM minimum :

- `heroTitleText.length >= 20` ;
- URL Hero presente dans le DOM ou en background computed ;
- nombre d'images publiques rendues superieur ou egal aux roles exploitables ;
- nombre de sections actives conforme a `publicPage.sections`;
- titre `properties` non vide ;
- absence d'erreur console runtime.

## Conclusion

La premiere PR responsable de chaque regression ne peut pas etre identifiee factuellement tant que la fixture Cote Particuliers complete n'est pas disponible. Le seul responsable probable a partir du diff est PR54 pour les problemes strictement mobiles de titre Hero fragmente. Les images cassees et fallbacks restent des problemes de source jusqu'a preuve inverse.
