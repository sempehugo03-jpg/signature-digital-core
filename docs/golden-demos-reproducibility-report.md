# Golden demos Lovable vers Signature Digital - PR 56

## Contexte

Objectif : figer des sources de verite reproductibles pour comparer des demos Lovable reelles a leur rendu Signature Digital. Cette PR ne modifie pas le renderer visuel et ne cree aucune nouvelle capacite.

## Prerequis verifies

`origin/main` contient les elements attendus des PR 49 a 55 :

- fidelite boutons : tokens et classes publiques de bouton dans le RenderContract/CSS ;
- fidelite typographique : `RenderContract.typography` et tokens `--od-render-heading-font`, `--od-render-body-font` ;
- fidelite layout : `RenderContract.layout` et tokens de largeur/spacing ;
- fidelite cartes/images : `RenderContract.propertyCards`, roles d'images et preuves associees ;
- fidelite navigation/footer : `RenderContract.navigation` et `RenderContract.footer` ;
- fidelite mobile : `mobileOrder` et preuves responsive ;
- audit maitre PR55 : `docs/lovable-vs-sd-master-visual-audit.md` et registre JSON.

## Golden demo A - Cote Particuliers Tarbes

Statut : `partial`.

Source reelle disponible :

- capture Lovable mobile : `docs/visual-audit/golden/cote-particuliers-tarbes/lovable/mobile-390-reference-lovable.jpg` ;
- hash capture Lovable : `8f9aab21e711239128f75092bfb0d5c302b54ec89baf526a8d63aa7a2165936e` ;
- capture SD terrain historique : `docs/visual-audit/golden/cote-particuliers-tarbes/sd/mobile-field-sd-before-pr49-54.jpg` ;
- hash capture SD historique : `fa2c6b379ba8ce69a20b222371252960b3dff4aa79637a72c5e3fe1abb542f6d`.

Source manquante :

- `LovableOutput` original complet ;
- `VisualBlueprint` original versionne ;
- `VisualPack` original versionne ;
- `PublicPageConfig` original versionne ;
- `unsupportedCapabilities` originales ;
- roles d'images exploitables ;
- donnees metier exactes de la demo ;
- captures Lovable desktop.

La PR ne reconstruit pas ces donnees manuellement. Le statut reste partiel.

Route dediee : `/golden/cote-particuliers-tarbes`.

La route est resoluble et deterministe, mais affiche un etat de golden demo partielle tant que la source Lovable complete est absente.

## Golden demo B - commerciale reelle opposee

Statut : `blocked`.

Recherche effectuee :

- `src/lib/lovableOutputParsingProofs.ts` contient une fixture Sora complete, mais elle est synthetique ;
- `src/lib/publicPageConfig.ts` contient des fixtures editorial/commercial, mais elles sont synthetiques ;
- `docs/lovable-vs-sd-master-visual-audit.md` confirme qu'aucune deuxieme demo Lovable reelle opposee n'est versionnee ;
- les pieces jointes locales contiennent des captures, pas de sortie Lovable complete.

Aucune seconde golden demo reelle n'a donc ete fabriquee.

Route dediee : `/golden/commercial-real`.

La route est resoluble et deterministe, mais affiche un etat bloque tant que la source reelle manque.

## Fichiers versionnes

- Registre : `src/golden-demos/golden-demos.manifest.json` ;
- acces runtime : `src/golden-demos/registry.ts` ;
- metadata A : `src/golden-demos/cote-particuliers-tarbes/metadata.json` ;
- normalisation A : `src/golden-demos/cote-particuliers-tarbes/normalized-output.json` ;
- images A : `src/golden-demos/cote-particuliers-tarbes/image-manifest.json` ;
- donnees metier A : `src/golden-demos/cote-particuliers-tarbes/business-data.json` ;
- metadata B : `src/golden-demos/commercial-real/metadata.json` ;
- normalisation B : `src/golden-demos/commercial-real/normalized-output.json` ;
- images B : `src/golden-demos/commercial-real/image-manifest.json` ;
- donnees metier B : `src/golden-demos/commercial-real/business-data.json`.

## Normalisation SD

La normalisation complete via `parseLovableOutput(lovable-output.yaml)` ne peut pas encore etre executee pour ces deux golden demos, car aucune source Lovable complete n'est versionnee.

Le script `scripts/verify-golden-demos.mjs` verifie donc :

- existence des manifests ;
- coherence des statuts `partial` / `blocked` ;
- presence des routes ;
- absence de `sourceHash` invente pour les demos incompletes ;
- existence et hash des captures versionnees ;
- coherence des fichiers de donnees et manifests.

Lorsqu'un `lovable-output.yaml` complet sera ajoute, le statut devra passer a `complete` et le meme script exigera une normalisation, un hash source, un `VisualBlueprint`, un `VisualPack`, une `PublicPageConfig` et des donnees metier.

## Images et roles

La demo A conserve uniquement les captures disponibles. Les roles `hero`, `agency`, `method`, `sellerSpace`, `proof`, `contact`, `advisorPortrait`, `localArea` sont marques manquants dans `image-manifest.json`.

La demo B ne possede aucune image reelle.

Aucune image similaire n'a ete ajoutee pour masquer un mapping incomplet.

## Captures

Lovable :

- `docs/visual-audit/golden/cote-particuliers-tarbes/lovable/mobile-390-reference-lovable.jpg`.

SD :

- `docs/visual-audit/golden/cote-particuliers-tarbes/sd/mobile-field-sd-before-pr49-54.jpg`.

Script de capture SD reproductible :

- `docs/visual-audit/golden/capture-golden-sd-viewports.ps1`.

Commande :

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4174
.\docs\visual-audit\golden\capture-golden-sd-viewports.ps1
```

## Tests automatiques

Script :

```powershell
node scripts/verify-golden-demos.mjs
```

Ce test ne depend d'aucune API mutable, de Supabase ou d'un `agencyId` local.

## Etat de completude

| Demo | Statut | Raison |
| --- | --- | --- |
| Cote Particuliers Tarbes | partial | Captures reelles disponibles, sortie Lovable complete absente |
| Commercial real | blocked | Aucune source Lovable reelle opposee trouvee |

## Decision

Decision C : aucune golden demo complete.

Validation visuelle fiable encore bloquee par l'absence de sorties Lovable completes et versionnees. Cette PR cree la structure d'accueil, les routes de statut, les manifests et les tests de garde-fou sans inventer les donnees manquantes.
