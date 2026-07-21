# Audit de regression PR49 a PR54 - Cote Particuliers Tarbes

## Fixture

Source versionnee sans modification de valeurs :

- `src/golden-demos/cote-particuliers-tarbes/lovable-output.yaml`
- SHA-256 : `5dc016c192248161173ad2b545b2818a0c4cc6a6e3c8edd8f54d2f20dfc0930c`

Normalisation par le parser reel :

- `src/golden-demos/cote-particuliers-tarbes/normalized-output.json`
- `docs/regression-audit/pr49-54/diagnostics/current-parser.json`

Resultat courant : VisualBlueprint reconnu, VisualPack reconnu, 9 sections publiques actives, 8 roles d'images VisualPack, 8 roles d'images publicPage, 5 unsupportedCapabilities, 0 erreur parser, 5 warnings.

## Historique reel

| Etat | Commit main | Commit PR connu | Sujet |
| --- | --- | --- | --- |
| pre-pr49 | `9eec8d7b0db67d7963ae2748d268d0d47cace5a6` | n/a | Merge PR48 |
| PR49 | `6434117c03f25a6eb7a3c464e9fc462024acddbb` | `ab6133815f343c21a4456d4f88cba76863a39b54` | boutons Lovable |
| PR50 | `c0f4f7f354f67754c3a19fff499cece1baf8b1bb` | `d215e733462668d9df2cc4b63e4944b08886ff62` | typographie Lovable |
| PR51 | `898c803b946cc5e205002437f323dc590ff44e51` | `b1562c634a03b93c69e8186df5f0bdf55446b056` | layout / rythme |
| PR52 | `ec1ba0e16ebe2a144b157bf16df76b9ec823937c` | `e18c7881a9322171c03484d9a132ae4923090325` | cartes / images |
| PR53 | `01667d5dc77f170662d6d9c7099f14a1f2dfdd45` | `4a82b071baa6169bfea4ba9490355a4775692973` | navigation / footer |
| PR54 | `2042dddc2897f46fc4212a1a9ac7577a47887a90` | `57e62afab03d059bf7892e2f30417eb112593a97` | mobile |
| current | `origin/main` | n/a | main courant |

## Methode executee

`scripts/run-pr49-54-parser-audit.mjs` extrait pour chaque SHA les vrais fichiers `lovableOutput.ts`, `visualBlueprint.ts` et `publicPageConfig.ts`, puis execute `parseLovableOutput()` sur la meme fixture.

Diagnostics produits :

- `docs/regression-audit/pr49-54/diagnostics/pre-pr49.json`
- `docs/regression-audit/pr49-54/diagnostics/pr49.json`
- `docs/regression-audit/pr49-54/diagnostics/pr50.json`
- `docs/regression-audit/pr49-54/diagnostics/pr51.json`
- `docs/regression-audit/pr49-54/diagnostics/pr52.json`
- `docs/regression-audit/pr49-54/diagnostics/pr53.json`
- `docs/regression-audit/pr49-54/diagnostics/pr54.json`
- `docs/regression-audit/pr49-54/diagnostics/current.json`
- `docs/regression-audit/pr49-54/diagnostics/summary.json`

## Tableau comparatif parser

| Etat | Blueprint | Pack | Sections | Roles images | Unsupported | Hero title | Hero image URL | Properties title | Warnings |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | ---: |
| pre-pr49 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| PR49 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| PR50 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| PR51 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| PR52 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| PR53 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| PR54 | oui | oui | 9 | 8 | 5 | present | present | present | 5 |
| current | oui | oui | 9 | 8 | 5 | present | present | present | 5 |

Conclusion parser : aucune regression PR49-PR54 sur l'ingestion. Les titres, CTA, imageRoles, `publicPage.sections` et `unsupportedCapabilities` sont deja presents avant PR49 et restent stables.

## Diagnostics constants

Les 5 warnings sont constants sur tous les etats :

1. `visualPack.typography.source = curated` non reconnu ;
2. `homeImages.3.role = localarea` fallback `section` ;
3. `homeImages.4.role = advisorportrait` fallback `section` ;
4. `sectionImages.2.role = sellerspace` fallback `section` ;
5. `unsupportedCapabilities.4.category = propertycards` fallback `other`.

Ces warnings existent avant PR49 : ce ne sont pas des regressions PR49-PR54.

## URLs Lovable

Fichiers :

- `docs/regression-audit/pr49-54/diagnostics/image-url-status.json`
- `docs/regression-audit/pr49-54/diagnostics/image-url-status-final.json`

Resultat : les URLs `VisualPack.imageRoles` repondent apres redirection en `200 text/html; charset=utf-8`, pas en `image/*`.

Conclusion : un Hero sans image ou des images cassees peuvent venir des URLs Lovable `/src/assets/...`. C'est un probleme de source Lovable, pas une regression du parser ni une regression PR49-PR54 prouvee.

## Captures

Captures de reference disponibles :

- `docs/visual-audit/golden/cote-particuliers-tarbes/lovable/mobile-390-reference-lovable.jpg`
- `docs/visual-audit/golden/cote-particuliers-tarbes/sd/mobile-field-sd-before-pr49-54.jpg`

Captures par etat Git : non produites. La route `/golden/cote-particuliers-tarbes` n'existe qu'apres PR56 ; un harness de rendu externe doit etre injecte dans chaque worktree pour capturer les anciens commits sans modifier leur code. Les tentatives de serveur local dans cette session n'ont pas expose la route.

Arborescence preparee :

- `docs/regression-audit/pr49-54/pre-pr49/`
- `docs/regression-audit/pr49-54/pr49/`
- `docs/regression-audit/pr49-54/pr50/`
- `docs/regression-audit/pr49-54/pr51/`
- `docs/regression-audit/pr49-54/pr52/`
- `docs/regression-audit/pr49-54/pr53/`
- `docs/regression-audit/pr49-54/pr54/`
- `docs/regression-audit/pr49-54/current/`

## Attribution

| Defaut | Present avant PR49 | Derniere bonne | Premiere mauvaise | PR responsable | Cause |
| --- | --- | --- | --- | --- | --- |
| publicPage perdue | non | n/a | n/a | aucune | 9 sections conservees partout |
| Hero title absent | non cote parser | n/a | n/a | aucune cote parser | titre complet conserve partout |
| Hero image absente | URL presente partout | n/a | n/a | non attribuable | MIME final HTML |
| Properties title absent | non cote parser | n/a | n/a | aucune cote parser | titre present partout |
| unsupportedCapabilities perdues | non | n/a | n/a | aucune | 5 entrees partout |
| imageRoles perdus | non | n/a | n/a | aucune cote parser | 8 roles partout |
| rendu visuel degrade apres PR54 | non tranche | n/a | n/a | non attribue | captures runtime par commit requises |

## Recommandation par PR

| PR | Recommandation |
| --- | --- |
| PR49 | conserver ; aucune regression parser |
| PR50 | conserver ; aucune regression parser |
| PR51 | conserver ; aucune regression parser |
| PR52 | conserver ; verifier rendu CSS/images avec captures runtime |
| PR53 | conserver ; aucune regression parser |
| PR54 | conserver ; audit runtime mobile encore necessaire |

## Conclusion

La premiere rupture confirmee n'est pas une PR49-PR54 : les URLs d'images Lovable sont transportees, mais pointent vers des chemins `/src/assets/...` qui retournent du HTML. La chaine parser reste stable de pre-PR49 a PR54.

Si une degradation visuelle subsiste, elle est apres ingestion : runtime, renderer ou CSS. Cette mission n'a introduit aucune correction moteur.
