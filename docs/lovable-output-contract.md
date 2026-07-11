# Lovable Output Contract

Version officielle : `LOVABLE_OUTPUT_VERSION = "v1"`

Le contrat cote Signature Digital se trouve dans `src/lib/lovableOutput.ts`.

## Role

Le retour Lovable transforme la demo creee dans Lovable en donnees controlees et stockables dans un `Project`.

Chaine cible :

```text
Prompt Lovable officiel -> Demo Lovable -> Retour Lovable structure -> Validation ProjectDetail -> PR 21
```

Cette PR ne cree pas l'agence, n'applique pas automatiquement le VisualBlueprint, n'importe aucune annonce et ne telecharge aucun asset.

## Structure

Lovable retourne exactement quatre groupes de sortie :

1. `demo`
2. `visualBlueprint`
3. `visualPack`
4. `unsupportedCapabilities`

Le bloc racine declare la version :

```yaml
LovableOutput:
  version: v1
```

## Exemple complet

```yaml
LovableOutput:
  version: v1

  demo:
    url: "https://demo-lovable.example"
    projectId: "lovable-project-id"

  visualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        primaryColor: "#111827"
        accentColor: "#B08D57"
      layout:
        composition: editorial-immersive

  visualPack:
    logo:
      status: found
      url: "https://example.com/logo.svg"
    colors:
      primary: "#111827"
      secondary: "#F7F2EA"
      accent: "#B08D57"
      background: "#FFFFFF"
      surface: "#F8F8F8"
      text: "#111827"
    typography:
      heading: "Playfair Display"
      body: "Inter"
      source: detected
    homeImages:
      - role: hero
        url: "https://example.com/home-hero.jpg"
        alt: "Facade de l agence"
        sourceUrl: "https://example.com"

  unsupportedCapabilities:
    - category: section
      importance: medium
      label: "Timeline animee"
      description: "La demo Lovable montre une frise animee non supportee par le moteur actuel."
```

## Demo

`demo.url` est obligatoire et doit etre une URL `http` ou `https` valide.

`projectId`, `reference` et `status` sont facultatifs. Ils restent des references simples, pas un modele de deploiement.

## VisualBlueprint

`visualBlueprint` contient le texte brut complet du Blueprint.

Il doit commencer par :

```yaml
VisualBlueprint:
  version: v1
```

Signature Digital reutilise `parseVisualBlueprintV1Result()` depuis `src/lib/visualBlueprint.ts`. Aucun second parseur Blueprint n'existe dans le contrat LovableOutput.

Le retour expose :

- `raw` ;
- `normalized` quand le parseur officiel reussit ;
- `diagnostics` du parseur Blueprint.

## Visual Pack

Le pack visuel est minimal.

### Logo

`logo.status` accepte uniquement :

- `found`
- `missing`
- `proposed`

Si aucun logo officiel n'est trouve, Lovable doit declarer `missing`. Un logo invente ne doit jamais etre presente comme officiel.

### Colors

Couleurs acceptees :

- `primary`
- `secondary`
- `accent`
- `background`
- `surface`
- `text`

Toutes les couleurs sont facultatives. Si elles sont presentes, elles doivent etre au format hexadecimal.

### Typography

Typographies acceptees :

- `heading`
- `body`
- `source`

`source` accepte :

- `detected`
- `proposed`
- `fallback`

Le contrat ne gere aucun fichier de police.

### Home Images

`homeImages` contient uniquement des images publiques de home.

Roles autorises :

- `hero`
- `section`
- `background`
- `gallery`

Ces images ne sont jamais des photos d'annonces.

## Capacites non supportees

Chaque entree contient :

- `label`
- `description`
- `category`
- `importance`

Categories autorisees :

- `composition`
- `navigation`
- `hero`
- `section`
- `property-card`
- `typography`
- `animation`
- `other`

Importances autorisees :

- `low`
- `medium`
- `high`

Cette liste sert uniquement a la decision produit. Elle ne modifie jamais le moteur automatiquement.

## Diagnostics

`parseLovableOutput(raw)` retourne des diagnostics non bloquants :

- `info`
- `warning`
- `error`

Les erreurs et warnings couvrent notamment :

- version absente ou inconnue ;
- URL de demo invalide ;
- VisualBlueprint absent ou invalide ;
- logo `found` sans URL ;
- couleur invalide ;
- typographie vide ;
- image home invalide ;
- role d'image inconnu ;
- categorie ou importance inconnue ;
- section inconnue.

ProjectDetail ne doit pas planter quand des diagnostics existent.

## Stockage Project

`Project` accepte maintenant :

```ts
lovableOutput?: LovableDemoOutput
```

Pour compatibilite, les champs historiques restent conserves :

- `lovableLink`
- `demoAssets`
- les champs VisualBlueprint deja portes par la configuration agence

Quand un retour officiel est enregistre, ProjectDetail synchronise :

- `lovableOutput`
- `lovableLink`
- une partie compatible de `demoAssets`

Il ne cree pas l'agence et n'applique pas automatiquement le Blueprint.

## Compatibilite anciens projets

`resolveProjectLovableOutput(project)` :

- utilise `project.lovableOutput` s'il existe ;
- sinon reconstruit un retour minimal depuis `lovableLink` et `demoAssets` ;
- ne devine pas les donnees absentes.

## Responsabilites

Lovable fournit :

- lien de demo ;
- VisualBlueprint v1 ;
- logo public ou statut manquant ;
- couleurs ;
- typographies ;
- photos publiques de home ;
- capacites non supportees detectees.

Signature Digital fournit :

- annonces ;
- descriptions de biens ;
- photos d'annonces ;
- donnees metier ;
- espaces vendeur, agent et patron ;
- workflows ;
- auth ;
- permissions ;
- activation.

Le VisualPack ne doit jamais contenir :

- annonce ;
- prix ;
- caracteristique de bien ;
- property photo ;
- photos d'annonces ;
- document ;
- donnees vendeur ;
- donnees privees.

## Procedure manuelle

1. Copier le retour Lovable.
2. Coller dans `ProjectDetail`, bloc `Retour Lovable`.
3. Cliquer sur `Interpreter le retour Lovable`.
4. Lire le resume et les diagnostics.
5. Corriger le retour si necessaire.
6. Enregistrer le retour.

La reception avancee et la validation fluide du VisualBlueprint sont laissees a la PR 21.
