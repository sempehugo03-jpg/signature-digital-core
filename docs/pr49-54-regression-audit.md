# Audit de regression PR49 a PR54

## Mise a jour de completion - 2026-07-21

Mission : completer l'audit avec la fixture reelle Cote Particuliers Tarbes desormais fournie.

Resultat factuel : la fixture `LovableOutput` complete n'est pas presente dans le workspace accessible a Codex.

Recherche executee depuis la branche `codex/complete-pr49-54-regression-audit` basee sur `origin/main` :

```powershell
rg --files . | rg "lovable|cote|particuliers|tarbes|yaml|yml|golden|regression"
rg "C[ôo]te|Particuliers|Tarbes|LovableOutput:" . -n --glob '!node_modules/**' --glob '!dist/**'
Get-ChildItem -Recurse "C:\Users\sempe\Documents\Signature immobilier app\.codex-remote-attachments" -File
```

Faits trouves :

- aucune occurrence de `LovableOutput` Cote Particuliers ;
- aucun fichier `.yaml` ou `.yml` contenant la sortie reelle ;
- uniquement les captures JPG deja versionnees par PR55/PR56 ;
- la golden demo Cote Particuliers reste `partial` dans `src/golden-demos/cote-particuliers-tarbes/metadata.json` ;
- la seconde demo commerciale reelle reste absente.

Consequence : l'audit ne peut pas etre transforme en comparaison factuelle pre-PR49 -> PR54 sans modifier ou inventer la source, ce qui est explicitement interdit.

Action realisee : le rapport et le registre restent volontairement en statut bloque, avec les SHAs reels et la matrice de capture prete. Aucun moteur, parser, CSS ou RenderContract n'a ete modifie.

Verification script :

```powershell
powershell -ExecutionPolicy Bypass -File .\docs\regression-audit\pr49-54\run-regression-captures.ps1
```

Resultat attendu et obtenu :

```text
Fixture exacte absente: src\golden-demos\cote-particuliers-tarbes\lovable-output.yaml. Importer le LovableOutput original Cote Particuliers avant de lancer l'audit.
```

## Historique reel des commits

| Etat | Commit main | Commit PR connu | Sujet |
| --- | --- | --- | --- |
| pre-pr49 | `9eec8d7b0db67d7963ae2748d268d0d47cace5a6` | n/a | Merge PR48 |
| PR49 | `6434117c03f25a6eb7a3c464e9fc462024acddbb` | `ab6133815f343c21a4456d4f88cba76863a39b54` | boutons Lovable |
| PR50 | `c0f4f7f354f67754c3a19fff499cece1baf8b1bb` | `d215e733462668d9df2cc4b63e4944b08886ff62` | typographie Lovable |
| PR51 | `898c803b946cc5e205002437f323dc590ff44e51` | `b1562c634a03b93c69e8186df5f0bdf55446b056` | layout / rythme |
| PR52 | `ec1ba0e16ebe2a144b157bf16df76b9ec823937c` | `e18c7881a9322171c03484d9a132ae4923090325` | cartes / images |
| PR53 | `01667d5dc77f170662d6d9c7099f14a1f2dfdd45` | `4a82b071baa6169bfea4ba9490355a4775692973` | navigation / footer |
| PR54 | `2042dddc2897f46fc4212a1a9ac7577a47887a90` | `57e62afab03d059bf7892e2f30417eb112593a97` | mobile |
| current | `eba9801ee9435fe086e6a501da9f6546d44d000a` au moment PR56, puis `origin/main` courant | n/a | main apres PR55/PR56 |

Les SHAs fournis par la mission sont les commits de branches PR. Dans `main`, ils sont integres par merge commits.

## Fixture

Chemin attendu : `src/golden-demos/cote-particuliers-tarbes/lovable-output.yaml`.

Etat actuel : fichier absent. Il n'a pas ete cree, car le bloc original fourni par Lovable n'est pas disponible dans les fichiers accessibles. Creer ce fichier avec une reconstruction manuelle violerait l'interdiction de modifier ou interpreter la source.

Hash SHA-256 : non calculable sans fichier source.

## Normalisation

`src/golden-demos/cote-particuliers-tarbes/normalized-output.json` existe depuis PR56, mais indique explicitement :

- statut `partial` ;
- normalisation non disponible ;
- raison : `LovableOutput original complet absent du depot`.

Le vrai parser ne peut pas etre execute sur la fixture demandee tant que `lovable-output.yaml` est absent.

## Etats Git a tester

La matrice reste prete :

- `pre-pr49`
- `pr49`
- `pr50`
- `pr51`
- `pr52`
- `pr53`
- `pr54`
- `current`

Les captures et diagnostics par etat ne sont pas produits, car le script doit utiliser la meme fixture exacte dans chaque worktree.

## Captures

Captures reelles disponibles :

- `docs/visual-audit/golden/cote-particuliers-tarbes/lovable/mobile-390-reference-lovable.jpg`
- `docs/visual-audit/golden/cote-particuliers-tarbes/sd/mobile-field-sd-before-pr49-54.jpg`

Arborescence preparee pour la prochaine execution :

- `docs/regression-audit/pr49-54/pre-pr49/`
- `docs/regression-audit/pr49-54/pr49/`
- `docs/regression-audit/pr49-54/pr50/`
- `docs/regression-audit/pr49-54/pr51/`
- `docs/regression-audit/pr49-54/pr52/`
- `docs/regression-audit/pr49-54/pr53/`
- `docs/regression-audit/pr49-54/pr54/`
- `docs/regression-audit/pr49-54/current/`
- `docs/regression-audit/pr49-54/diagnostics/`

## Diagnostics et attribution

Aucune regression PR49-PR54 ne peut etre attribuee factuellement sans execution de la fixture exacte.

Attribution impossible pour :

- Hero sans image ;
- titre Hero absent ou reduit a un caractere ;
- images cassees ;
- titres de sections absents ou tronques ;
- fallbacks ;
- proprietes VisualBlueprint ignorees.

Cause actuelle confirmee : source d'audit absente.

## Recommandation par PR

| PR | Recommandation |
| --- | --- |
| PR49 | non responsable non prouve ; conserver jusqu'a test |
| PR50 | non responsable non prouve ; conserver jusqu'a test |
| PR51 | non responsable non prouve ; conserver jusqu'a test |
| PR52 | non responsable non prouve ; conserver jusqu'a test |
| PR53 | non responsable non prouve ; conserver jusqu'a test |
| PR54 | non responsable non prouve ; conserver jusqu'a test |

## Prochaine etape requise

Ajouter exactement le fichier original `src/golden-demos/cote-particuliers-tarbes/lovable-output.yaml`, sans modification. Ensuite seulement :

1. calculer le hash ;
2. generer `normalized-output.json` par le vrai parser ;
3. injecter la meme fixture dans chaque worktree ;
4. capturer DOM et screenshots ;
5. attribuer les regressions.
